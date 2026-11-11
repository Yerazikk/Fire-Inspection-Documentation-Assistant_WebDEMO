// The after-image on a recommendation card.
//
// Separate from draft.js because it is a different kind of call: a different
// model, an image out rather than JSON, and nothing to validate against the
// code library. What it shares is the backend choice and the key, so both come
// from there rather than being worked out twice.
//
// This is slow — fifteen to twenty seconds a card, against four for a record —
// which is why nothing waits on it. The client queues these after the
// documents are drafted and the inspector carries on; see visuals.js.

const prompts = require('./prompts');
const { backend, apiKey, DraftError } = require('./draft');

const sleep = ms => new Promise(r => setTimeout(r, ms));

/**
 * Draw the entry's photograph again with one recommendation carried out.
 *
 * @param {object} photo  { mimeType, data } the entry photo, base64
 * @param {object} rec    { title, text }
 * @param {object} ctx    { finding } optional, what the record said about it
 * @returns {Promise<{mimeType: string, data: string, ms: number, model: string}>}
 */
async function illustrate(photo, rec, ctx) {
  const key = apiKey();
  if (!key) throw new DraftError('No GEMINI_API_KEY in the environment', 'no_key');
  if (!photo || !photo.data) throw new DraftError('No photograph to work from', 'no_photo');
  if (!rec || !rec.title) throw new DraftError('No recommendation to illustrate', 'bad_request');

  const V = prompts.VISUAL;
  const api = backend();
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: photo.mimeType || 'image/jpeg', data: photo.data } },
        { text: V.instruction(rec, ctx || {}) },
      ],
    }],
    // Both modalities: the model narrates what it drew, and the image comes
    // back as a second part. Asking for IMAGE alone is rejected.
    generationConfig: { responseModalities: ['TEXT', 'IMAGE'] },
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
      e.name === 'AbortError' ? 'The image model did not answer in time' : 'Could not reach the image model',
      'network', String(e.message || e));
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 400);
    try { msg = JSON.parse(text).error.message; } catch (_) {}
    const retryable = res.status === 429 || res.status === 500 || res.status === 503;
    throw new DraftError(msg, res.status === 404 ? 'no_model' : retryable ? 'busy' : 'upstream', { status: res.status, retryable });
  }

  let payload;
  try { payload = JSON.parse(text); } catch (_) { throw new DraftError('Image response was not JSON', 'bad_json'); }
  const cand = payload.candidates && payload.candidates[0];
  if (!cand) throw new DraftError('Image model returned no candidate', 'empty', payload.promptFeedback);
  const parts = (cand.content && cand.content.parts) || [];
  const img = parts.find(p => p.inlineData && p.inlineData.data);
  // A refusal comes back as text with no image part, and the text says why.
  if (!img) {
    const said = parts.map(p => p.text || '').join(' ').trim().slice(0, 200);
    throw new DraftError(said || `Image model drew nothing (${cand.finishReason || 'no reason given'})`, 'no_image', cand.finishReason);
  }

  return {
    mimeType: img.inlineData.mimeType || 'image/png',
    data: img.inlineData.data,
    ms: Date.now() - t0,
    model: V.model,
  };
}

// 'busy' is the shared endpoint under load and 'network' is usually a blip.
// A refusal, a missing model or a bad request will fail the same way again.
async function illustrateWithRetry(photo, rec, ctx) {
  const V = prompts.VISUAL;
  const tries = Math.max(1, (V.retries || 0) + 1);
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await illustrate(photo, rec, ctx); }
    catch (e) {
      last = e;
      if (i === tries - 1 || (e.code !== 'busy' && e.code !== 'network')) throw e;
      const wait = (V.retryBaseMs || 2000) * Math.pow(2, i);
      console.warn(`  visual ${e.code} (${e.message.slice(0, 70)}) — retrying in ${wait} ms`);
      await sleep(wait);
    }
  }
  throw last;
}

module.exports = { illustrate: illustrateWithRetry, model: () => prompts.VISUAL.model };
