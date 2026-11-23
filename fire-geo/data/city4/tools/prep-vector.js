// node prep-vector.js <osmDir> <boundsJson> <out.js>
// Turns the Overpass downloads (base.json, landuse.json, buildings.json) into pixel-space drawing lists for
// draw-basemap.js. Projection: plain Web Mercator inside the exact bounds, as lib/geo.js does.
'use strict';
const fs = require('fs'), path = require('path');
const [dir, bjson, out] = process.argv.slice(2);
const B = JSON.parse(fs.readFileSync(bjson, 'utf8'));
const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360)), Y1 = merc(B.north), Y0 = merc(B.south);
const X = lon => +((lon - B.west) / (B.east - B.west) * B.w).toFixed(1), Y = lat => +((Y1 - merc(lat)) / (Y1 - Y0) * B.h).toFixed(1);
const line = g => { const o = []; for (const p of g) if (p) o.push(X(p.lon), Y(p.lat)); return o; };
const read = f => { const p = path.join(dir, f); return JSON.parse(fs.existsSync(p) ? fs.readFileSync(p, 'utf8') : require('zlib').gunzipSync(fs.readFileSync(p + '.gz')).toString('utf8')).elements; };
// join member ways into closed rings
function rings(members, role) {
  const segs = members.filter(m => m.type === 'way' && m.geometry && (m.role === role || (role === 'outer' && !m.role))).map(m => m.geometry.filter(Boolean).map(p => [p.lon, p.lat]));
  const done = []; const key = p => p[0] + ',' + p[1];
  while (segs.length) {
    let cur = segs.pop(), grew = true;
    while (key(cur[0]) !== key(cur[cur.length - 1]) && grew) {
      grew = false;
      for (let i = 0; i < segs.length; i++) { const s = segs[i], end = key(cur[cur.length - 1]);
        if (key(s[0]) === end) { cur = cur.concat(s.slice(1)); segs.splice(i, 1); grew = true; break; }
        if (key(s[s.length - 1]) === end) { cur = cur.concat(s.slice(0, -1).reverse()); segs.splice(i, 1); grew = true; break; } }
    }
    if (cur.length >= 4 && key(cur[0]) === key(cur[cur.length - 1])) done.push(cur.flatMap(p => [X(p[0]), Y(p[1])]));
  }
  return done;
}
const polyOf = e => e.type === 'way' ? (e.geometry && e.geometry.length >= 4 ? [line(e.geometry)] : []) : e.type === 'relation' ? rings(e.members || [], 'outer').concat(rings(e.members || [], 'inner')) : [];
const inView = a => { for (let i = 0; i < a.length; i += 2) if (a[i] > -40 && a[i] < B.w + 40 && a[i + 1] > -40 && a[i + 1] < B.h + 40) return true; return false; };
const D = { landuse: [], green: [], wood: [], water: [], coast: [], streams: [], buildings: [], roads: [], rail: [], places: [], parks: [] };
const area = a => { let s = 0; for (let i = 0, n = a.length / 2; i < n; i++) { const j = (i + 1) % n; s += a[i * 2] * a[j * 2 + 1] - a[j * 2] * a[i * 2 + 1]; } return Math.abs(s / 2); };
const centroid = a => { let x = 0, y = 0, n = a.length / 2; for (let i = 0; i < n; i++) { x += a[i * 2]; y += a[i * 2 + 1]; } return [x / n, y / n]; };
for (const e of read('landuse.json')) { const p = polyOf(e).filter(inView); if (p.length) D.landuse.push(p); }
for (const e of read('base.json')) {
  const t = e.tags || {};
  if (e.type === 'node') { if (t.place && t.name) D.places.push({ k: t.place, n: t.name, x: X(e.lon), y: Y(e.lat) }); continue; }
  if (t.highway) {
    if (e.type !== 'way' || !e.geometry) continue;
    if (/^(proposed|construction|corridor|elevator|platform)$/.test(t.highway) || t.area === 'yes') continue;
    if (t.tunnel === 'yes' && !/motorway|trunk|primary|secondary|tertiary|residential/.test(t.highway)) continue;
    const a = line(e.geometry); if (inView(a)) D.roads.push({ c: t.highway, n: t.name || '', a, t: t.tunnel === 'yes' ? 1 : 0 });
    continue;
  }
  if (t.railway) { if (e.geometry && t.tunnel !== 'yes') { const a = line(e.geometry); if (inView(a)) D.rail.push(a); } continue; }
  if (t.natural === 'coastline') { D.coast.push(line(e.geometry)); continue; }
  if (t.waterway) { if (t.tunnel !== 'yes' && t.tunnel !== 'culvert') { const a = line(e.geometry); if (inView(a)) D.streams.push(a); } continue; }
  const p = polyOf(e).filter(inView); if (!p.length) continue;
  if (t.natural === 'water') D.water.push(p);
  else if (/^(wood|scrub)$/.test(t.natural || '') || t.landuse === 'forest') D.wood.push(p);
  else if (/^(park|pitch|golf_course|garden|playground|nature_reserve|common)$/.test(t.leisure || '') || /^(grass|cemetery|recreation_ground|meadow)$/.test(t.landuse || '') || /^(grassland|wetland)$/.test(t.natural || '') || t.boundary === 'protected_area') {
    if (t.boundary === 'protected_area' || t.leisure === 'nature_reserve') { /* outline only would clutter: use as a pale fill */ }
    D.green.push(p);
    if (t.name && /^(park|nature_reserve|golf_course)$/.test(t.leisure || '') && area(p[0]) > 2500) { const c = centroid(p[0]); D.parks.push({ n: t.name, x: +c[0].toFixed(1), y: +c[1].toFixed(1), s: Math.round(area(p[0])) }); }
  }
}
let nb = 0;
for (const e of read('buildings.json')) { for (const r of polyOf(e)) if (inView(r) && area(r) >= 1.2) { D.buildings.push(r); nb++; } }
fs.writeFileSync(out, 'window.MAPDATA = ' + JSON.stringify({ w: B.w, h: B.h, bounds: B, ...D }) + ';\n');
console.log(Object.entries(D).map(([k, v]) => k + ' ' + v.length).join(' | '), '|', (fs.statSync(out).size / 1e6).toFixed(1), 'MB');
