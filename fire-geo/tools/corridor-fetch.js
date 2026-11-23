// node tools/corridor-fetch.js
// Downloads the OpenStreetMap vector data for the corridor between the two regional maps (the Ross Valley, San
// Rafael, the Bay and its bridge, Richmond, El Cerrito, Albany, Berkeley) through the Overpass API, the same way the
// Berkeley picture was made (data/city4/HANDOFF.md): a few modest queries, a generic client name, each answer cached
// on disk so nothing is asked twice. The answers are data only: tools/corridor-draw.js parses them as JSON.
//   out: tools/work/corridor-osm/<name>.json.gz + <name>.query.txt
// The corridor is the part of the world a flight between the two maps can ever show (lib/geo.js `corridor`), in
// world pixels of the Ross Valley picture: x -700 .. 7200, y -760 .. 4180.
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), vm = require('vm');
const ROOT = path.join(__dirname, '..'), OUT = path.join(__dirname, 'work', 'corridor-osm');
const w = {}, ctx = vm.createContext({ window: w, globalThis: w });
for (const f of ['data/jurisdictions.js', 'data/hazard.js', 'lib/geo.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const geo = w.FireGeo.geo, RECT = { x0: -700, y0: -760, x1: 7200, y1: 4180 };
const nw = geo.toLonLat(RECT.x0, RECT.y0), se = geo.toLonLat(RECT.x1, RECT.y1), PAD = 0.004;
const B = [se[1] - PAD, nw[0] - PAD, nw[1] + PAD, se[0] + PAD].map(v => v.toFixed(4)).join(',');     // south, west, north, east
const half = [[se[1] - PAD, nw[0] - PAD, nw[1] + PAD, (nw[0] + se[0]) / 2], [se[1] - PAD, (nw[0] + se[0]) / 2, nw[1] + PAD, se[0] + PAD]].map(b => b.map(v => v.toFixed(4)).join(','));
const Q = {
  // lines and names: main roads, rail, the coastline, towns, and the names of the bays
  base: `[out:json][timeout:150];
(way["highway"~"^(motorway|trunk|primary|secondary|tertiary)(_link)?$"](${B});
 way["railway"~"^(rail|light_rail|subway)$"](${B});
 way["natural"="coastline"](${B});
 node["place"~"^(city|town)$"](${B}););
out geom qt;
(node["natural"~"^(bay|strait)$"]["name"](${B}); way["natural"~"^(bay|strait)$"]["name"](${B}); relation["natural"~"^(bay|strait)$"]["name"](${B}););
out tags center qt;`,
  // areas: lakes, woods, parks and open space
  green: `[out:json][timeout:170];
(way["natural"~"^(water|wood|scrub|wetland)$"](${B});
 relation["natural"~"^(water|wood|scrub|wetland)$"](${B});
 way["leisure"~"^(park|nature_reserve|golf_course)$"](${B});
 relation["leisure"~"^(park|nature_reserve|golf_course)$"](${B});
 relation["boundary"="protected_area"](${B});
 way["landuse"~"^(forest|cemetery|meadow|recreation_ground)$"](${B});
 relation["landuse"~"^(forest|cemetery|meadow)$"](${B}););
out geom qt;`,
  // built-up land
  built: `[out:json][timeout:150];
(way["landuse"~"^(residential|commercial|retail|industrial)$"](${B});
 relation["landuse"~"^(residential|commercial|retail|industrial)$"](${B}););
out geom qt;`,
  // ordinary streets, geometry only, in two halves to keep each answer modest
  streetsWest: `[out:json][timeout:170];
way["highway"~"^(residential|unclassified|living_street)$"](${half[0]});
out skel geom qt;`,
  streetsEast: `[out:json][timeout:170];
way["highway"~"^(residential|unclassified|living_street)$"](${half[1]});
out skel geom qt;`,
};
const sleep = ms => new Promise(r => setTimeout(r, ms));
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  fs.writeFileSync(path.join(OUT, 'bounds.json'), JSON.stringify({ rect: RECT, bbox: B, note: 'rect is in world pixels of the Ross Valley picture; bbox is south,west,north,east' }, null, 1));
  for (const [name, q] of Object.entries(Q)) {
    const file = path.join(OUT, name + '.json.gz');
    fs.writeFileSync(path.join(OUT, name + '.query.txt'), q);
    if (fs.existsSync(file)) { console.log(name, 'cached', (fs.statSync(file).size / 1e6).toFixed(2), 'MB gz'); continue; }
    let done = false;
    for (let attempt = 1; attempt <= 4 && !done; attempt++) {
      const t0 = Date.now();
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded', 'user-agent': 'basemap-drawing-script/1.0', 'accept-encoding': 'gzip' }, body: 'data=' + encodeURIComponent(q), signal: AbortSignal.timeout(200000) });
        const text = await res.text();
        if (!res.ok || text[0] !== '{') { console.log(name, 'attempt', attempt, 'status', res.status, text.slice(0, 160).replace(/\s+/g, ' ')); await sleep(15000 * attempt); continue; }
        const j = JSON.parse(text);
        if (j.remark) console.log(name, 'remark:', String(j.remark).slice(0, 200));
        fs.writeFileSync(file, zlib.gzipSync(text));
        console.log(name, j.elements.length, 'elements,', (text.length / 1e6).toFixed(1), 'MB,', (fs.statSync(file).size / 1e6).toFixed(2), 'MB gz,', ((Date.now() - t0) / 1000).toFixed(0) + ' s', '| osm base', j.osm3s && j.osm3s.timestamp_osm_base);
        done = true;
      } catch (e) { console.log(name, 'attempt', attempt, 'failed:', String(e && e.message || e).slice(0, 160)); await sleep(15000 * attempt); }
    }
    if (!done) { console.log('GAVE UP on', name); process.exitCode = 1; }
    await sleep(4000);                                  // be gentle between queries
  }
})();
