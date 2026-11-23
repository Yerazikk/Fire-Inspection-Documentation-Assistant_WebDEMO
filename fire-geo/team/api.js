// team/api.js: the Inspectors tab's drafting endpoint. Mounted by /server.js (and by team/serve.js for tests).
//
//   GET  /api/team/draft   -> { ok, fake }                      a probe. Never calls the model.
//   POST /api/team/draft   -> a rewritten draft, or the inspector's own recommendation drafted
//     body  { target: 'problem' | 'solution' | 'own', scene: 'ladder' | 'sprinkler', place: 'ross' | ...,
//             solution?: 'a' | 'b' | 'c',                       which source correction is being rewritten
//             instruction: 'shorter' | 'say which bushes' | ... (for 'own': the inspector's idea, one sentence)
//             current?: { title?, text?, steps?: [..] },        the draft on screen, with the inspector's edits
//             facts?: { ... } }                                 what the field inspector collected
//     reply { ok, source: 'model' | 'builtin' | 'fake', title?, text?, steps?, standing?, removed: [..], note? }
//
// The model is the locally signed-in Claude CLI, called the way Andrew's other projects call it (tarot/read-api.js):
// find the real binary, drop CLAUDE* from the environment, prompt on stdin, hard timeout, one retry on bad JSON.
// Nothing is sent but the finding's own content: the vetted source text for that finding and place, the draft on
// screen and the inspector's request. The reply is checked here, before it reaches the page: any sentence with a
// section number, measurement, number or deadline that is not in the supplied material is removed (drafts.js guard).
// If the CLI cannot be reached the built-in rewrite answers instead and says so.
//   TEAM_DRAFT_FAKE=1   no model call at all (tests and screenshots)
//   TEAM_DRAFT_MODEL    model id (default claude-opus-5-5)      CLAUDE_BIN  path to the CLI
const { spawn, spawnSync } = require('child_process'), fs = require('fs'), path = require('path'), os = require('os'), vm = require('vm');
const ROOT = path.join(__dirname, '..');
const MODEL = process.env.TEAM_DRAFT_MODEL || 'claude-opus-5-5';
const TIMEOUT_MS = 100000;

const cleanEnv = () => { const env = { ...process.env }; for (const k of Object.keys(env)) if (/^CLAUDE/i.test(k) || k === 'AI_AGENT') delete env[k]; return env; };
function findClaude() { // the `claude` on PATH is a dead stub on this Mac; the real one lives in the desktop app bundle
  const home = os.homedir(), cands = []; if (process.env.CLAUDE_BIN) cands.push(process.env.CLAUDE_BIN);
  const bundle = path.join(home, 'Library/Application Support/Claude/claude-code');
  try { for (const v of fs.readdirSync(bundle).sort().reverse()) for (const h of fs.readdirSync(path.join(bundle, v))) cands.push(path.join(bundle, v, h, 'claude.app/Contents/MacOS/claude')); } catch { }
  cands.push(path.join(home, '.claude/local/claude'), path.join(home, '.claude/local/bin/claude'), 'claude');
  for (const c of cands) { try { const r = spawnSync(c, ['--version'], { encoding: 'utf8', timeout: 15000, env: cleanEnv() }); if (!r.error && r.status === 0 && /Claude Code/i.test(r.stdout || '')) return c; } catch { } }
  return 'claude';
}
let BIN = null; const bin = () => BIN || (BIN = findClaude());

// The same data and the same logic the page uses, loaded into a sandbox: the shared FireGeo modules (no DOM),
// then this tab's adapter and drafts. Built per request so an edited source file is picked up at once.
function world() {
  const sb = { console: { log() { }, warn() { }, error() { } } }; sb.window = sb; vm.createContext(sb);
  for (const f of ['data/jurisdictions.js', 'data/content.js', 'data/hazard.js', 'data/law.js', 'data/outlines.js', 'lib/geo.js', 'lib/codes.js', 'lib/solutions.js', 'team/adapter.js', 'team/drafts.js']) {
    try { vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), sb, { filename: f }); } catch (e) { /* a missing shared file only means less grounding */ }
  }
  if (!sb.CONTENT || !sb.TeamData || !sb.TeamDrafts) throw new Error('source data did not load');
  return sb;
}

const clean = (s, n) => String(s == null ? '' : s).replace(/[\u0000-\u001f]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, n);
function readBody(raw, sb) {
  let b; try { b = JSON.parse(raw); } catch { return { error: 'bad JSON' }; }
  if (!b || !['problem', 'solution', 'own'].includes(b.target)) return { error: 'target must be problem, solution or own' };
  if (!sb.CONTENT[b.scene]) return { error: 'unknown scene' };
  if (!sb.TeamData.PLACES.includes(b.place)) return { error: 'unknown place' };
  const instruction = clean(b.instruction, 300); if (instruction.length < 2) return { error: 'say what to change' };
  const cur = b.current || {}, current = { title: clean(cur.title, 120), text: clean(cur.text, 2400), steps: (Array.isArray(cur.steps) ? cur.steps : []).slice(0, 9).map(s => clean(s, 500)).filter(Boolean) };
  if (b.target === 'problem' && !current.text) return { error: 'send the current paragraph' };
  if (b.target === 'solution' && !current.steps.length) return { error: 'send the current steps' };
  const solution = (sb.CONTENT[b.scene].solutions || []).some(s => s.id === b.solution) ? b.solution : null;
  // what the field inspector answered, in the shape TeamFlow.facts() gives it: only known keys, only plain values
  const f = b.facts && typeof b.facts === 'object' ? b.facts : {}, facts = {}, word = v => typeof v === 'string' && /^[a-z0-9]{2,12}$/.test(v);
  if (f.distance && typeof f.distance === 'object' && /^(exact|estimate|unsure)$/.test(f.distance.kind)) {
    const d = { kind: f.distance.kind };
    if (d.kind !== 'unsure') { if (!isFinite(f.distance.feet)) d.kind = 'unsure'; else d.feet = Math.max(0, Math.min(999, Math.round(+f.distance.feet))); }
    if (d.kind === 'estimate') { d.bucket = word(f.distance.bucket) ? f.distance.bucket : ''; d.label = clean(f.distance.label, 30) || 'an estimate'; }
    facts.distance = d;
  }
  for (const k of ['touch', 'dry', 'beside', 'plant', 'paint', 'plate']) if (word(f[k])) facts[k] = f[k];
  if (isFinite(f.year) && +f.year >= 1850 && +f.year <= 2100) facts.year = Math.round(+f.year);
  if (f.yearCant === true) facts.yearCant = true;
  return { target: b.target, scene: b.scene, place: b.place, solution, instruction, current, facts };
}

function prompt(b, material) {
  const own = b.target === 'own', prob = b.target === 'problem';
  const job = prob ? 'Rewrite the paragraph that tells a property owner what was found, why it matters, what to do, what to leave alone, and by when.'
    : own ? 'Draft a new recommendation from the inspector’s own idea: a short name, then step-by-step instructions for the property owner.'
      : 'Rewrite the step-by-step instructions that tell a property owner how to carry out this correction.';
  const cur = prob ? 'CURRENT DRAFT (one paragraph):\n' + b.current.text + '\n\n'
    : own ? '' : 'CURRENT DRAFT\nName: ' + b.current.title + '\nSteps:\n' + b.current.steps.map((s, i) => (i + 1) + '. ' + s).join('\n') + '\n\n';
  const shape = prob ? '{"text":"the paragraph"}' : '{"title":"a short name with no full stop","steps":["first step","second step","and so on"]}';
  return `You help a fire inspector write to a property owner after an inspection. ${job}

SUPPLIED MATERIAL (the only facts you may use):
${material}

${cur}THE INSPECTOR'S ${own ? 'IDEA' : 'REQUEST'}: ${b.instruction}

Rules:
- Plain language at about a 6th-grade reading level. Short sentences. Everyday words. The first time a fire term appears, explain it in a few words.
- No em dashes. No metaphors. No headings and no markdown.
- Add NO citations, section numbers, measurements, numbers, deadlines, names, products or facts that are not in the supplied material${own ? ' or the idea' : ' or the current draft'}. If the request asks for one that is not there, leave it out.
${prob ? '- Keep it to one paragraph. Say what to do and what to leave alone.' : '- 3 to 7 steps. Each step is one concrete action. Say what to do, where to stop and what must stay.'}
- Do not make the correction stricter or looser than the material says. Keep every "do not" and every approval requirement.
- Write to the owner as "you".
${own ? '- Stay inside the inspector’s idea. End with a step that says where to stop, or to ask the inspector when unsure.\n' : ''}
Reply with ONLY a valid JSON object, no code fence. Do not use double quote characters inside any string value. Use exactly this shape:
${shape}`;
}
function parse(out, b) {
  let txt = out; try { const j = JSON.parse(out); txt = j.result ?? j.text ?? out; } catch { }
  txt = String(txt); const a = txt.indexOf('{'), z = txt.lastIndexOf('}'); if (a < 0 || z <= a) throw new Error('no JSON in reply');
  const r = JSON.parse(txt.slice(a, z + 1));
  if (b.target === 'problem') { if (typeof r.text !== 'string' || r.text.length < 20) throw new Error('reply has the wrong shape'); return { text: r.text }; }
  if (typeof r.title !== 'string' || !Array.isArray(r.steps) || r.steps.length < 1) throw new Error('reply has the wrong shape');
  return { title: r.title, steps: r.steps.map(s => typeof s === 'string' ? s : String((s && s.text) || '')) };
}
// Three ways to call the CLI, tried in this order. "lean" is the tarot pattern plus four flags that keep the call
// to the finding alone: no tools, no user-level settings (so none of Andrew's hooks or personal instructions are
// loaded into the request), no saved session, and a one-line system prompt in place of the coding one.
// If a flag is not known to an older CLI, "plain" is the pattern exactly as tarot/read-api.js has it.
const SYSTEM = 'You rewrite short texts for a fire inspector who is writing to a property owner. Follow the rules in the message exactly. Reply with one JSON object and nothing else.';
const ARGS = {
  lean: ['-p', '--model', MODEL, '--output-format', 'json', '--tools', '', '--setting-sources', 'project', '--no-session-persistence', '--system-prompt', SYSTEM],
  plain: ['-p', '--model', MODEL, '--output-format', 'json'],
  bare: ['-p', '--output-format', 'json'],
};
function run(text, mode) {
  return new Promise((resolve, reject) => {
    const args = ARGS[mode] || ARGS.plain; let child, out = '', err = '';
    try { child = spawn(bin(), args, { env: cleanEnv(), cwd: os.tmpdir(), stdio: ['pipe', 'pipe', 'pipe'] }); } catch (e) { return reject(e); }
    const timer = setTimeout(() => { child.kill('SIGKILL'); reject(new Error('timeout')); }, TIMEOUT_MS);
    child.stdout.on('data', d => out += d); child.stderr.on('data', d => err += d); child.on('error', e => { clearTimeout(timer); reject(e); });
    child.on('close', code => { clearTimeout(timer); code === 0 && out ? resolve(out) : reject(new Error('claude exited ' + code + ' ' + err.slice(0, 200))); });
    child.stdin.on('error', () => { }); child.stdin.end(text);
  });
}

// what the test switch answers: a reply shaped like a model's, so it runs through the same guard as a real one.
// An instruction containing "inject" adds a sentence with a section number, a distance and a deadline that are in no
// source, which the guard must remove.
const INJECT = 'Cut everything back 45 feet under § 999.9 within 7 days.';
function fake(b, D, drafts) {
  const inject = /inject/i.test(b.instruction);
  if (b.target === 'own') { const o = D.builtinOwn(b.instruction.replace(/\s*inject\s*/ig, ' ')); if (inject) o.steps.push(INJECT); return { title: o.title, steps: o.steps }; }
  const known = /short|brief|simpl|plain|keep|stay|which|where/i.test(b.instruction);
  const r = D.builtin(b.target, b.current, known ? b.instruction : 'shorter', drafts.extras(b.scene, b.solution));
  if (b.target === 'problem') { let t = r.changed ? r.text : D.sentences(b.current.text).slice(0, 3).join(' '); if (inject) t += ' ' + INJECT; return { text: t }; }
  const steps = r.changed ? r.steps : b.current.steps.slice(0, Math.max(1, b.current.steps.length - 1)); if (inject) steps.push(INJECT);
  return { title: r.title, steps };
}

let busy = 0;
async function draft(raw) {
  let sb; try { sb = world(); } catch (e) { return { code: 503, body: { error: 'drafting not available: ' + e.message } }; }
  const b = readBody(raw, sb); if (b.error) return { code: 400, body: { error: b.error } };
  const D = sb.TeamDrafts, drafts = D.build(sb.CONTENT, sb.TeamData.tidy);
  const ev = sb.TeamData.evaluate(b.scene, b.place, b.facts);
  const material = drafts.material(b.scene, b.target === 'solution' ? b.solution : null, ev.rows, ev.place);
  const allowed = [material, b.current.title, b.current.text, b.current.steps.join(' '), b.instruction].join('\n');
  const finish = (reply, source, note) => {
    const g = D.guard(reply, allowed, b.current.title);
    const body = { ok: true, source, removed: g.removed.map(x => x.sentence) };
    if (g.title != null) body.title = g.title || b.current.title || 'Inspector’s recommendation';
    if (g.text != null) body.text = g.text; if (g.steps != null) body.steps = g.steps;
    if (b.target === 'own') body.standing = 'own';
    if (note) body.note = note;
    return { code: 200, body };
  };
  const builtIn = why => {
    const r = b.target === 'own' ? D.builtinOwn(b.instruction) : D.builtin(b.target, b.current, b.instruction, drafts.extras(b.scene, b.solution));
    const reply = b.target === 'problem' ? { text: r.text } : { title: r.title, steps: r.steps };
    return finish(reply, 'builtin', why + (r.note ? ' ' + r.note : ''));
  };
  if (process.env.TEAM_DRAFT_FAKE) { try { return finish(fake(b, D, drafts), 'fake'); } catch (e) { return { code: 502, body: { error: String(e.message).slice(0, 200) } }; } }
  if (busy >= 2) return { code: 429, body: { error: 'busy' } };
  busy++;
  try {
    const p = prompt(b, material); let out, mode = 'lean';
    try { out = await run(p, mode); }
    catch (e) { if (/timeout/.test(e.message)) throw e; mode = 'plain'; try { out = await run(p, mode); } catch (e2) { if (/timeout/.test(e2.message)) throw e2; mode = 'bare'; out = await run(p, mode); } }
    let reply; try { reply = parse(out, b); } catch { reply = parse(await run(p, mode), b); }   // one retry on a bad reply
    try { return finish(reply, 'model'); } catch { return builtIn('The rewrite added facts that are not in the sources, so it was not used.'); }
  } catch (e) {
    return builtIn(/timeout/.test(e.message) ? 'The rewrite took too long. This is a simpler one.' : 'The writing help could not be reached. This is a simpler rewrite.');
  } finally { busy--; }
}

function handle(req, res) {
  const url = String(req.url || '').split('?')[0];
  if (url !== '/api/team/draft') return false;
  const json = (code, body) => { if (res.headersSent) return; res.writeHead(code, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' }); res.end(JSON.stringify(body)); };
  if (req.method === 'GET' || req.method === 'HEAD') { json(200, { ok: true, fake: !!process.env.TEAM_DRAFT_FAKE }); return true; }
  if (req.method !== 'POST') { json(405, { error: 'POST only' }); return true; }
  let raw = ''; req.on('data', d => { if (raw.length < 40000) raw += d; });
  req.on('end', () => { draft(raw).then(r => json(r.code, r.body), e => json(500, { error: String((e && e.message) || e).slice(0, 200) })); });
  return true;
}
module.exports = { handle, draft, prompt, parse, world, MODEL };
