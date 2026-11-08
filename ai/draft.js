// The drafting engine. Builds the request from ai/prompts.js, calls Gemini,
// and validates what comes back before it is allowed near the UI.
//
// Plumbing only — prompt wording lives in ai/prompts.js, code text in
// ai/codes.js. The one piece of policy here is `checkCitations`, which enforces
// in code the rule the prompt also states: nothing may be cited that is not in
// the library. A prompt rule that is not also checked is a suggestion.

const prompts = require('./prompts');
const codes = require('./codes');

// Two hosts serve the same generateContent protocol, and which one a key may
// use is a property of the key:
//   Vertex AI          — a key issued by a Google Cloud project (AQ.…), bound
//                        to a service account. Needs the project and location
//                        in the URL. Blocked on the AI Studio host.
//   AI Studio          — a plain key from aistudio.google.com (AIza…). Project
//                        is implied by the key.
// Set GOOGLE_CLOUD_PROJECT to use Vertex; without it this falls back to AI
// Studio. The request and response bodies are identical either way, so nothing
// below this block cares which one is in play.
const VERTEX_HOST = 'https://aiplatform.googleapis.com/v1';
const STUDIO_HOST = 'https://generativelanguage.googleapis.com/v1beta';

const apiKey = () => (process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '').trim();

function backend() {
  const project = (process.env.GOOGLE_CLOUD_PROJECT || '').trim();
  if (!project) {
    return {
      name: 'AI Studio',
      generate: model => `${STUDIO_HOST}/models/${encodeURIComponent(model)}:generateContent`,
    };
  }
  const location = (process.env.GOOGLE_CLOUD_LOCATION || 'global').trim();
  return {
    name: `Vertex AI · ${project} · ${location}`,
    project,
    location,
    generate: model =>
      `${VERTEX_HOST}/projects/${project}/locations/${location}` +
      `/publishers/google/models/${encodeURIComponent(model)}:generateContent`,
  };
}

const keyPresent = () => !!apiKey();

class DraftError extends Error {
  constructor(message, code, detail) {
    super(message);
    this.code = code;
    this.detail = detail;
  }
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const PAYLOAD = { prose: 'body', list: 'items', fields: 'fields', codes: 'codes' };

function normalizeSection(s) {
  if (!s || typeof s !== 'object') return null;
  const type = PAYLOAD[s.type] ? s.type : 'prose';
  const out = { id: String(s.id || '').trim() || 'section', heading: String(s.heading || '').trim(), type };
  if (type === 'prose') {
    out.body = String(s.body || '').trim();
    if (!out.body && Array.isArray(s.items) && s.items.length) out.body = s.items.join(' ');
    if (!out.body) return null;
  } else if (type === 'list') {
    out.items = (Array.isArray(s.items) ? s.items : []).map(x => String(x || '').trim()).filter(Boolean);
    if (!out.items.length) return null;
  } else if (type === 'fields') {
    out.fields = (Array.isArray(s.fields) ? s.fields : [])
      .map(f => ({ label: String((f && f.label) || '').trim(), value: String((f && f.value) || '').trim() }))
      .filter(f => f.label || f.value);
    if (!out.fields.length) return null;
  } else {
    out.codes = (Array.isArray(s.codes) ? s.codes : [])
      .map(c => ({
        scope: c && c.scope === 'Local' ? 'Local' : 'State',
        citation: String((c && c.citation) || '').trim(),
        title: String((c && c.title) || '').trim(),
        relevance: String((c && c.relevance) || '').trim(),
      }))
      .filter(c => c.citation);
    if (!out.codes.length) return null;
  }
  return out;
}

// Loose match: the model is told to copy the citation string exactly, but a
// trailing word or different dash should not throw the section away. Compare on
// the section numbers, which are the part that matters.
const sectionNumbers = s => (String(s).match(/\d+[0-9.–-]*/g) || []).join(' ');

const KNOWN = codes.codes.map(c => ({
  id: c.id, citation: c.citation, nums: sectionNumbers(c.citation),
  status: c.status, provenance: c.provenance,
}));

function matchCitation(citation) {
  const nums = sectionNumbers(citation);
  return KNOWN.find(k => k.citation === citation) ||
    KNOWN.find(k => nums && k.nums === nums) ||
    KNOWN.find(k => nums && k.nums && (k.nums.includes(nums) || nums.includes(k.nums))) ||
    null;
}

/**
 * Audit a flat list of cited sections, flagging each in place.
 *   unverified — not in the library at all. The model made it up.
 *   pending    — in the library but not yet enforceable.
 *   unsourced  — in the library but its text was never transcribed from a
 *                primary source (the building corpus). Citable, but the UI
 *                should say so; see ai/codes.js meta.provenanceCaveat.
 */
function auditList(list) {
  const unknown = [];
  const notEnforceable = [];
  const notSourced = [];
  for (const c of list) {
    const hit = matchCitation(c.citation);
    if (!hit) { unknown.push(c.citation); c.unverified = true; continue; }
    // The match is deliberately loose, so what came back may be the right
    // section spelled differently — or with the title run onto the end of it.
    // Store the library's string rather than the model's, so the citation the
    // inspector reads is exactly the one on file.
    c.citation = hit.citation;
    if (hit.status !== 'current') { notEnforceable.push(c.citation); c.pending = true; }
    if (hit.provenance === 'unverified') { notSourced.push(c.citation); c.unsourced = true; }
  }
  return { unknown, notEnforceable, notSourced };
}

function checkCitations(doc) {
  const all = [];
  for (const s of doc.sections) if (s.type === 'codes') all.push(...s.codes);
  return auditList(all);
}

function auditBlock(a) {
  return {
    unknownCitations: a.unknown,
    pendingCitations: a.notEnforceable,
    unsourcedCitations: a.notSourced,
    codeEdition: codes.meta.edition,
    codeEditionCaveat: codes.meta.editionCaveat,
    provenanceCaveat: codes.meta.provenanceCaveat,
    codesRetrieved: codes.meta.retrieved,
  };
}

function validate(kind, raw) {
  if (!raw || typeof raw !== 'object') throw new DraftError('Model returned no document', 'bad_shape');
  const sections = (Array.isArray(raw.sections) ? raw.sections : []).map(normalizeSection).filter(Boolean);
  if (!sections.length) throw new DraftError('Model returned no usable sections', 'bad_shape', raw);
  const doc = kind === 'report'
    ? { kind, headline: String(raw.headline || '').trim(), sections }
    : {
        kind,
        subject: String(raw.subject || '').trim(),
        greeting: String(raw.greeting || '').trim() || 'Dear Property Owner,',
        closing: String(raw.closing || '').trim(),
        sections,
      };
  doc.audit = auditBlock(checkCitations(doc));
  return doc;
}

// ---------------------------------------------------------------------------
// Record validation
//
// The record screen in app.js renders a fixed shape that predates the model
// (it was fixture data in data.js). The model answers in its own schema and
// this maps one to the other, so neither side has to know about the other:
//   summary    [[label, value], ...]
//   severity   { level, score, why }
//   category   [chip, ...]
//   estimates  [[label, value], ...]
//   codes      [{ scope, c, t }, ...]
//   recs       [{ id, title, text }, ...]
// ---------------------------------------------------------------------------

const LEVELS = { Violation: 'violation', Compliant: 'compliance', Note: 'note' };

const pairs = (arr, cap) => (Array.isArray(arr) ? arr : [])
  .map(x => [String((x && x.label) || '').trim(), String((x && x.value) || '').trim()])
  .filter(([l, v]) => l || v)
  .slice(0, cap);

/**
 * The boxes the model drew on the photograph, in the shape the overlay draws.
 *
 * Gemini reports a box as [ymin, xmin, ymax, xmax] normalised to 0–1000; the
 * overlay positions elements with CSS percentages of left/top/width/height.
 * Degenerate and inverted boxes come back often enough to be worth repairing
 * rather than dropping, but one covering nearly the whole frame is not a
 * finding pointed at, it is the model shrugging — those go.
 */
function normalizeScan(raw) {
  const TONES = ['cyan', 'red', 'green'];
  const items = (Array.isArray(raw) ? raw : []).map(b => {
    const n = (Array.isArray(b && b.box) ? b.box : []).map(Number);
    if (n.length !== 4 || n.some(v => !isFinite(v))) return null;
    const [y0, x0, y1, x1] = [Math.min(n[0], n[2]), Math.min(n[1], n[3]), Math.max(n[0], n[2]), Math.max(n[1], n[3])];
    const left = Math.max(0, Math.min(100, x0 / 10));
    const top = Math.max(0, Math.min(100, y0 / 10));
    const width = Math.max(0, Math.min(100 - left, (x1 - x0) / 10));
    const height = Math.max(0, Math.min(100 - top, (y1 - y0) / 10));
    const label = String((b && b.label) || '').trim().slice(0, 48);
    if (!label || width < 1.5 || height < 1.5) return null;
    if (width > 97 && height > 97) return null;
    return { label, box: [+left.toFixed(1), +top.toFixed(1), +width.toFixed(1), +height.toFixed(1)],
      tone: TONES.includes(b && b.tone) ? b.tone : 'cyan' };
  }).filter(Boolean).slice(0, 7);

  if (!items.length) return null;
  // The overlay draws one highlighted finding plus any number of plain
  // element boxes, so split them that way whatever order they arrived in.
  const i = items.findIndex(b => b.tone !== 'cyan');
  const issue = i >= 0 ? items.splice(i, 1)[0] : null;
  return { boxes: items, issue, source: 'model' };
}

function validateRecord(raw, ctx) {
  if (!raw || typeof raw !== 'object') throw new DraftError('Model returned no record', 'bad_shape');

  const summary = pairs(raw.summary, 4);
  if (!summary.length) throw new DraftError('Model returned no usable summary', 'bad_shape', raw);

  const det = raw.determination || {};
  // The inspector's determination wins. The model is told to repeat it, but if
  // it re-decided anyway, the recorded one is the one that counts.
  const recorded = ctx && ctx.entry && ctx.entry.level;
  const level = LEVELS[String(det.level || '')] ? String(det.level) : (recorded || 'Note');
  const band = prompts.SEVERITY_BANDS[String(det.band || '')] ? String(det.band) : 'None';
  // A compliant entry or a note is never given a severity number, whatever the
  // model said. And the number itself is ours: the model picks a band only.
  const scored = level === 'Violation';
  const score = scored ? prompts.SEVERITY_BANDS[band].score : 0;

  const rec = {
    kind: 'record',
    summary,
    severity: {
      level: level === 'Violation' ? band === 'None' ? 'Violation' : band : level,
      score,
      why: String(det.why || '').trim() || 'No reason recorded.',
      band,
      determination: level,
    },
    category: (Array.isArray(raw.categories) ? raw.categories : [])
      .map(c => String(c || '').trim()).filter(Boolean).slice(0, 3),
    estimates: pairs(raw.measurements, 6),
    codes: (Array.isArray(raw.codes) ? raw.codes : [])
      .map(c => ({
        scope: ['State', 'Local', 'Standard'].includes(c && c.scope) ? c.scope : 'State',
        citation: String((c && c.citation) || '').trim(),
        c: String((c && c.citation) || '').trim(),
        t: String((c && c.relevance) || '').trim(),
      }))
      .filter(c => c.citation)
      .slice(0, 4),
    recs: level === 'Violation'
      ? (Array.isArray(raw.recommendations) ? raw.recommendations : [])
          .map((r, i) => ({
            id: 'r' + (i + 1),
            title: String((r && r.title) || '').trim(),
            text: String((r && r.text) || '').trim(),
          }))
          .filter(r => r.title && r.text)
          .slice(0, 5)
      : [],
  };

  rec.scan = normalizeScan(raw.scan);
  // What the photograph appears to show that the note does not account for.
  // Empty whenever they agree, which is most of the time.
  rec.photoNote = String(raw.photoNote || '').trim().slice(0, 300);
  rec.audit = auditBlock(auditList(rec.codes));
  // The audit canonicalised `citation`; the renderer reads `c`, so carry it
  // across and drop the field it no longer needs.
  rec.codes.forEach(c => { c.c = c.citation; delete c.citation; });
  return rec;
}

// ---------------------------------------------------------------------------
// The call
// ---------------------------------------------------------------------------

async function callGemini({ system, user, image, schema, model }) {
  const key = apiKey();
  if (!key) throw new DraftError('No GEMINI_API_KEY in the environment', 'no_key');
  const api = backend();

  // The photograph goes ahead of the text. Gemini attends to an image better
  // when it arrives before the instructions that refer to it, and the prompt
  // reads as "here is the scene, now here is what was noted about it".
  const parts = image
    ? [{ inlineData: { mimeType: image.mimeType, data: image.data } }, { text: user }]
    : [{ text: user }];

  const body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts }],
    generationConfig: {
      temperature: model.temperature,
      topP: model.topP,
      maxOutputTokens: model.maxOutputTokens,
      responseMimeType: 'application/json',
      responseSchema: schema,
    },
  };
  if (typeof model.thinkingBudget === 'number') {
    body.generationConfig.thinkingConfig = { thinkingBudget: model.thinkingBudget };
  }

  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), model.timeoutMs);
  let res;
  try {
    res = await fetch(api.generate(model.name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(body),
      signal: ctl.signal,
    });
  } catch (e) {
    throw new DraftError(e.name === 'AbortError' ? 'The model did not answer in time' : 'Could not reach the model', 'network', String(e.message || e));
  } finally {
    clearTimeout(timer);
  }

  const text = await res.text();
  if (!res.ok) {
    let msg = text.slice(0, 600);
    try { msg = JSON.parse(text).error.message; } catch (_) {}
    // A per-day quota error is a 429 like any other, but retrying it spends
    // three more requests against the quota that is already gone. Separate it.
    const daily = res.status === 429 && /per day|free_tier|quota/i.test(msg);
    if (daily) {
      const when = ((msg.match(/retry in ([0-9hms.]+)/i) || [])[1] || '').replace(/\.$/, '');
      const cause = api.project
        ? 'The project is over its Vertex AI quota for this model; see README.md.'
        : 'Free AI Studio keys allow a limited number of requests per day; see README.md.';
      throw new DraftError(`Daily model quota exhausted${when ? ' — resets in ' + when.replace(/\.\d+s/, 's') : ''}. ${cause}`, 'quota', { status: 429 });
    }
    const retryable = res.status === 429 || res.status === 500 || res.status === 503;
    throw new DraftError(msg, res.status === 400 || res.status === 403 ? 'rejected' : retryable ? 'busy' : 'upstream', { status: res.status, retryable });
  }

  let payload;
  try { payload = JSON.parse(text); } catch (_) { throw new DraftError('Model response was not JSON', 'bad_json', text.slice(0, 600)); }

  const cand = payload.candidates && payload.candidates[0];
  if (!cand) throw new DraftError('Model returned no candidate', 'empty', payload.promptFeedback);
  if (cand.finishReason && !['STOP', 'MAX_TOKENS'].includes(cand.finishReason)) {
    throw new DraftError(`Model stopped: ${cand.finishReason}`, 'stopped', cand.finishReason);
  }
  const out = (cand.content && cand.content.parts || []).map(p => p.text || '').join('');
  if (!out.trim()) throw new DraftError('Model returned empty text', 'empty');

  let parsed;
  try { parsed = JSON.parse(out); } catch (_) {
    // Structured output should make this impossible, but a truncated response
    // is still JSON-shaped garbage. Try the outermost object.
    const m = out.match(/\{[\s\S]*\}/);
    let ok = false;
    if (m) { try { parsed = JSON.parse(m[0]); ok = true; } catch (_) { /* fall through */ } }
    if (!ok) {
      // Say which failure this is. A response that stopped at the token
      // ceiling is not malformed JSON — it is unfinished, and the fix is a
      // higher ceiling or a shorter document, not a retry.
      if (cand.finishReason === 'MAX_TOKENS') {
        throw new DraftError(
          `The model hit its output limit (${model.maxOutputTokens} tokens) and the document was cut off mid-sentence. Raise GEMINI_MAX_OUTPUT_TOKENS.`,
          'truncated', { finish: 'MAX_TOKENS', chars: out.length });
      }
      throw new DraftError('Model returned malformed JSON', 'bad_json', out.slice(0, 600));
    }
  }

  return { parsed, usage: payload.usageMetadata || null, finish: cand.finishReason || null };
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

// 'busy' is the shared endpoint under load and 'network' is usually a blip;
// both are worth another go. Everything else — a bad key, a rejected prompt,
// a retired model id — will fail identically on the next attempt.
async function callWithRetry(req) {
  const tries = Math.max(1, (req.model.retries || 0) + 1);
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await callGemini(req); }
    catch (e) {
      last = e;
      if (i === tries - 1 || (e.code !== 'busy' && e.code !== 'network')) throw e;
      const wait = (req.model.retryBaseMs || 1500) * Math.pow(2, i);
      console.warn(`  model ${e.code} (${e.message.slice(0, 80)}) — retrying in ${wait} ms`);
      await sleep(wait);
    }
  }
  throw last;
}

/**
 * Draft one document.
 * @param {'record'|'report'|'notice'} kind
 * @param {object} ctx  inspection context, built by the client (see app.js draftCtx)
 */
async function draft(kind, ctx) {
  if (!['record', 'report', 'notice'].includes(kind)) throw new DraftError('Unknown document kind', 'bad_kind');
  const req = prompts.assemble(kind, ctx);
  const t0 = Date.now();
  const { parsed, usage, finish } = await callWithRetry(req);
  const doc = kind === 'record' ? validateRecord(parsed, ctx) : validate(kind, parsed);
  doc.meta = {
    model: req.model.name,
    ms: Date.now() - t0,
    tokens: usage ? { in: usage.promptTokenCount, out: usage.candidatesTokenCount, total: usage.totalTokenCount } : null,
    finish,
    generatedAt: new Date().toISOString(),
  };
  return doc;
}

// Candidates to probe on Vertex, which has no key-readable model list. Keep the
// ids the app might plausibly be pinned to; a 404 here just means "not served
// to this project in this location", which is the answer being looked for.
const PROBE_MODELS = [
  'gemini-3.6-flash', 'gemini-3.6-pro',
  'gemini-3.5-flash', 'gemini-3.5-flash-lite', 'gemini-3.5-pro',
  'gemini-2.5-flash', 'gemini-2.5-flash-lite', 'gemini-2.5-pro',
];

/**
 * Diagnostics for /api/ai/status — which models this key can actually use.
 * AI Studio publishes a list. Vertex does not expose one to an API key, so
 * there each candidate is probed with the smallest possible request; that
 * spends a few tokens per model, which is why this is not called on startup.
 */
async function listModels() {
  const key = apiKey();
  if (!key) throw new DraftError('No GEMINI_API_KEY in the environment', 'no_key');
  const api = backend();

  if (!api.project) {
    const res = await fetch(`${STUDIO_HOST}/models?pageSize=200`, { headers: { 'x-goog-api-key': key } });
    const text = await res.text();
    if (!res.ok) throw new DraftError(text.slice(0, 400), 'upstream', { status: res.status });
    const json = JSON.parse(text);
    return (json.models || [])
      .filter(m => (m.supportedGenerationMethods || []).includes('generateContent'))
      .map(m => m.name.replace(/^models\//, ''));
  }

  const probe = async name => {
    const res = await fetch(api.generate(name), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        contents: [{ role: 'user', parts: [{ text: 'hi' }] }],
        generationConfig: { maxOutputTokens: 1, thinkingConfig: { thinkingBudget: 0 } },
      }),
    });
    if (res.ok) return name;
    // 401/403 is the key, not the model — surface it rather than reporting
    // every model as missing.
    if (res.status === 401 || res.status === 403) {
      let msg = (await res.text()).slice(0, 300);
      try { msg = JSON.parse(msg).error.message; } catch (_) {}
      throw new DraftError(msg, 'rejected', { status: res.status });
    }
    return null;
  };

  const results = await Promise.all(PROBE_MODELS.map(probe));
  return results.filter(Boolean);
}

module.exports = { draft, listModels, keyPresent, backend, apiKey, DraftError, validate, validateRecord };
