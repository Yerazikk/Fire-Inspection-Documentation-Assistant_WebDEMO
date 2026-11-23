// FireGeo.geo: where the pin is. No DOM. Needs window.JURIS (data/jurisdictions.js) and window.FIREGEO_HAZARD (data/hazard.js).
// lon/lat <-> world pixel (plain Web Mercator), point-in-polygon -> place id, and the mapped fire zone at a point.
//
// Two regions share ONE world. The Ross Valley basemap defines it: world pixel (0, 0) is that picture's top-left
// corner. The Berkeley basemap (data/city4/, optional) was drawn at the same ground scale with the same maths, so
// toXY() works for a Berkeley point unchanged and simply returns large numbers: that picture's top-left corner is
// at world pixel (4768, 2070). If the three data/city4 scripts are not loaded there is one region and four places,
// exactly as before.
(function (root) {
'use strict';
const J = root.JURIS, HZ = root.FIREGEO_HAZARD || { zones: [], sleepyHollow: [], source: {} };
const C4 = root.FIREGEO_CITY4 || null, C4B = root.FIREGEO_CITY4_BOUNDARY || null, C4Z = root.FIREGEO_CITY4_ZONES || null;
const M = J.map;
const merc = lat => Math.log(Math.tan(Math.PI / 4 + lat * Math.PI / 360));
const Y0 = merc(M.north), Y1 = merc(M.south);
const toXY = (lon, lat) => [(lon - M.west) / (M.east - M.west) * M.w, (merc(lat) - Y0) / (Y1 - Y0) * M.h];
const toLonLat = (x, y) => [M.west + x / M.w * (M.east - M.west), (Math.atan(Math.exp(Y0 + y / M.h * (Y1 - Y0))) * 2 - Math.PI / 2) * 180 / Math.PI];

// ---------------------------------------------------------------- regions
// x, y, w, h: where the region's picture sits in the world. view: the part of the world the map shows when it rests
// on this region (the map box is 1344 x 1289 world pixels at rest, for both).
const regions = {
  rossvalley: { id: 'rossvalley', name: 'Ross Valley', src: M.src, x: 0, y: 0, w: M.w, h: M.h, west: M.west, south: M.south, east: M.east, north: M.north, view: { x0: 96, y0: 0, x1: 1440, y1: 1289 }, attribution: '© OpenStreetMap' },
};
if (C4 && C4B && C4Z) {
  // The numbers are data/city4/basemap.json (test.js checks they still match that file).
  const b = { src: 'data/city4/basemap.jpg', w: 1640, h: 1642, west: -122.33, south: 37.8305, east: -122.2275, north: 37.9115 };
  const o = toXY(b.west, b.north).map(Math.round);
  // The view keeps the whole city inside its limit on screen and leaves out the Bay to the west.
  regions.berkeley = Object.assign({ id: 'berkeley', name: 'Berkeley', x: o[0], y: o[1], view: { x0: o[0] + 296, y0: o[1] + 60, x1: o[0] + 1640, y1: o[1] + 1349 }, attribution: '© OpenStreetMap' }, b);
}
const regionOf = (lon, lat) => { const b = regions.berkeley; return b && lon >= b.west && lon <= b.east && lat >= b.south && lat <= b.north ? 'berkeley' : 'rossvalley'; };
// Keep a point on its region's picture. `region` defaults to the region the point is in.
const clamp = (lon, lat, region) => { const r = regions[region || regionOf(lon, lat)] || regions.rossvalley; return [Math.min(r.east, Math.max(r.west, lon)), Math.min(r.north, Math.max(r.south, lat))]; };

function inRing(lon, lat, ring) {
  let hit = false;
  for (let i = 0, k = ring.length - 1; i < ring.length; k = i++) {
    const xi = ring[i][0], yi = ring[i][1], xk = ring[k][0], yk = ring[k][1];
    if ((yi > lat) !== (yk > lat) && lon < (xk - xi) * (lat - yi) / (yk - yi) + xi) hit = !hit;
  }
  return hit;
}
const inRings = (lon, lat, rings) => { for (let i = 0; i < rings.length; i++) if (inRing(lon, lat, rings[i])) return true; return false; };

// Towns first (OpenStreetMap limits, from the repo), then the fire district (Ross Valley Fire map), then the
// neighbouring cities. Anything in none of them is unincorporated county land.
const towns = J.areas.filter(a => a.kind === 'town');
const others = J.areas.filter(a => a.kind !== 'town');
const district = { id: 'sleepy_hollow', name: 'Sleepy Hollow', kind: 'district', rings: HZ.sleepyHollow || [], labelAt: [-122.5805, 38.0068] };
const areas = towns.concat([district], others);
areas.forEach(a => { a.region = 'rossvalley'; });
const berkeley = regions.berkeley ? Object.assign({}, C4B.area, { region: 'berkeley' }) : null;
if (berkeley) areas.push(berkeley);
// bounding boxes make the per-frame hit test cheap
const bbox = rings => { let a = 180, b = 90, c = -180, d = -90; for (const r of rings) for (const p of r) { if (p[0] < a) a = p[0]; if (p[0] > c) c = p[0]; if (p[1] < b) b = p[1]; if (p[1] > d) d = p[1]; } return [a, b, c, d]; };
const inBox = (lon, lat, bx) => lon >= bx[0] && lon <= bx[2] && lat >= bx[1] && lat <= bx[3];
areas.forEach(a => { a.box = bbox(a.rings); });
const zoneOf = z => ({ town: z.town, cls: z.cls, name: z.name || '', rings: z.rings, holes: z.holes || [], box: bbox(z.rings) });
const zones = (HZ.zones || []).map(zoneOf).concat(berkeley ? C4Z.zones.map(zoneOf) : []);
// A point is in a zone when it is inside one of its rings and not inside one of its holes.
const inZone = (lon, lat, z) => inBox(lon, lat, z.box) && inRings(lon, lat, z.rings) && !(z.holes.length && inRings(lon, lat, z.holes));

function locate(lon, lat) {
  if (berkeley && regionOf(lon, lat) === 'berkeley') return inBox(lon, lat, berkeley.box) && inRings(lon, lat, berkeley.rings) ? 'berkeley' : 'east_bay';
  for (let i = 0; i < areas.length; i++) { const a = areas[i]; if (a.region === 'rossvalley' && inBox(lon, lat, a.box) && inRings(lon, lat, a.rings)) return a.id; }
  return J.fallback || 'marin';
}

const CLS_WORDS = { wui: 'WUI area', high: 'High fire hazard severity zone', moderate: 'Moderate fire hazard severity zone' };
const CLS_ORDER = ['wui', 'high', 'moderate'];
// Berkeley's three zones nest: the two mitigation areas lie inside the Very High zone. The first one found, in this
// order, is the zone the parcel is in.
const B_ORDER = ['mitigation', 'very-high', 'high'];
function hazardAt(lon, lat, placeId) {
  const place = placeId || locate(lon, lat);
  if (place === 'berkeley') {
    for (const cls of B_ORDER) for (let i = 0; i < zones.length; i++) { const z = zones[i]; if (z.town === 'berkeley' && z.cls === cls && inZone(lon, lat, z)) return { scope: 'in', classes: [cls], zone: cls, zoneName: z.name, label: C4.zoneLabels[cls] }; }
    return { scope: 'out', classes: [], zone: 'none', zoneName: '', label: C4.zoneLabels.none };
  }
  if (place === 'east_bay') return { scope: 'unknown', classes: [], zone: 'unknown', zoneName: '', label: C4 ? C4.zoneLabels.unknown : '' };
  // The map draws the whole Town of Ross as one Moderate zone (its layer is the town polygon itself).
  if (place === 'ross') return { scope: 'in', classes: ['moderate'], label: CLS_WORDS.moderate };
  if (place !== 'san_anselmo' && place !== 'fairfax') return { scope: 'unknown', classes: [], label: 'Not on the Ross Valley Fire map' };
  const found = {};
  for (let i = 0; i < zones.length; i++) { const z = zones[i]; if (z.town === place && !found[z.cls] && inZone(lon, lat, z)) found[z.cls] = true; }
  const classes = CLS_ORDER.filter(c => found[c]);
  if (!classes.length) return { scope: 'out', classes, label: 'Outside the mapped zones' };
  return { scope: 'in', classes, label: classes.map(c => CLS_WORDS[c]).join(' · ') };
}
// place, scope, classes and label as before. zone (and zoneName) only where the rules are written for named zones:
// in Berkeley 'mitigation' | 'very-high' | 'high' | 'none', past its limit 'unknown', elsewhere null.
function at(lon, lat) { const place = locate(lon, lat), h = hazardAt(lon, lat, place); return { place, scope: h.scope, classes: h.classes, label: h.label, zone: h.zone || null, zoneName: h.zoneName || '', region: place === 'berkeley' || place === 'east_bay' ? 'berkeley' : 'rossvalley' }; }

const path = rings => rings.map(r => 'M' + r.map(p => { const q = toXY(p[0], p[1]); return q[0].toFixed(1) + ' ' + q[1].toFixed(1); }).join('L') + 'Z').join('');

// Shortcut pins. Ross, San Anselmo and Fairfax are the repo's. The repo's "unincorporated" pin sits inside the
// Sleepy Hollow Fire Protection District, so the county pin here is a point outside every town and district.
// Berkeley's is a house lot off Creston Road, inside the Grizzly Peak Mitigation Area (data/city4/law.js).
const pins = {
  ross: J.jurisdictions.ross.pin, san_anselmo: J.jurisdictions.san_anselmo.pin, fairfax: J.jurisdictions.fairfax.pin,
  marin: [-122.6050, 37.9690],
};
if (berkeley) pins.berkeley = C4.pin;

// Great circle between two points: [kilometres, bearing in degrees from north].
function trip(a, b) {
  const R = 6371.0088, f = Math.PI / 180, p1 = a[1] * f, p2 = b[1] * f, dl = (b[0] - a[0]) * f;
  const hav = Math.sin((p2 - p1) / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  const brg = Math.atan2(Math.sin(dl) * Math.cos(p2), Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl)) / f;
  return [2 * R * Math.asin(Math.sqrt(hav)), (brg + 360) % 360];
}

root.FireGeo = root.FireGeo || {};
root.FireGeo.geo = { map: M, toXY, toLonLat, clamp, locate, hazardAt, at, areas, hazardZones: zones, pins, path, inRings, inZone, hazardSource: HZ.source,
  regions, regionOf, trip, berkeleySource: C4Z ? C4Z.source : null,
  // the picture of everything between the two regions (data/corridor.js, drawn by tools/corridor-draw.js): { src, w, h,
  // scale, x, y, worldW, worldH (its place in the world), places:[{name, kind, lon, lat}], attribution }. Only with Berkeley.
  corridor: regions.berkeley && root.FIREGEO_CORRIDOR ? root.FIREGEO_CORRIDOR : null };
})(typeof window !== 'undefined' ? window : globalThis);
