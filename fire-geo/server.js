// fire-geo: node server.js [port]   (default 8861)
// Static files + Andrew's feedback-mode API + the Inspectors tab's drafting API when team/api.js is present.
const http = require('http'), fs = require('fs'), path = require('path');
const feedback = require('./feedback-api.js');
const PORT = +process.argv[2] || 8861, ROOT = __dirname;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.mp4': 'video/mp4', '.webm': 'video/webm', '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.pdf': 'application/pdf',
};

// team/api.js is written by the Inspectors-tab agent. It is loaded on demand and reloaded when the file changes,
// so this server never has to restart for it. If it is absent or broken the page falls back to its built-in text.
const TEAM_API = path.join(ROOT, 'team', 'api.js');
let teamApi = null, teamApiStamp = 0;
function loadTeamApi() {
  let stamp;
  try { stamp = fs.statSync(TEAM_API).mtimeMs; } catch { teamApi = null; teamApiStamp = 0; return null; }
  if (teamApi && stamp === teamApiStamp) return teamApi;
  try {
    delete require.cache[require.resolve(TEAM_API)];
    const mod = require(TEAM_API);
    teamApi = typeof mod === 'function' ? mod : (mod && typeof mod.handle === 'function' ? mod.handle.bind(mod) : null);
    teamApiStamp = stamp;
  } catch (e) { console.error('team/api.js failed to load:', e.message); teamApi = null; teamApiStamp = 0; }
  return teamApi;
}
function unavailable(res) {
  if (res.headersSent) return;
  res.writeHead(503, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' });
  res.end(JSON.stringify({ error: 'drafting not available' }));
}

http.createServer((req, res) => {
  if (feedback.handle(req, res)) return;
  let p;
  try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }

  if (p.startsWith('/api/team/')) {
    const handle = loadTeamApi();
    if (!handle) return unavailable(res);
    try {
      const out = handle(req, res);
      if (out && typeof out.then === 'function') out.then(done => { if (done === false) unavailable(res); }, e => { console.error('team api:', e && e.message); unavailable(res); });
      else if (out === false) unavailable(res);
    } catch (e) { console.error('team api:', e.message); unavailable(res); }
    return;
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
  // The two tabs are views inside one document (the shell at /). Opening /team/ directly lands there with the
  // Inspectors view chosen. The shell loads the page itself as /team/?embedded=1; /team/?standalone=1 is the page alone.
  if (p === '/team' || p === '/team/') {
    const q = new URL(req.url, 'http://x').searchParams;
    if (!q.has('embedded') && !q.has('standalone')) { const rest = q.toString(); res.writeHead(302, { location: '/#inspectors' + (rest ? '?' + rest : ''), 'cache-control': 'no-store' }); return res.end(); }
  }
  let file = path.join(ROOT, p);
  if ((file !== ROOT && !file.startsWith(ROOT + path.sep)) || /node_modules|\/\./.test(p)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (!err && st.isDirectory()) {
      if (!p.endsWith('/')) { res.writeHead(301, { location: p + '/' + (req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '') }); return res.end(); }
      file = path.join(file, 'index.html');
    }
    fs.readFile(file, (e2, buf) => {
      if (e2) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('not found'); }
      res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
      res.end(req.method === 'HEAD' ? undefined : buf);
    });
  });
}).listen(PORT, () => console.log('fire-geo on http://localhost:' + PORT));
