// Vercel's req/res, made to speak the same language as ai/api.js.
//
// Vercel parses a JSON body for us when the client sent the right content-type;
// the stream fallback keeps a hand-rolled request working too.
const send = (res, { status, body }) => {
  res.status(status).setHeader('Cache-Control', 'no-store');
  res.json(body);
};

const readBody = req => new Promise((resolve, reject) => {
  const chunks = [];
  req.on('data', c => chunks.push(c));
  req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
  req.on('error', reject);
});

async function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body);
  return JSON.parse(await readBody(req));
}

// The query string, however the host chose to hand it over.
function query(req) {
  if (req.query && typeof req.query === 'object') return req.query;
  const out = {};
  for (const [k, v] of new URL(req.url, 'http://localhost').searchParams) out[k] = v;
  return out;
}

// Wraps one handler: GET only, query parsed. A handler may answer with JSON
// ({ status, body }) or with bytes ({ status, type, buffer, headers }) — the
// Street View proxy does the latter, and it must not pick up the no-store
// header the JSON path sets.
const get = run => async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') return send(res, { status: 405, body: { error: 'GET only' } });
  let out;
  try { out = await run(query(req)); }
  catch (e) { return send(res, { status: 500, body: { error: String(e.message || e) } }); }
  if (!out.buffer) return send(res, out);
  res.status(out.status);
  for (const [k, v] of Object.entries(out.headers || {})) res.setHeader(k, v);
  res.setHeader('Content-Type', out.type || 'application/octet-stream');
  res.send(out.buffer);
};

// Wraps one handler: POST only, body parsed, errors turned into JSON.
const post = run => async (req, res) => {
  if (req.method !== 'POST') return send(res, { status: 405, body: { error: 'POST only' } });
  let ctx;
  try { ctx = await body(req); } catch (e) { return send(res, { status: 400, body: { error: 'bad request body' } }); }
  try { send(res, await run(ctx)); }
  catch (e) { send(res, { status: 500, body: { error: String(e.message || e) } }); }
};

module.exports = { send, post, get, query };
