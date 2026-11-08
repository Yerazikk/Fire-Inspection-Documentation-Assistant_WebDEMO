// Static file server plus the AI proxy.
//
// The proxy exists for one reason: the Gemini key must never reach the browser.
// The client posts an inspection context to /api/draft, the key is read here
// from the environment, and only the finished document goes back.
const http = require('http'), fs = require('fs'), path = require('path');

// --- .env, without a dependency -------------------------------------------
(function loadEnv() {
  const f = path.join(__dirname, '.env');
  if (!fs.existsSync(f)) return;
  for (const line of fs.readFileSync(f, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
})();

const ai = require('./ai/draft');
const codes = require('./ai/codes');
const visual = require('./ai/visual');

const PORT = Number(process.argv[2] || 8956), ROOT = __dirname;
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.webp': 'image/webp' };
// Never served, whatever the URL says.
const BLOCKED = [/^[\\/]?\.env/, /^[\\/]?ai[\\/]/, /^[\\/]?node_modules[\\/]/, /^[\\/]?\.git[\\/]/];

const json = (res, status, obj) => { const b = JSON.stringify(obj); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(b) }); res.end(b); };

// A record now posts the entry photograph with the note, base64 in the JSON
// body — 100–250 KB for the 1024 px copy, against a context that was already
// most of the old 1 MB ceiling. Headroom rather than a tight fit: the ceiling
// is here to stop a runaway upload, not to size a normal one.
const MAX_BODY = 12 * 1024 * 1024;

const readBody = req => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n > MAX_BODY) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

async function api(req, res, route) {
  if (route === '/api/ai/status') {
    const out = { key: ai.keyPresent(), backend: ai.backend().name, model: require('./ai/prompts').MODEL.name, imageModel: visual.model(), jurisdiction: codes.meta.jurisdiction, edition: codes.meta.edition, retrieved: codes.meta.retrieved, codes: codes.codes.length };
    if (ai.keyPresent() && req.url.includes('models=1')) {
      try { out.models = await ai.listModels(); } catch (e) { out.modelsError = e.message; }
    }
    return json(res, 200, out);
  }

  if (route === '/api/draft') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    let ctx;
    try { ctx = JSON.parse(await readBody(req)); } catch (e) { return json(res, 400, { error: 'bad request body' }); }
    const kind = ctx && ctx.kind;
    if (!['record', 'report', 'notice'].includes(kind)) return json(res, 400, { error: 'kind must be "record", "report" or "notice"' });
    try {
      const doc = await ai.draft(kind, ctx);
      const what = kind === 'record' ? `record for entry ${ctx.entry && ctx.entry.n}` : kind;
      const shot = ctx.entry && ctx.entry.photo && ctx.entry.photo.data;
      const seen = shot ? ` · photo ${Math.round(shot.length * 3 / 4 / 1024)} KB${doc.scan ? ', ' + ((doc.scan.boxes || []).length + (doc.scan.issue ? 1 : 0)) + ' boxes' : ', no boxes'}` : '';
      console.log(`  drafted ${what} at ${ctx.address} · ${doc.meta.ms} ms · ${doc.meta.tokens ? doc.meta.tokens.total + ' tokens' : 'usage unknown'}${seen}`);
      if (doc.audit.unknownCitations.length) console.warn('  ! citations not in the library:', doc.audit.unknownCitations.join('; '));
      return json(res, 200, { doc });
    } catch (e) {
      console.error(`  draft ${kind} failed [${e.code || 'error'}]: ${e.message}`);
      return json(res, e.code === 'no_key' ? 503 : 502, { error: e.message, code: e.code || 'error' });
    }
  }

  // One recommendation card's annotated photo. Slow — fifteen to twenty
  // seconds — and deliberately off the critical path: the client queues these
  // after the documents are drafted and the inspector keeps working.
  if (route === '/api/visual') {
    if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
    let ctx;
    try { ctx = JSON.parse(await readBody(req)); } catch (e) { return json(res, 400, { error: 'bad request body' }); }
    if (!ctx || !ctx.photo || !ctx.photo.data) return json(res, 400, { error: 'no photograph to annotate' });
    if (!ctx.rec || !ctx.rec.title) return json(res, 400, { error: 'no recommendation to illustrate' });
    try {
      const out = await visual.illustrate(ctx.photo, ctx.rec, { finding: ctx.finding });
      console.log(`  drew "${String(ctx.rec.title).slice(0, 44)}" at ${ctx.address || 'unknown'} · ${out.ms} ms · ${Math.round(out.data.length * 3 / 4 / 1024)} KB`);
      return json(res, 200, { image: { mimeType: out.mimeType, data: out.data }, model: out.model, ms: out.ms, gapMs: require('./ai/prompts').VISUAL.gapMs });
    } catch (e) {
      console.error(`  visual failed [${e.code || 'error'}]: ${e.message}`);
      return json(res, e.code === 'no_key' ? 503 : 502, { error: e.message, code: e.code || 'error' });
    }
  }

  return json(res, 404, { error: 'no such endpoint' });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/')) { api(req, res, p).catch(e => json(res, 500, { error: String(e.message || e) })); return; }
  if (p === '/') p = '/index.html';
  const rel = p.replace(/^\/+/, '');
  if (BLOCKED.some(re => re.test(rel))) { res.writeHead(404); return res.end('not found'); }
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => {
  console.log('fire-inspector V3 on http://localhost:' + PORT);
  console.log(ai.keyPresent()
    ? `  AI drafting on · ${require('./ai/prompts').MODEL.name} via ${ai.backend().name} · ${codes.codes.length} code sections (${codes.meta.jurisdiction.split('—')[0].trim()})`
    : '  AI drafting OFF — no GEMINI_API_KEY. Documents fall back to the built-in templates. See README.md.');
});
