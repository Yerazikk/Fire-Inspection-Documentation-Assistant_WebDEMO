// The local host: static files out of public/, and the API endpoints.
//
// The endpoints themselves live in ai/api.js, shared with the Vercel functions
// in api/, so there is one implementation and local and deployed behaviour
// cannot drift. The proxy exists for one reason: the Gemini key must never
// reach the browser. The client posts an inspection context, the key is read
// here from the environment, and only the finished document goes back. The
// Street View proxy is the same trade in reverse — the page asks for a
// photograph of an address and the key stays here.
const http = require('http'), fs = require('fs'), path = require('path');

require('./ai/env')();

const api = require('./ai/api');
const ai = require('./ai/draft');
const codes = require('./ai/codes');

const PORT = Number(process.argv[2] || 8956);
// Only public/ is reachable over HTTP. ai/ and .env sit outside it, which is
// what keeps them private on Vercel too.
const ROOT = path.join(__dirname, 'public');
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.svg': 'image/svg+xml', '.md': 'text/plain; charset=utf-8', '.webp': 'image/webp' };

const json = (res, status, obj) => { const b = JSON.stringify(obj); res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'Content-Length': Buffer.byteLength(b) }); res.end(b); };

// A record posts the entry photograph with the note, and a dictated memo posts
// the recording, both base64 in the JSON body —
// 100–250 KB for the 1024 px copy, against a context that was already most of
// the old 1 MB ceiling. Headroom rather than a tight fit: the ceiling is here
// to stop a runaway upload, not to size a normal one. Vercel allows 100 MB, so
// this is the tighter of the two hosts and the one worth sizing.
const MAX_BODY = 12 * 1024 * 1024;

const readBody = req => new Promise((resolve, reject) => {
  let n = 0; const chunks = [];
  req.on('data', c => { n += c.length; if (n > MAX_BODY) { reject(new Error('body too large')); req.destroy(); } else chunks.push(c); });
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

// A GET endpoint's query string, which the Vercel host parses for us and this
// one does not.
const params = url => { const out = {}; for (const [k, v] of new URL(url, 'http://localhost').searchParams) out[k] = v; return out; };

async function route(req, res, p) {
  if (p === '/api/ai/status') {
    const { status, body } = await api.status({ models: req.url.includes('models=1') });
    return json(res, status, body);
  }
  if (p === '/api/maps/config') {
    const { status, body } = api.mapsConfig();
    return json(res, status, body);
  }
  // The Street View proxy answers with a photograph, so it is the one endpoint
  // here that does not go through json() — and the one whose response is meant
  // to be cached rather than no-store.
  if (p === '/api/streetview') {
    if (req.method !== 'GET') return json(res, 405, { error: 'GET only' });
    const out = await api.streetview(params(req.url));
    if (!out.buffer) return json(res, out.status, out.body);
    res.writeHead(out.status, { ...out.headers, 'Content-Type': out.type, 'Content-Length': out.buffer.length });
    return res.end(out.buffer);
  }

  const run = p === '/api/draft' ? api.draft : p === '/api/visual' ? api.illustrate : p === '/api/transcribe' ? api.transcribe : null;
  if (!run) return json(res, 404, { error: 'no such endpoint' });
  if (req.method !== 'POST') return json(res, 405, { error: 'POST only' });
  let ctx;
  try { ctx = JSON.parse(await readBody(req)); } catch (e) { return json(res, 400, { error: 'bad request body' }); }
  const { status, body } = await run(ctx);
  return json(res, status, body);
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p.startsWith('/api/')) { route(req, res, p).catch(e => json(res, 500, { error: String(e.message || e) })); return; }
  if (p === '/') p = '/index.html';
  const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end('not found'); }
  res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-cache' });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => {
  console.log('fire-inspector V3 on http://localhost:' + PORT);
  console.log(ai.keyPresent()
    ? `  AI drafting on · ${require('./ai/prompts').MODEL.name} via ${ai.backend().name} · ${codes.codes.length} code sections (${codes.meta.jurisdiction.split('—')[0].trim()})`
    : '  AI drafting OFF — no GEMINI_API_KEY. Documents fall back to the built-in templates. See README.md.');
  const maps = require('./ai/maps');
  console.log(maps.browserKey()
    ? '  Google Maps on · Street View stills for the pin preview, interactive satellite for the lot view'
    : '  Google Maps browser key missing — the lot view falls back to keyless Esri imagery. See README.md.');
});
