// The three endpoints, with no host in them.
//
// Each takes a parsed request and returns { status, body }; logging goes to
// stdout, which is the terminal locally and the function log on Vercel. The
// local server (serve.js) and the Vercel functions (api/) are both thin
// adapters over this, so the two hosts cannot drift apart.
require('./env')();

const ai = require('./draft');
const codes = require('./codes');
const visual = require('./visual');
const prompts = require('./prompts');

async function status({ models = false } = {}) {
  const out = {
    key: ai.keyPresent(), backend: ai.backend().name, model: prompts.MODEL.name,
    imageModel: visual.model(), jurisdiction: codes.meta.jurisdiction,
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
  if (!ctx || !ctx.photo || !ctx.photo.data) return { status: 400, body: { error: 'no photograph to annotate' } };
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

module.exports = { status, draft, illustrate };
