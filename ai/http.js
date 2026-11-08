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

// Wraps one handler: POST only, body parsed, errors turned into JSON.
const post = run => async (req, res) => {
  if (req.method !== 'POST') return send(res, { status: 405, body: { error: 'POST only' } });
  let ctx;
  try { ctx = await body(req); } catch (e) { return send(res, { status: 400, body: { error: 'bad request body' } }); }
  try { send(res, await run(ctx)); }
  catch (e) { send(res, { status: 500, body: { error: String(e.message || e) } }); }
};

module.exports = { send, post };
