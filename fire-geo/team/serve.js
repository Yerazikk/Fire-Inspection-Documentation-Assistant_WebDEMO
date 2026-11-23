// team/serve.js: a scratch server for the Inspectors tab's own tests and screenshots.
//   node team/serve.js [port]      (default 8862)   TEAM_DRAFT_FAKE=1 keeps the drafting endpoint off the model.
// The always-on server is /server.js on 8861 (the Technology tab's). This one serves the same project root and
// mounts team/api.js the same way, so test.js and shot.js never depend on 8861 being up. Also exports start().
// TEAM_NEXT=1 (or start(port, true)): files in team/next/ are served in place of the live ones in team/, so a change
// can be loaded and checked before it replaces the page Andrew is looking at. promote.js copies them over.
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' };

function start(port, staged) {
  const NEXT = path.join(__dirname, 'next'), useNext = staged || process.env.TEAM_NEXT === '1';
  const api = require('./api.js');
  let feedback = null; try { feedback = require(path.join(ROOT, 'feedback-api.js')); } catch { }
  const server = http.createServer((req, res) => {
    let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400); return res.end(); }
    if (p.startsWith('/api/team/')) { if (api.handle(req, res) === false) { res.writeHead(503, { 'content-type': 'application/json' }); res.end('{"error":"drafting not available"}'); } return; }
    if (p.startsWith('/api/feedback')) {
      // tests must not write Andrew's feedback file: answer the read, refuse the writes
      if (req.method === 'GET') { res.writeHead(200, { 'content-type': 'application/json' }); return res.end('{"boxes":{}}'); }
      res.writeHead(204); return res.end();
    }
    if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405); return res.end(); }
    let file = path.join(ROOT, p);
    if (useNext && p.startsWith('/team/') && !p.startsWith('/team/next/')) { const alt = path.join(NEXT, p === '/team/' ? 'index.html' : p.slice(6)); if (alt.startsWith(NEXT + path.sep) && fs.existsSync(alt) && fs.statSync(alt).isFile()) file = alt; }
    if ((file !== ROOT && !file.startsWith(ROOT + path.sep)) || /node_modules|\/\./.test(p)) { res.writeHead(403); return res.end(); }
    fs.stat(file, (err, st) => {
      if (!err && st.isDirectory()) { if (!p.endsWith('/')) { res.writeHead(301, { location: p + '/' }); return res.end(); } file = path.join(file, 'index.html'); }
      fs.readFile(file, (e2, buf) => {
        if (e2) { res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }); return res.end('not found'); }
        res.writeHead(200, { 'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' });
        res.end(req.method === 'HEAD' ? undefined : buf);
      });
    });
  });
  return new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', () => resolve(server)); });
}
module.exports = { start, ROOT };
if (require.main === module) { const port = +process.argv[2] || 8862; start(port).then(() => console.log('fire-geo (team scratch server) on http://localhost:' + port + '/team/')); }
