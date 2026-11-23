// node tools/build-hazard.js
// Builds data/hazard.js from the layers of the Ross Valley Fire Department's public web map
// "Fire Hazard Severity Zones (FHSZ) & Wildland Urban Interface (WUI) Maps for the Ross Valley"
// (ArcGIS item d89835e0e7f345aea879327830d3605c, downloaded into sources/rvfd-gis/ by hand: see NOTES.md).
// Polygons are simplified to about 6 m (Douglas-Peucker) and rounded to 5 decimals. Nothing is invented:
// every ring here is a ring from that map. It also prints coverage figures used in NOTES.md.
const fs = require('fs'), path = require('path'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), GIS = path.join(ROOT, 'sources', 'rvfd-gis');
const KX = Math.cos(37.98 * Math.PI / 180);
const load = s => JSON.parse(fs.readFileSync(path.join(GIS, 'layer-' + s, 'features.geojson'), 'utf8')).features;
const polysOf = f => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates);

function dp(pts, tol) {               // Douglas-Peucker on an open polyline, tol in degrees of latitude
  if (pts.length < 3) return pts.slice();
  const keep = new Uint8Array(pts.length); keep[0] = keep[pts.length - 1] = 1;
  const stack = [[0, pts.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop(); let worst = 0, at = -1;
    const ax = pts[a][0] * KX, ay = pts[a][1], bx = pts[b][0] * KX, by = pts[b][1], dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy) || 1e-12;
    for (let i = a + 1; i < b; i++) { const d = Math.abs((pts[i][0] * KX - ax) * dy - (pts[i][1] - ay) * dx) / len; if (d > worst) { worst = d; at = i; } }
    if (worst > tol && at > 0) { keep[at] = 1; stack.push([a, at], [at, b]); }
  }
  return pts.filter((_, i) => keep[i]);
}
const areaKm2 = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return Math.abs(a / 2) * 111.32 * 111.32 * KX; };
function simplifyRing(ring, tol) {
  const open = ring.slice(0, -1); if (open.length < 4) return null;
  // split at the farthest point from the start so a closed ring simplifies evenly
  let far = 0, fd = 0; for (let i = 1; i < open.length; i++) { const d = Math.hypot((open[i][0] - open[0][0]) * KX, open[i][1] - open[0][1]); if (d > fd) { fd = d; far = i; } }
  const a = dp(open.slice(0, far + 1), tol), b = dp(open.slice(far).concat([open[0]]), tol);
  const out = a.concat(b.slice(1, -1)).map(([x, y]) => [+x.toFixed(5), +y.toFixed(5)]);
  return out.length >= 3 ? out : null;
}
const TOL = 0.000055;                  // about 6 m
const MIN_KM2 = 0.0004;                // drop slivers under 400 m2 (digitising crumbs in the source layer)
function ringsOf(f) {
  const out = [];
  for (const poly of polysOf(f)) { const outer = poly[0]; if (areaKm2(outer) < MIN_KM2) continue; const s = simplifyRing(outer, TOL); if (s) out.push(s); }
  return out;
}
// Holes (an area inside a polygon that is NOT in the zone) are kept, so the app never says "in" where the map says "out".
function holesOf(f) {
  const out = [];
  for (const poly of polysOf(f)) for (const hole of poly.slice(1)) { if (areaKm2(hole) < MIN_KM2) continue; const s = simplifyRing(hole, TOL); if (s) out.push(s); }
  return out;
}
let holes = 0;
const zones = [];
const add = (town, cls, f) => { const rings = ringsOf(f), cut = holesOf(f); holes += cut.length; if (rings.length) zones.push(cut.length ? { town, cls, rings, holes: cut } : { town, cls, rings }); };
for (const f of load('Fairfax_Merge')) add('fairfax', { High: 'high', Moderate: 'moderate', WUI: 'wui' }[f.properties.Legend], f);
for (const f of load('SanAnselmo_Merge')) add('san_anselmo', { Moderate: 'moderate', WUI: 'wui' }[f.properties.Legend], f);
for (const f of load('MRN_FireJurisdictions_RVFD')) add('ross', 'moderate', f);
const districts = [];
for (const f of load('Jurisdictional_Boundary')) {
  const n = f.properties.Name;
  const id = { 'TOWN OF SAN ANSELMO': 'san_anselmo', 'TOWN OF FAIRFAX': 'fairfax', 'TOWN OF ROSS': 'ross', 'SLEEPY HOLLOW FIRE PROTECTION DISTRICT': 'sleepy_hollow' }[n];
  districts.push({ id, name: n, rings: ringsOf(f) });
}

// ---- checks against the town limits the app hit-tests with (OpenStreetMap, from the repo's jurisdictions.js)
const ctx = { window: {} }; vm.runInNewContext(fs.readFileSync(path.join(ROOT, 'src-monday', 'monday', 'jurisdictions.js'), 'utf8'), ctx);
const J = ctx.window.JURIS;
const inRing = (x, y, r) => { let h = false; for (let i = 0, k = r.length - 1; i < r.length; k = i++) { const xi = r[i][0], yi = r[i][1], xk = r[k][0], yk = r[k][1]; if ((yi > y) !== (yk > y) && x < (xk - xi) * (y - yi) / (yk - yi) + xi) h = !h; } return h; };
const inAny = (x, y, rings) => rings.some(r => inRing(x, y, r));
const inZone = (x, y, z) => inAny(x, y, z.rings) && !(z.holes && inAny(x, y, z.holes));
const report = {};
for (const town of ['ross', 'san_anselmo', 'fairfax']) {
  const osm = J.areas.find(a => a.id === town).rings, rv = districts.find(d => d.id === town).rings, mine = zones.filter(z => z.town === town);
  let n = 0, agree = 0, inOsm = 0, cov = 0, wui = 0, mod = 0, high = 0;
  for (let y = 37.950; y < 38.0135; y += 0.00025) for (let x = -122.628; x < -122.5255; x += 0.0003) {
    const a = inAny(x, y, osm), b = inAny(x, y, rv); if (a || b) { n++; if (a === b) agree++; }
    if (a) { inOsm++; const w = mine.some(z => z.cls === 'wui' && inZone(x, y, z)), m = mine.some(z => z.cls === 'moderate' && inZone(x, y, z)), h = mine.some(z => z.cls === 'high' && inZone(x, y, z)); if (w) wui++; if (m) mod++; if (h) high++; if (w || m || h) cov++; }
  }
  report[town] = { osmVsRvfdAgreement: +(agree / n * 100).toFixed(1) + '%', mappedShare: +(cov / inOsm * 100).toFixed(1) + '%', wui: +(wui / inOsm * 100).toFixed(1) + '%', moderate: +(mod / inOsm * 100).toFixed(1) + '%', high: +(high / inOsm * 100).toFixed(1) + '%' };
}
const pts = zones.reduce((s, z) => s + z.rings.reduce((t, r) => t + r.length, 0), 0), dpts = districts.reduce((s, z) => s + z.rings.reduce((t, r) => t + r.length, 0), 0);
const sh = districts.find(d => d.id === 'sleepy_hollow');
const out = {
  source: {
    title: 'Fire Hazard Severity Zones (FHSZ) & Wildland Urban Interface (WUI) Maps for the Ross Valley',
    publisher: 'Ross Valley Fire Department',
    page: 'https://www.rossvalleyfire.gov/wildland-urban-interface-maps',
    map: 'https://rvy-fire.maps.arcgis.com/apps/instant/basic/index.html?appid=f4ea49f68a5748368d16497cd9c1ec89',
    item: 'd89835e0e7f345aea879327830d3605c', modified: '2026-07-09', fetched: '2026-11-22',
    note: 'Layers Fairfax_Merge, SanAnselmo_Merge and MRN_FireJurisdictions_RVFD ("Ross Moderate"), simplified to about 6 m. The district outline is from the layer Jurisdictional_Boundary.',
  },
  zones, sleepyHollow: sh.rings,
};
fs.writeFileSync(path.join(ROOT, 'data', 'hazard.js'),
  '// Generated by tools/build-hazard.js from the Ross Valley Fire Department public web map. Do not edit by hand.\n' +
  '// zones: fire hazard severity zones (moderate, high) and town WUI areas, per town. Rings are [lon, lat].\n// A zone may carry `holes`: rings inside it that are NOT part of the zone.\n' +
  'window.FIREGEO_HAZARD = ' + JSON.stringify(out) + ';\n');
console.log(JSON.stringify(report, null, 1));
console.log('zones', zones.length, 'points', pts, '| district points', dpts, '| holes kept', holes, '| bytes', fs.statSync(path.join(ROOT, 'data', 'hazard.js')).size);
// where is the repo's "unincorporated" pin, and a few candidate county points
const all = J.areas.map(a => [a.id, a.rings]).concat([['sleepy_hollow', sh.rings]]);
const where = (x, y) => (all.find(([, r]) => inAny(x, y, r)) || ['(none: unincorporated)'])[0];
for (const [n, x, y] of [['repo marin pin', -122.5760, 38.0040], ['west of Fairfax', -122.6240, 37.9900], ['south of Fairfax', -122.6060, 37.9660], ['between SA and Ross', -122.5850, 37.9665], ['Kentfield', -122.5560, 37.9530], ['repo ross pin', -122.5570, 37.9630], ['repo sa pin', -122.5610, 37.9755], ['repo fairfax pin', -122.5950, 37.9870]])
  console.log(n.padEnd(22), where(x, y), '| zones:', zones.filter(z => inZone(x, y, z)).map(z => z.town + ':' + z.cls).join(',') || '-');
