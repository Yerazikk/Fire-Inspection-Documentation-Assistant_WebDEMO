// node tools/corridor-draw.js
// Draws the corridor basemap from the OpenStreetMap data that tools/corridor-fetch.js saved, in headless Chrome (no
// window), in the palette of the Berkeley picture (data/city4/tools/draw-basemap.js, measured from the Ross Valley
// tiles). Same Web Mercator maths as lib/geo.js, so both regional pictures register on it to the pixel.
//   in:  tools/work/corridor-osm/*.json.gz
//   out: assets/corridor.jpg   3160 x 1976, 0.4 picture pixels per world pixel
//        assets/corridor.json  bounds, source, the town and bay names (drawn by the page as labels, not baked in)
//        data/corridor.js      the same record as window.FIREGEO_CORRIDOR
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), IN = path.join(__dirname, 'work', 'corridor-osm');
const { chromium } = require('/Users/andrewdong/Downloads/Timeline3D/node_modules/playwright');
const killer = setTimeout(() => { console.log('hard timeout'); process.exit(1); }, 240000);
const w = {}, ctx = vm.createContext({ window: w, globalThis: w });
for (const f of ['data/jurisdictions.js', 'data/hazard.js', 'lib/geo.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const geo = w.FireGeo.geo, RECT = JSON.parse(fs.readFileSync(path.join(IN, 'bounds.json'), 'utf8')).rect, SCALE = 0.4;
const W = Math.round((RECT.x1 - RECT.x0) * SCALE), H = Math.round((RECT.y1 - RECT.y0) * SCALE);
const read = name => JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(IN, name + '.json.gz'))).toString('utf8'));
const P = (lon, lat) => { const q = geo.toXY(lon, lat); return [(q[0] - RECT.x0) * SCALE, (q[1] - RECT.y0) * SCALE]; };
// a line as flat [x, y, ...] in picture pixels, dropping points that would land within 0.35 px of the last one
function line(geom) { const o = []; let lx = 1e9, ly = 1e9; for (const g of geom) { if (!g) continue; const p = P(g.lon, g.lat); if (Math.abs(p[0] - lx) < 0.35 && Math.abs(p[1] - ly) < 0.35) continue; lx = p[0]; ly = p[1]; o.push(+p[0].toFixed(1), +p[1].toFixed(1)); } const n = geom.length; if (n) { const e = P(geom[n - 1].lon, geom[n - 1].lat); if (o.length < 2 || o[o.length - 2] !== +e[0].toFixed(1) || o[o.length - 1] !== +e[1].toFixed(1)) o.push(+e[0].toFixed(1), +e[1].toFixed(1)); } return o; }
const inView = a => { for (let i = 0; i < a.length; i += 2) if (a[i] > -30 && a[i] < W + 30 && a[i + 1] > -30 && a[i + 1] < H + 30) return true; return false; };
// join a relation's member ways into closed rings
function rings(members) {
  const segs = members.filter(m => m.type === 'way' && m.geometry && m.geometry.length > 1).map(m => m.geometry.filter(Boolean)), key = p => p.lon + ',' + p.lat, done = [];
  while (segs.length) {
    let cur = segs.pop(), grew = true;
    while (key(cur[0]) !== key(cur[cur.length - 1]) && grew) { grew = false; const end = key(cur[cur.length - 1]);
      for (let i = 0; i < segs.length; i++) { const s = segs[i]; if (key(s[0]) === end) { cur = cur.concat(s.slice(1)); segs.splice(i, 1); grew = true; break; } if (key(s[s.length - 1]) === end) { cur = cur.concat(s.slice(0, -1).reverse()); segs.splice(i, 1); grew = true; break; } } }
    if (cur.length >= 4 && key(cur[0]) === key(cur[cur.length - 1])) done.push(line(cur));
  }
  return done;
}
const polys = e => (e.type === 'way' ? (e.geometry && e.geometry.length >= 4 ? [line(e.geometry)] : []) : e.type === 'relation' ? rings(e.members || []) : []).filter(r => r.length >= 6 && inView(r));
const D = { built: [], green: [], wood: [], water: [], coast: [], streets: [], roads: {}, rail: [] }, places = [];
const inRect = (lon, lat) => { const q = geo.toXY(lon, lat); return q[0] > RECT.x0 + 60 && q[0] < RECT.x1 - 60 && q[1] > RECT.y0 + 40 && q[1] < RECT.y1 - 40; };
const base = read('base'); let stamp = base.osm3s && base.osm3s.timestamp_osm_base;
for (const e of base.elements) {
  const t = e.tags || {};
  if (e.type === 'node' && t.place && t.name) { if (inRect(e.lon, e.lat)) places.push({ name: t.name, kind: t.place, lon: +e.lon.toFixed(5), lat: +e.lat.toFixed(5), pop: +t.population || 0 }); continue; }
  if (/^(bay|strait)$/.test(t.natural || '') && t.name) { const c = e.center || e; if (c.lon != null && inRect(c.lon, c.lat)) places.push({ name: t.name, kind: 'water', lon: +c.lon.toFixed(5), lat: +c.lat.toFixed(5), pop: 0 }); continue; }
  if (e.type !== 'way' || !e.geometry) continue;
  if (t.natural === 'coastline') { D.coast.push(line(e.geometry)); continue; }
  if (t.railway) { if (t.tunnel !== 'yes' && t.service == null) { const a = line(e.geometry); if (inView(a)) D.rail.push(a); } continue; }
  if (t.highway) { const k = /^(motorway|trunk)$/.test(t.highway) ? 'mot' : /_link$/.test(t.highway) ? 'link' : t.highway === 'primary' ? 'pri' : t.highway === 'secondary' ? 'sec' : t.highway === 'tertiary' ? 'ter' : ''; if (!k) continue; const a = line(e.geometry); if (inView(a)) (D.roads[k] = D.roads[k] || []).push(a); }
}
for (const e of read('built').elements) { const p = polys(e); if (p.length) D.built.push(p); }
for (const e of read('green').elements) {
  const t = e.tags || {}, p = polys(e); if (!p.length) continue;
  if (t.natural === 'water') D.water.push(p);
  else if (/^(wood|scrub)$/.test(t.natural || '') || t.landuse === 'forest') D.wood.push(p);
  else D.green.push(p);
}
for (const half of ['streetsWest', 'streetsEast']) for (const e of read(half).elements) { if (e.geometry) { const a = line(e.geometry); if (a.length >= 4 && inView(a)) D.streets.push(a); } }
const dataFile = path.join(__dirname, 'work', 'corridor-data.js');
fs.writeFileSync(dataFile, 'window.MAPDATA = ' + JSON.stringify({ w: W, h: H, ...D }) + ';\n');
console.log('draw lists:', Object.entries(D).map(([k, v]) => k + ' ' + (Array.isArray(v) ? v.length : Object.values(v).reduce((n, a) => n + a.length, 0))).join(' | '), '|', (fs.statSync(dataFile).size / 1e6).toFixed(1), 'MB | places', places.length);

function draw(seeds) {
  const D = window.MAPDATA, W = D.w, H = D.h, cv = document.createElement('canvas'); cv.width = W; cv.height = H; document.body.appendChild(cv);
  const g = cv.getContext('2d'); g.lineJoin = 'round'; g.lineCap = 'round';
  const C = { ground: '#f9f9f7', built: '#efefec', green: '#e3e7dd', wood: '#cbd3c9', water: '#cfd9db', casing: '#d9d8d4', street: '#ffffff', secondary: '#f3eedd', secCase: '#d9d2bd', primary: '#e9dcc8', priCase: '#cdbfa9', motorway: '#cfbcc1', motCase: '#b7a4aa', rail: '#a9a9a6' };
  const ring = a => { g.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) g.lineTo(a[i], a[i + 1]); g.closePath(); };
  const fill = (list, col) => { g.fillStyle = col; for (const p of list) { g.beginPath(); for (const r of p) ring(r); g.fill('evenodd'); } };
  const stroke = (c, list, col, wd, dash) => { c.strokeStyle = col; c.lineWidth = wd; c.setLineDash(dash || []); c.beginPath(); for (const a of list) { c.moveTo(a[0], a[1]); for (let i = 2; i < a.length; i += 2) c.lineTo(a[i], a[i + 1]); } c.stroke(); c.setLineDash([]); };
  g.fillStyle = C.ground; g.fillRect(0, 0, W, H);
  fill(D.built, C.built); fill(D.green, C.green); fill(D.wood, C.wood);
  // the sea: the coastline on a mask, flooded from points known to be water, then painted
  const m = document.createElement('canvas'); m.width = W; m.height = H; const c = m.getContext('2d'); c.fillStyle = '#fff'; c.fillRect(0, 0, W, H); c.lineJoin = 'round'; c.lineCap = 'round'; stroke(c, D.coast, '#000', 2.2);
  const d = c.getImageData(0, 0, W, H).data, seen = new Uint8Array(W * H), st = [];
  for (const s of seeds) { const k = Math.round(s[1]) * W + Math.round(s[0]); if (s[0] >= 0 && s[1] >= 0 && s[0] < W && s[1] < H && d[k * 4] >= 128) st.push(k); }
  let n = 0; while (st.length) { const k = st.pop(); if (seen[k] || d[k * 4] < 128) continue; seen[k] = 1; n++; const x = k % W; if (x > 0) st.push(k - 1); if (x < W - 1) st.push(k + 1); if (k >= W) st.push(k - W); if (k < W * (H - 1)) st.push(k + W); }
  // grow by one pixel to cover the mask line, then paint
  const o = c.createImageData(W, H), od = o.data;
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const k = y * W + x; if (seen[k] || (x > 0 && seen[k - 1]) || (x < W - 1 && seen[k + 1]) || (y > 0 && seen[k - W]) || (y < H - 1 && seen[k + W])) { od[k * 4] = 0xcf; od[k * 4 + 1] = 0xd9; od[k * 4 + 2] = 0xdb; od[k * 4 + 3] = 255; } }
  c.clearRect(0, 0, W, H); c.putImageData(o, 0, 0); g.drawImage(m, 0, 0);
  fill(D.water, C.water);
  // streets as hairlines, then the main roads, widest last. A little bolder than strict scale: this picture is seen zoomed out.
  stroke(g, D.streets, C.casing, 1.5); stroke(g, D.streets, C.street, 0.95);
  const R = D.roads, S = [['ter', 2.1, C.casing, C.street, 1.5], ['link', 2.0, C.motCase, C.motorway, 1.3], ['sec', 2.7, C.secCase, C.secondary, 2.0], ['pri', 3.2, C.priCase, C.primary, 2.4], ['mot', 3.9, C.motCase, C.motorway, 3.0]];
  for (const [k, cw, cc] of S) stroke(g, R[k] || [], cc, cw);
  for (const [k, , , fc, fw] of S) stroke(g, R[k] || [], fc, fw);
  stroke(g, D.rail, C.rail, 0.7, [3, 2]);
  const isSea = (x, y) => !!seen[Math.round(y) * W + Math.round(x)];
  return { sea: n / (W * H), probe: window.PROBES.map(p => [p[0], isSea(p[1], p[2])]) };
}
(async () => {
  const b = await chromium.launch({ channel: 'chrome', headless: true, args: ['--mute-audio'] });
  try {
    const p = await b.newPage({ viewport: { width: 800, height: 600 }, deviceScaleFactor: 1 });
    await p.setContent('<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"></body>');
    await p.addScriptTag({ path: dataFile });
    // points known to be water (flood seeds) and points that must come out as land or water (a check on the flood)
    const seeds = [[-122.40, 37.92], [-122.40, 37.84], [-122.44, 38.03], [-122.66, 37.82]].map(s => P(s[0], s[1]));       // open water only: a seed on land would flood the land
    const probes = [['mid-bay', -122.40, 37.92, true], ['Richardson Bay', -122.49, 37.868, true], ['off Muir Beach', -122.62, 37.83, true], ['by the bridge', -122.45, 37.937, true], ['San Pablo Bay', -122.42, 38.03, true], ['San Rafael', -122.531, 37.973, false], ['Richmond', -122.35, 37.94, false], ['Berkeley', -122.27, 37.87, false], ['Mill Valley', -122.545, 37.906, false], ['Angel Island', -122.43, 37.862, false], ['Tiburon', -122.47, 37.895, false], ['Point Pinole', -122.36, 38.00, false], ['Oakland hills', -122.20, 37.84, false], ['Mount Tamalpais', -122.596, 37.923, false], ['Ross', -122.557, 37.963, false], ['El Cerrito', -122.31, 37.916, false]];
    await p.evaluate(v => { window.PROBES = v; }, probes.map(q => [q[0], ...P(q[1], q[2])]));
    const info = await p.evaluate(draw, seeds);
    const wrong = info.probe.filter((r, i) => r[1] !== probes[i][3]).map(r => r[0]);
    console.log('sea share', (info.sea * 100).toFixed(1) + '%', '| land / water probes wrong:', wrong.length ? wrong.join(', ') : 'none');
    if (wrong.length || info.sea < 0.12 || info.sea > 0.6) { console.log('the flood did not come out right: nothing written'); process.exitCode = 1; return; }
    const jpg = await p.evaluate(() => document.querySelector('canvas').toDataURL('image/jpeg', 0.8));
    const out = path.join(ROOT, 'assets', 'corridor.jpg'); fs.writeFileSync(out, Buffer.from(jpg.split(',')[1], 'base64'));
    // names for the page to draw: towns and cities, and the bays. Kept apart from each other at the scale they are seen at.
    const want = places.filter(q => q.kind !== 'water' || /^(San Francisco Bay|San Pablo Bay|Richardson Bay)$/.test(q.name)).sort((a, b) => (a.kind === 'water') - (b.kind === 'water') || (b.kind === 'city') - (a.kind === 'city') || b.pop - a.pop), kept = [];
    for (const q of want) { const xy = geo.toXY(q.lon, q.lat), half = q.name.length * 9 + 26; if (kept.every(k => Math.abs(k.x - xy[0]) > half + k.half || Math.abs(k.y - xy[1]) > 64)) kept.push({ ...q, x: xy[0], y: xy[1], half }); }
    const nw = geo.toLonLat(RECT.x0, RECT.y0), se = geo.toLonLat(RECT.x1, RECT.y1);
    const rec = { src: 'assets/corridor.jpg', w: W, h: H, scale: SCALE, x: RECT.x0, y: RECT.y0, worldW: RECT.x1 - RECT.x0, worldH: RECT.y1 - RECT.y0, west: +nw[0].toFixed(5), north: +nw[1].toFixed(5), east: +se[0].toFixed(5), south: +se[1].toFixed(5),
      attribution: '© OpenStreetMap contributors', credit: 'Corridor map drawn for this page from OpenStreetMap data (Overpass API, five queries, saved under tools/work/corridor-osm). © OpenStreetMap contributors.',
      source: 'OpenStreetMap through the Overpass API (https://overpass-api.de/api/interpreter), OSM base timestamp ' + stamp, drawn: new Date().toISOString().slice(0, 10), tools: ['tools/corridor-fetch.js', 'tools/corridor-draw.js'],
      note: 'x, y, worldW, worldH: where the picture sits in the world of lib/geo.js (pixels of the Ross Valley picture). Names are not baked in: the page draws `places` as labels.',
      places: kept.map(q => ({ name: q.name, kind: q.kind, lon: q.lon, lat: q.lat })) };
    fs.writeFileSync(path.join(ROOT, 'assets', 'corridor.json'), JSON.stringify(rec, null, 1) + '\n');
    fs.writeFileSync(path.join(ROOT, 'data', 'corridor.js'), '// Generated by tools/corridor-draw.js. Do not edit by hand. The same record is in assets/corridor.json.\nwindow.FIREGEO_CORRIDOR = ' + JSON.stringify(rec) + ';\n');
    console.log('wrote', out, (fs.statSync(out).size / 1e6).toFixed(2), 'MB,', W + ' x ' + H, '| names:', rec.places.map(q => q.name).join(', '));
  } finally { await b.close(); clearTimeout(killer); }
})();
