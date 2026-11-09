// The dictated memo, transcribed.
//
// The inspector holds the memo bar, the browser records the microphone, and the
// clip arrives here as base64 audio. This sends it to the model with the
// transcription prompt from ai/prompts.js and hands back the words.
//
// Separate from draft.js for the same reason visual.js is: it is a different
// kind of call — audio in, one line of plain text out, nothing to validate
// against the code library. What it shares is the backend and the key, so both
// come from there rather than being worked out twice.
//
// The one piece of policy here is the no-speech case. The model answers with a
// judgement — did anyone speak — and only then a transcript, and when it says
// nobody spoke this returns an empty transcript. An empty box the inspector
// types into is a correct answer. A guess at what the wind might have been
// saying is not: the note is the evidence a record and then an enforcement
// notice are drafted from. See the comment on VOICE.nothing in ai/prompts.js
// for what this model does to four seconds of noise when it is simply asked
// for a transcript.

const prompts = require('./prompts');
const { backend, apiKey, DraftError } = require('./draft');

const sleep = ms => new Promise(r => setTimeout(r, ms));

// The browser sends the recorder's own type, which carries a codec parameter
// ("audio/webm;codecs=opus"). The API wants the bare type.
const baseType = t => String(t || '').split(';')[0].trim().toLowerCase();

/**
 * Transcribe one dictated memo.
 *
 * @param {object} audio  { mimeType, data } the clip, base64
 * @param {object} ctx    { address, hasPhoto, ms } what was on screen when it was said
 * @returns {Promise<{text: string, nothing: boolean, model: string, ms: number}>}
 */
async function transcribe(audio, ctx = {}) {
  const key = apiKey();
  if (!key) throw new DraftError('No GEMINI_API_KEY in the environment', 'no_key');
  if (!audio || !audio.data) throw new DraftError('No audio to transcribe', 'no_audio');

  const V = prompts.VOICE;
  const mimeType = baseType(audio.mimeType) || 'audio/webm';
  if (!V.mimeTypes.includes(mimeType)) {
    throw new DraftError(`This browser recorded ${mimeType}, which cannot be transcribed`, 'bad_audio');
  }

  const api = backend();
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType, data: audio.data } },
        { text: V.instruction(ctx) },
      ],
    }],
    generationConfig: {
      temperature: V.temperature,
      maxOutputTokens: V.maxOutputTokens,
      thinkingConfig: { thinkingBudget: V.thinkingBudget },
      responseMimeType: 'application/json',
      responseSchema: V.schema,
    },
  };

  const t0 = Date.now();
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), V.timeoutMs);
  let res;
  try {
    res = await fetch(api.generate(V.model), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new DraftError(
      e.name === 'AbortError' ? 'Transcription did not come back in time' : 'Could not reach the transcription model',
      'network', String(e.message || e));
  } finally {
    clearTimeout(timer);
  }

  const raw = await res.text();
  if (!res.ok) {
    let msg = raw.slice(0, 400);
    try { msg = JSON.parse(raw).error.message; } catch (_) {}
    const retryable = res.status === 429 || res.status === 500 || res.status === 503;
    throw new DraftError(msg, res.status === 404 ? 'no_model' : retryable ? 'busy' : 'upstream', { status: res.status, retryable });
  }

  let payload;
  try { payload = JSON.parse(raw); } catch (_) { throw new DraftError('Transcription response was not JSON', 'bad_json'); }
  const cand = payload.candidates && payload.candidates[0];
  if (!cand) throw new DraftError('The model returned no transcript', 'empty', payload.promptFeedback);

  const said = ((cand.content && cand.content.parts) || []).map(p => p.text || '').join('').trim();
  if (!said) {
    // A clip the model will not answer on at all — blocked, or cut off before
    // it wrote anything. Not the same as a clip with nothing in it, and it must
    // not be reported as one.
    throw new DraftError(`Nothing came back (${cand.finishReason || 'no reason given'})`, 'no_text', cand.finishReason);
  }

  let out;
  try { out = JSON.parse(said); } catch (_) { throw new DraftError('The transcript came back malformed', 'bad_json', said.slice(0, 200)); }

  // `speech: false` is the answer that says nobody spoke. So is the old
  // no-speech token, in case the model answers in prose anyway.
  const text = clean(String(out.text || ''));
  const nothing = out.speech === false || !text || isNothing(text);

  return {
    text: nothing ? '' : text,
    nothing,
    heard: String(out.heard || '').trim(),
    model: V.model,
    ms: Date.now() - t0,
    tokens: usage(payload),
  };
}

const isNothing = s => s.replace(/[.\s"'`]/g, '').toLowerCase() === prompts.VOICE.nothing.replace(/[.\s]/g, '').toLowerCase();

// Strip what a chat model adds around an answer even when told not to: wrapping
// quotes, a "Transcript:" label, a code fence. Everything else is left alone —
// tidying the inspector's sentence is exactly what must not happen here. The
// one change made to the words is capitalising the first letter: a note that
// opens lower-case reads as a bug rather than as what the inspector said.
function clean(s) {
  let t = s.replace(/^```[a-z]*\s*/i, '').replace(/```$/, '').trim();
  t = t.replace(/^(?:transcript|transcription)\s*:\s*/i, '').trim();
  if (/^["“'].*["”']$/s.test(t)) t = t.slice(1, -1).trim();
  t = t.replace(/\s+/g, ' ').trim();
  return t ? t[0].toUpperCase() + t.slice(1) : t;
}

const usage = p => {
  const u = p.usageMetadata;
  if (!u) return null;
  return { prompt: u.promptTokenCount || 0, output: u.candidatesTokenCount || 0, total: u.totalTokenCount || 0 };
};

// 'busy' is the shared endpoint under load and 'network' is usually a blip. The
// inspector is standing there holding a phone, so these retry fast and few: a
// keyboard that opens in four seconds beats a transcript that lands in thirty.
async function transcribeWithRetry(audio, ctx) {
  const V = prompts.VOICE;
  const tries = Math.max(1, (V.retries || 0) + 1);
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await transcribe(audio, ctx); }
    catch (e) {
      last = e;
      if (i === tries - 1 || (e.code !== 'busy' && e.code !== 'network')) throw e;
      const wait = (V.retryBaseMs || 1200) * Math.pow(2, i);
      console.warn(`  transcription ${e.code} (${e.message.slice(0, 70)}) — retrying in ${wait} ms`);
      await sleep(wait);
    }
  }
  throw last;
}

module.exports = { transcribe: transcribeWithRetry, model: () => prompts.VOICE.model, mimeTypes: () => prompts.VOICE.mimeTypes };
