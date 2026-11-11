// The endpoints, with no host in them.
//
// Each takes a parsed request and returns { status, body }; logging goes to
// stdout, which is the terminal locally and the function log on Vercel. The
// local server (serve.js) and the Vercel functions (api/) are both thin
// adapters over this, so the two hosts cannot drift apart.
require('./env')();

const ai = require('./draft');
const codes = require('./codes');
const visual = require('./visual');
const maps = require('./maps');
const voice = require('./voice');
const prompts = require('./prompts');

async function status({ models = false } = {}) {
  const out = {
    key: ai.keyPresent(), backend: ai.backend().name, model: prompts.MODEL.name,
    imageModel: visual.model(), voiceModel: voice.model(), jurisdiction: codes.meta.jurisdiction,
    edition: codes.meta.edition, ordinance: codes.meta.ordinance,
    effective: codes.meta.effective, retrieved: codes.meta.retrieved,
    codes: codes.codes.length,
  };
  if (ai.keyPresent() && models) {
    try { out.models = await ai.listModels(); } catch (e) { out.modelsError = e.message; }
  }
  return { status: 200, body: out };
}

async function draft(ctx) {
  const kind = ctx && ctx.kind;
  if (!['record', 'report', 'notice'].includes(kind)) return { status: 400, body: { error: 'kind must be "record", "report" or "notice"' } };
  try {
    const doc = await ai.draft(kind, ctx);
    const what = kind === 'record' ? `record for entry ${ctx.entry && ctx.entry.n}` : kind;
    const shot = ctx.entry && ctx.entry.photo && ctx.entry.photo.data;
    const seen = shot ? ` · photo ${Math.round(shot.length * 3 / 4 / 1024)} KB${doc.scan ? ', ' + ((doc.scan.boxes || []).length + (doc.scan.issue ? 1 : 0)) + ' boxes' : ', no boxes'}` : '';
    console.log(`  drafted ${what} at ${ctx.address} · ${doc.meta.ms} ms · ${doc.meta.tokens ? doc.meta.tokens.total + ' tokens' : 'usage unknown'}${seen}`);
    if (doc.audit.unknownCitations.length) console.warn('  ! citations not in the library:', doc.audit.unknownCitations.join('; '));
    return { status: 200, body: { doc } };
  } catch (e) {
    console.error(`  draft ${kind} failed [${e.code || 'error'}]: ${e.message}`);
    return { status: e.code === 'no_key' ? 503 : 502, body: { error: e.message, code: e.code || 'error' } };
  }
}

async function illustrate(ctx) {
  if (!ctx || !ctx.photo || !ctx.photo.data) return { status: 400, body: { error: 'no photograph to work from' } };
  if (!ctx.rec || !ctx.rec.title) return { status: 400, body: { error: 'no recommendation to illustrate' } };
  try {
    const out = await visual.illustrate(ctx.photo, ctx.rec, { finding: ctx.finding });
    console.log(`  drew "${String(ctx.rec.title).slice(0, 44)}" at ${ctx.address || 'unknown'} · ${out.ms} ms · ${Math.round(out.data.length * 3 / 4 / 1024)} KB`);
    return { status: 200, body: { image: { mimeType: out.mimeType, data: out.data }, model: out.model, ms: out.ms, gapMs: prompts.VISUAL.gapMs } };
  } catch (e) {
    console.error(`  visual failed [${e.code || 'error'}]: ${e.message}`);
    return { status: e.code === 'no_key' ? 503 : 502, body: { error: e.message, code: e.code || 'error' } };
  }
}

// The held memo. Logged by length and duration rather than by content: a field
// note is the inspector's, and this is a server log.
async function transcribe(ctx) {
  const audio = ctx && ctx.audio;
  if (!audio || !audio.data) return { status: 400, body: { error: 'no audio to transcribe' } };
  try {
    const out = await voice.transcribe(audio, { address: ctx.address, hasPhoto: !!ctx.hasPhoto, ms: ctx.ms, meter: ctx.meter });
    const kb = Math.round(audio.data.length * 3 / 4 / 1024);
    console.log(`  transcribed ${(Number(ctx.ms) / 1000 || 0).toFixed(1)} s of audio · ${kb} KB · ${out.ms} ms · ` +
      (out.nothing ? `no speech in it${out.heard ? ' (' + out.heard + ')' : ''}` : `${out.text.split(/\s+/).length} words`));
    return { status: 200, body: { text: out.text, nothing: out.nothing, model: out.model, ms: out.ms } };
  } catch (e) {
    console.error(`  transcription failed [${e.code || 'error'}]: ${e.message}`);
    return { status: e.code === 'no_key' ? 503 : e.code === 'bad_audio' ? 415 : 502, body: { error: e.message, code: e.code || 'error' } };
  }
}

// ---- Google Maps ---------------------------------------------------------
// The page needs the Maps JavaScript API key to draw the interactive lot view,
// and that one cannot be proxied: it is the one secret this app hands over
// deliberately, which is why it has its own variable. Not logged — the local
// host says it at startup, and the page says it in its own console.
const mapsConfig = () => maps.config();

// The street-level still of a property. Only the misses are logged: a hit is
// one line per pin tap and says nothing, while "no imagery at 120 Bolinas Rd"
// is the reason a preview looks empty.
async function streetview(q) {
  const out = await maps.streetview(q);
  if (!out.buffer) console.warn(`  street view ${q && q.lat},${q && q.lon} [${out.body.code}]: ${out.body.error}`);
  return out;
}

module.exports = { status, draft, illustrate, transcribe, mapsConfig, streetview };
