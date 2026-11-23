// node monday/tools/generate.js [--force] [name...]
//
// Draws the four after-images the demo is built around, once, and writes them
// to monday/assets/generated/. The finished page loads those files and makes
// no API call of its own — so this runs on a laptop, by hand, and its output
// is committed.
//
// It reuses the app's backend selection and key rather than working them out a
// second time: the same Vertex routing, the same GEMINI_API_KEY, the same
// generateContent protocol as ai/visual.js. Nothing outside monday/ is written.
//
// A file that already exists is skipped, so re-running costs nothing. Pass
// --force to redraw, or name specific images to redraw only those:
//   node monday/tools/generate.js --force sprinkler-a-replacement

const fs = require('fs');
const path = require('path');

require('../../ai/env')();
const { backend, apiKey } = require('../../ai/draft');
const { IMAGES } = require('./prompts');

const MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-3-pro-image';
const TIMEOUT_MS = Number(process.env.GEMINI_IMAGE_TIMEOUT_MS || 120000);
const RETRIES = 3;
const RETRY_BASE_MS = 4000;
const GAP_MS = 1200;

const SRC = path.join(__dirname, '..', 'assets');
const OUT = path.join(SRC, 'generated');

const sleep = ms => new Promise(r => setTimeout(r, ms));
const mime = f => (f.endsWith('.png') ? 'image/png' : 'image/jpeg');

async function draw(spec, key, api) {
  const photo = fs.readFileSync(path.join(SRC, spec.source)).toString('base64');
  const body = {
    contents: [{
      role: 'user',
      parts: [
        { inlineData: { mimeType: mime(spec.source), data: photo } },
        { text: spec.instruction },
      ],
    }],
    // Both modalities: asking for IMAGE alone is rejected. The model narrates
    // what it drew in a text part and the picture comes back beside it.
    generationConfig: {
      responseModalities: ['TEXT', 'IMAGE'],
      // The before/after slider lays the two frames over each other, so the
      // result has to come back in the source's shape or nothing registers.
      imageConfig: { aspectRatio: spec.aspectRatio },
    },
  };

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), TIMEOUT_MS);
  let res;
  try {
    res = await fetch(api.generate(MODEL), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    const err = new Error(e.name === 'AbortError' ? 'timed out' : `could not reach the model: ${e.message}`);
    err.retryable = true;
    throw err;
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 300);
    try { msg = JSON.parse(text).error.message; } catch (_) {}
    const err = new Error(`${res.status} ${msg}`);
    err.retryable = res.status === 429 || res.status === 500 || res.status === 503;
    throw err;
  }

  const payload = JSON.parse(text);
  const cand = (payload.candidates || [])[0];
  if (!cand) throw new Error(`no candidate (${JSON.stringify(payload.promptFeedback || {})})`);
  const parts = (cand.content && cand.content.parts) || [];
  const img = parts.find(p => p.inlineData && p.inlineData.data);
  // A refusal comes back as text with no image part, and the text says why.
  if (!img) {
    const said = parts.map(p => p.text || '').join(' ').trim().slice(0, 240);
    throw new Error(said || `drew nothing (${cand.finishReason || 'no reason given'})`);
  }
  return Buffer.from(img.inlineData.data, 'base64');
}

(async () => {
  const args = process.argv.slice(2);
  const force = args.includes('--force');
  const only = args.filter(a => !a.startsWith('--'));

  const key = apiKey();
  if (!key) { console.error('No GEMINI_API_KEY in the environment — nothing to draw with.'); process.exit(1); }
  const api = backend();
  console.log(`${api.name} · ${MODEL}\n`);

  fs.mkdirSync(OUT, { recursive: true });

  let drawn = 0, failed = 0;
  for (const spec of IMAGES) {
    const name = spec.file.replace(/\.png$/, '');
    if (only.length && !only.includes(name) && !only.includes(spec.file)) continue;

    const dest = path.join(OUT, spec.file);
    if (fs.existsSync(dest) && !force) { console.log(`· ${spec.file} — already drawn, skipping`); continue; }

    process.stdout.write(`· ${spec.file} — ${spec.title} ... `);
    const t0 = Date.now();
    let last;
    for (let i = 0; i <= RETRIES; i++) {
      try {
        const buf = await draw(spec, key, api);
        fs.writeFileSync(dest, buf);
        console.log(`${Math.round((Date.now() - t0) / 1000)}s · ${Math.round(buf.length / 1024)} KB`);
        drawn++;
        last = null;
        break;
      } catch (e) {
        last = e;
        if (i === RETRIES || !e.retryable) break;
        const wait = RETRY_BASE_MS * Math.pow(2, i);
        process.stdout.write(`\n    ${e.message.slice(0, 90)} — retrying in ${wait / 1000}s ... `);
        await sleep(wait);
      }
    }
    if (last) { console.log(`FAILED\n    ${last.message}`); failed++; }
    await sleep(GAP_MS);
  }

  console.log(`\n${drawn} drawn, ${failed} failed. Output in monday/assets/generated/`);
  process.exit(failed ? 1 : 0);
})();
