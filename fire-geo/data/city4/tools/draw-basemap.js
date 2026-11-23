// node draw-basemap.js <render-data.js> <out.jpg> [out.png]
// Draws the basemap on a canvas in headless Chrome (no window) and saves it. Palette measured from the existing
// assets/rossvalley.jpg: paper ground, grey buildings, white streets, cream main roads, grey-green parks, pale water.
'use strict';
const fs = require('fs');
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');
const [dataJs, outJpg, outPng] = process.argv.slice(2);
setTimeout(() => { console.log('hard timeout'); process.exit(1); }, 170000);
function draw() {
  const D = window.MAPDATA, W = D.w, H = D.h, cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  const C = { ground: '#f9f9f7', built: '#efefec', green: '#e3e7dd', wood: '#cbd3c9', water: '#cfd9db', building: '#d6d5d1', casing: '#d9d8d4', street: '#ffffff', tertiary: '#ffffff',
    secondary: '#f3eedd', secCase: '#d9d2bd', primary: '#e9dcc8', priCase: '#cdbfa9', motorway: '#cfbcc1', motCase: '#b7a4aa', path: '#b9b3ad', rail: '#a9a9a6', text: '#5c5c5a', halo: 'rgba(250,250,248,0.92)', parkText: '#6f8570' };
  const ring = a => { g.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) g.lineTo(a[i], a[i + 1]); g.closePath(); };
  const fillPolys = (list, col) => { g.fillStyle = col; g.beginPath(); for (const p of list) for (const r of p) ring(r); g.fill('evenodd'); };
  const strokeLines = (list, col, w, dash) => { g.strokeStyle = col; g.lineWidth = w; g.setLineDash(dash || []); g.beginPath(); for (const a of list) { g.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) g.lineTo(a[i], a[i + 1]); } g.stroke(); g.setLineDash([]); };
  g.fillStyle = C.ground; g.fillRect(0, 0, W, H);
  fillPolys(D.landuse, C.built); fillPolys(D.green, C.green); fillPolys(D.wood, C.wood);
  // the Bay: draw the coastline on a mask, flood from a point west of the marina, paint the reached pixels
  let bayShare = 0;
  { const m = document.createElement('canvas'); m.width = W; m.height = H; const c = m.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.strokeStyle = '#000'; c.lineWidth = 2.4; c.lineJoin = 'round'; c.beginPath();
    for (const a of D.coast) { c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); } c.stroke();
    const im = c.getImageData(0, 0, W, H), d = im.data, seen = new Uint8Array(W * H), st = [];
    const b = D.bounds, sx = Math.round((-122.3294 - b.west) / (b.east - b.west) * W), sy = Math.round(H * 0.52); st.push(sy * W + sx);
    let n = 0; while (st.length) { const k = st.pop(); if (seen[k] || d[k * 4] < 128) continue; seen[k] = 1; n++; const x = k % W, y = (k - x) / W; if (x > 0) st.push(k - 1); if (x < W - 1) st.push(k + 1); if (y > 0) st.push(k - W); if (y < H - 1) st.push(k + W); }
    bayShare = n / (W * H);
    if (bayShare < 0.5) { // grow by 2 px to cover the mask line, then paint
      const o = c.createImageData(W, H), od = o.data; for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { let on = 0; for (let j = -2; j <= 2 && !on; j++) for (let i = -2; i <= 2; i++) { const X = x + i, Y = y + j; if (X >= 0 && Y >= 0 && X < W && Y < H && seen[Y * W + X]) { on = 1; break; } } if (on) { const k = (y * W + x) * 4; od[k] = 0xcf; od[k + 1] = 0xd9; od[k + 2] = 0xdb; od[k + 3] = 255; } }
      c.clearRect(0, 0, W, H); c.putImageData(o, 0, 0); g.drawImage(m, 0, 0); } }
  fillPolys(D.water, C.water); strokeLines(D.streams, '#c2d0d4', 0.9);
  fillPolys(D.buildings.map(r => [r]), C.building);
  const cls = c => /^(motorway|trunk)$/.test(c) ? 'mot' : /^(motorway_link|trunk_link)$/.test(c) ? 'motl' : /^primary/.test(c) ? 'pri' : /^secondary/.test(c) ? 'sec' : /^tertiary/.test(c) ? 'ter' : /^(residential|unclassified|living_street)$/.test(c) ? 'res' : c === 'service' ? 'srv' : c === 'pedestrian' ? 'ped' : /^(footway|path|steps|cycleway|track)$/.test(c) ? 'path' : '';
  const by = {}; for (const r of D.roads) { const k = cls(r.c); if (k) (by[k] = by[k] || []).push(r.a); }
  strokeLines(by.path || [], C.path, 0.6, [2.2, 1.8]);
  const S = [['srv', 1.6, C.casing, C.street, 0.9], ['ped', 2.2, C.casing, '#f4f3ef', 1.4], ['res', 3.6, C.casing, C.street, 2.6], ['ter', 5.0, C.casing, C.tertiary, 3.8], ['motl', 4.6, C.motCase, C.motorway, 3.4], ['sec', 6.2, C.secCase, C.secondary, 5.0], ['pri', 6.8, C.priCase, C.primary, 5.6], ['mot', 7.0, C.motCase, C.motorway, 5.6]];
  for (const [k, cw, cc] of S) strokeLines(by[k] || [], cc, cw);
  for (const [k, , , fc, fw] of S) strokeLines(by[k] || [], fc, fw);
  strokeLines(D.rail, C.rail, 1.1, [5, 3]);
  // ---- labels
  const taken = []; const free = (x, y, r) => { for (const t of taken) if ((t[0] - x) ** 2 + (t[1] - y) ** 2 < (t[2] + r) ** 2) return false; return true; };
  const put = (txt, x, y, ang, font, col, track) => { g.save(); g.translate(x, y); g.rotate(ang); g.font = font; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3; g.strokeStyle = C.halo; g.fillStyle = col; if (track) g.letterSpacing = track; g.strokeText(txt, 0, 0); g.fillText(txt, 0, 0); g.restore(); };
  const F = 'system-ui, "Helvetica Neue", Helvetica, Arial, sans-serif';
  for (const p of D.places.sort((a, b) => (a.k === 'city' ? 0 : a.k === 'town' ? 1 : 2) - (b.k === 'city' ? 0 : b.k === 'town' ? 1 : 2))) {
    if (p.x < 30 || p.y < 14 || p.x > W - 30 || p.y > H - 14) continue;
    const big = p.k === 'city' || p.k === 'town', font = (big ? '500 15px ' : '11px ') + F; g.font = font; const r = g.measureText(p.n).width / 2 + 6; if (!free(p.x, p.y, r)) continue;
    put(p.n, p.x, p.y, 0, font, big ? '#4a4a48' : '#77777a'); taken.push([p.x, p.y, r]); }
  for (const p of D.parks.sort((a, b) => b.s - a.s).slice(0, 40)) { const font = 'italic 10.5px ' + F; g.font = font; const r = g.measureText(p.n).width / 2 + 4; if (p.x < r || p.x > W - r || p.y < 10 || p.y > H - 10 || !free(p.x, p.y, r)) continue; put(p.n, p.x, p.y, 0, font, C.parkText); taken.push([p.x, p.y, r]); }
  const rank = { mot: 0, pri: 1, sec: 2, ter: 3, res: 4 }, named = D.roads.filter(r => r.n && rank[cls(r.c)] != null).map(r => { let L = 0; for (let i = 2; i < r.a.length; i += 2) L += Math.hypot(r.a[i] - r.a[i - 2], r.a[i + 1] - r.a[i - 1]); return { ...r, L, k: cls(r.c) }; }).sort((a, b) => rank[a.k] - rank[b.k] || b.L - a.L);
  const lastAt = {}; let nl = 0;
  for (const r of named) {
    const font = (r.k === 'res' ? '9px ' : '10px ') + F; g.font = font; const tw = g.measureText(r.n).width; if (r.L < tw + 14) continue;
    const at = s => { let acc = 0; for (let i = 2; i < r.a.length; i += 2) { const l = Math.hypot(r.a[i] - r.a[i - 2], r.a[i + 1] - r.a[i - 1]); if (acc + l >= s) { const f = (s - acc) / (l || 1); return [r.a[i - 2] + (r.a[i] - r.a[i - 2]) * f, r.a[i - 1] + (r.a[i + 1] - r.a[i - 1]) * f]; } acc += l; } return [r.a[r.a.length - 2], r.a[r.a.length - 1]]; };
    const m = at(r.L / 2), p0 = at(r.L / 2 - tw / 2), p1 = at(r.L / 2 + tw / 2);
    if (Math.hypot(p1[0] - p0[0], p1[1] - p0[1]) < tw * 0.93) continue;            // too curved for a straight label
    if (m[0] < tw / 2 + 4 || m[0] > W - tw / 2 - 4 || m[1] < 12 || m[1] > H - 12) continue;
    const prev = lastAt[r.n] || []; if (prev.some(q => Math.hypot(q[0] - m[0], q[1] - m[1]) < (r.k === 'res' ? 300 : 380))) continue;
    let ok = true; const n = Math.max(2, Math.ceil(tw / 9)); const pts = []; for (let i = 0; i <= n; i++) { const q = [p0[0] + (p1[0] - p0[0]) * i / n, p0[1] + (p1[1] - p0[1]) * i / n]; pts.push(q); if (!free(q[0], q[1], 6)) { ok = false; break; } } if (!ok) continue;
    let ang = Math.atan2(p1[1] - p0[1], p1[0] - p0[0]); if (ang > Math.PI / 2) ang -= Math.PI; if (ang < -Math.PI / 2) ang += Math.PI;
    put(r.n, m[0], m[1], ang, font, C.text); for (const q of pts) taken.push([q[0], q[1], 6]); (lastAt[r.n] = prev).push(m); nl++;
  }
  return { bayShare, labels: nl };
}
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  try {
    const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
    await p.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"></body>');
    await p.addScriptTag({ path: dataJs });
    const info = await p.evaluate(draw); console.log(JSON.stringify(info));
    const jpg = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.86));
    fs.writeFileSync(outJpg, Buffer.from(jpg.split(',')[1], 'base64'));
    if (outPng) { const png = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/png')); fs.writeFileSync(outPng, Buffer.from(png.split(',')[1], 'base64')); }
    console.log('wrote', outJpg, fs.statSync(outJpg).size);
  } finally { await b.close(); }
})();
