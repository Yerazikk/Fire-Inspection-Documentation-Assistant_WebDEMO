// Background warm-up for the demo: map tiles from the Bay Area out to the Midwest
// (both basemaps), plus the Street View stills for the demo stops. Everything goes through the tile
// service worker, so once seen it is served from cache forever. Paced and
// idle-driven so it never competes with what the inspector is doing.
(() => {
  const SAT = 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
  const OSM = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
  const d2r = Math.PI / 180;
  const tx = (lon, z) => Math.floor((lon + 180) / 360 * 2 ** z);
  const ty = (lat, z) => Math.floor((1 - Math.log(Math.tan(lat * d2r) + 1 / Math.cos(lat * d2r)) / Math.PI) / 2 * 2 ** z);
  // Regions: [south, west, north, east, zMin, zMax]
  const REGIONS = [
    [24, -125, 50, -84, 3, 7],          // West coast → Midwest, coarse
    [36.5, -124.5, 41, -119, 8, 9],     // Northern California
    [37.75, -123.0, 38.15, -122.35, 10, 13], // Marin + SF bay, where the day happens
    [37.84, -122.72, 38.03, -122.45, 14, 15],  // the stops themselves
  ];
  function urls() {
    const out = [];
    for (const [s, w, n, e, z0, z1] of REGIONS) for (let z = z0; z <= z1; z++) {
      const x0 = tx(w, z), x1 = tx(e, z), y0 = ty(n, z), y1 = ty(s, z);
      for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
        out.push(SAT.replace('{z}', z).replace('{x}', x).replace('{y}', y));
        out.push(OSM.replace('{z}', z).replace('{x}', x).replace('{y}', y));
      }
    }
    return out;
  }
  // The demo stops’ Street View stills (preview strip + list thumbnail sizes), via the
  // same server proxy and URL shape as GMAP.street(), so the SW cache entry matches.
  function stills() {
    const pts = [];
    if (typeof CONFIG !== 'undefined' && CONFIG.station) pts.push(CONFIG.station);
    if (typeof ADDRESSES !== 'undefined') ['a8', 'a1', 'a2', 'a6'].forEach(id => { const a = ADDRESSES.find(x => x.id === id); if (a) pts.push(a); });
    const u = (p, w, h) => `/api/streetview?lat=${(+p.lat).toFixed(6)}&lon=${(+p.lon).toFixed(6)}&w=${w}&h=${h}`;
    return pts.flatMap(p => [u(p, 640, 267), u(p, 192, 144)]);
  }
  let queue = [], active = 0, done = 0, started = false;
  const CONC = 6, GAP = 35;
  function pump() {
    while (active < CONC && queue.length) {
      const u = queue.shift(); active++;
      fetch(u, { mode: 'cors', credentials: 'omit', cache: 'force-cache', priority: 'low' }).catch(() => {}).finally(() => { active--; done++; setTimeout(pump, GAP); });
    }
    if (!queue.length && !active) console.log(`prefetch · ${done} tiles warmed`);
  }
  function start() {
    if (started) return; started = true;
    queue = stills().concat(urls());   // stills first: they are what the demo taps into
    console.log(`prefetch · warming ${queue.length} tiles across ${REGIONS.length} regions`);
    const go = () => (navigator.serviceWorker && navigator.serviceWorker.controller) ? pump() : setTimeout(go, 400);
    go();
  }
  window.PREFETCH = { start, get pending() { return queue.length; }, get done() { return done; } };
  // begin once the page is idle after load; never on a metered connection
  const c = navigator.connection; if (c && (c.saveData || /2g/.test(c.effectiveType || ''))) return;
  addEventListener('load', () => ('requestIdleCallback' in window ? requestIdleCallback(start, { timeout: 4000 }) : setTimeout(start, 2500)));
})();
