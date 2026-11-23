// Feedback API — pairs with feedback-mode.js. Drop into any Node static server:
//   const fb = require('./feedback-api.js');
//   http.createServer((req, res) => { if (fb.handle(req, res)) return; /* …static… */ })
// Stores everything in <project>/feedback.json:
//   { sections: { id: {text, at} },            ← text boxes under document sections (architecture page)
//     applied:  { id: [{text, at, appliedOn}] }, ← notes already folded in
//     boxes:    { id: {id, page, x, y, w, h, text, anchor:{path,text,dx,dy}, target, context, shot:'feedback-shots/<id>.jpg', at, savedAt, vw} } } ← red boxes from feedback mode
'use strict';
const fs = require('fs'), path = require('path');
const DIR = __dirname;   // feedback-api.js lives next to the server; everything is written beside it
const FILE = path.join(DIR, 'feedback.json');           // next to the server script
const SHOTS = path.join(DIR, 'feedback-shots');        // one jpg per box, referenced from feedback.json
function read() { try { return JSON.parse(fs.readFileSync(FILE, 'utf8')); } catch { return { sections: {} }; } }
function write(fb) { fs.writeFileSync(FILE, JSON.stringify(fb, null, 2)); }
function body(req) {
  return new Promise((resolve, reject) => {
    let b = ''; req.on('data', c => { b += c; if (b.length > 1e6) req.destroy(); });
    req.on('end', () => { try { resolve(JSON.parse(b || '{}')); } catch (e) { reject(e); } }); req.on('error', reject);
  });
}
function json(res, code, obj) { res.writeHead(code, { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }); res.end(JSON.stringify(obj)); }
/* ---- screenshots: the page posts a static snapshot of its DOM (canvases baked to images, inner
   scroll positions kept); we render it in headless Chrome at the same viewport and crop the box.
   Faithful for anything the browser can draw, unlike DOM-to-canvas libraries. ---- */
let chromium = null;
for (const p of ['playwright-core', '/Users/andrewdong/emberguild/node_modules/playwright-core']) { try { chromium = require(p).chromium; break; } catch {} }
let browser = null, browserTimer = null;
async function getBrowser() {
  if (browser && browser.isConnected()) { clearTimeout(browserTimer); browserTimer = setTimeout(() => { browser && browser.close().catch(() => {}); browser = null; }, 60000); return browser; }
  browser = await chromium.launch({ channel: 'chrome', headless: true });
  browserTimer = setTimeout(() => { browser && browser.close().catch(() => {}); browser = null; }, 60000);
  return browser;
}
const SNAP = path.join(DIR, '_snap');
async function shot(req, res) {
  if (!chromium) return json(res, 501, { error: 'playwright-core not available on this machine' });
  const d = await body(req);
  if (!d.id || !d.html || !d.box) return json(res, 400, { error: 'id, html and box required' });
  fs.mkdirSync(SNAP, { recursive: true }); fs.mkdirSync(SHOTS, { recursive: true });
  const file = path.join(SNAP, d.id + '.html'); fs.writeFileSync(file, d.html);
  const host = req.headers.host || 'localhost';
  const vw = Math.max(320, Math.min(4000, +d.vw || 1280)), vh = Math.max(320, Math.min(4000, +d.vh || 900));
  let page = null;
  try {
    const b = await getBrowser();
    const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: 2 });
    page = await ctx.newPage();
    await page.goto(`http://${host}/_snap/${d.id}.html`, { waitUntil: 'load', timeout: 15000 }).catch(() => {});
    await page.evaluate(([sx, sy]) => window.scrollTo(sx, sy), [d.scrollX || 0, d.scrollY || 0]);
    await page.waitForTimeout(350);
    const pad = 6;
    const x = Math.max(0, d.box.x - (d.scrollX || 0) - pad), y = Math.max(0, d.box.y - (d.scrollY || 0) - pad);
    const w = Math.max(8, Math.min(vw - x, d.box.w + pad * 2)), h = Math.max(8, Math.min(vh - y, d.box.h + pad * 2));
    const rel = 'feedback-shots/' + d.id + '.jpg';
    await page.screenshot({ path: path.join(DIR, rel), clip: { x, y, width: w, height: h }, type: 'jpeg', quality: 86 });
    await ctx.close();
    const fb = read(); if (fb.boxes && fb.boxes[d.id]) { fb.boxes[d.id].shot = rel; write(fb); }
    json(res, 200, { ok: true, shot: rel });
  } catch (e) { if (page) { try { await page.context().close(); } catch {} } json(res, 500, { error: String(e.message || e).slice(0, 200) }); }
  finally { try { fs.unlinkSync(file); } catch {} }
}

function handle(req, res) {
  const clean = decodeURIComponent(req.url.split('?')[0]);
  if (clean === '/api/feedback/shot' && req.method === 'POST') { shot(req, res).catch(e => json(res, 500, { error: String(e.message || e) })); return true; }
  if (clean !== '/api/feedback') return false;
  if (req.method === 'GET') { json(res, 200, read()); return true; }
  if (req.method !== 'POST') { res.writeHead(405); res.end(); return true; }
  body(req).then(d => {
    const fb = read(); fb.sections = fb.sections || {}; fb.boxes = fb.boxes || {};
    if (d.kind === 'box') {
      if (!d.id) return json(res, 400, { error: 'id required' });
      if (d.delete) { const old = fb.boxes[d.id]; delete fb.boxes[d.id]; if (old && old.shot) { try { fs.unlinkSync(path.join(DIR, old.shot)); } catch {} } write(fb); return json(res, 200, { ok: true, boxes: Object.keys(fb.boxes).length }); }
      // the screenshot arrives as a data URL; it is written to feedback-shots/<id>.jpg and referenced by path
      let shot = (fb.boxes[d.id] && fb.boxes[d.id].shot) || null;
      if (d.shot && /^data:image\/(jpeg|png);base64,/.test(d.shot)) {
        try { fs.mkdirSync(SHOTS, { recursive: true }); const ext = d.shot.startsWith('data:image/png') ? 'png' : 'jpg'; const rel = 'feedback-shots/' + d.id + '.' + ext; fs.writeFileSync(path.join(DIR, rel), Buffer.from(d.shot.split(',')[1], 'base64')); shot = rel; } catch {}
      } else if (typeof d.shot === 'string' && d.shot.startsWith('feedback-shots/')) shot = d.shot.split('?')[0];
      fb.boxes[d.id] = { id: d.id, page: d.page, x: d.x, y: d.y, w: d.w, h: d.h, text: d.text || '', anchor: d.anchor || null, target: d.target || null, context: d.context || null, shot, at: d.at, savedAt: d.savedAt || new Date().toISOString(), vw: d.vw };
      write(fb); return json(res, 200, { ok: true, boxes: Object.keys(fb.boxes).length, shot });
    }
    const { id, text } = d;
    if (!id || typeof text !== 'string') return json(res, 400, { error: 'id and text required' });
    if (text.trim()) fb.sections[id] = { text, at: new Date().toISOString() }; else delete fb.sections[id];
    write(fb); json(res, 200, { ok: true, saved: !!text.trim() });
  }).catch(e => json(res, 400, { error: String(e.message || e) }));
  return true;
}
module.exports = { handle, read, FILE };
