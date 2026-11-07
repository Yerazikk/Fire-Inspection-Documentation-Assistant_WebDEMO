// Real addresses, real roads, real drive times for the day plan.
//
//   geocoding   Photon (OpenStreetMap) for the typeahead, Nominatim for a
//               full-string lookup when Photon has nothing. Both free, no key.
//   routing     OSRM public car profile. /table gives the pairwise driving-time
//               matrix, /route gives the actual road geometry and per-leg times.
//   ordering    Exhaustive. Every ordering of today's stops is driven from HQ
//               and timed; the fastest wins. That is the same answer an
//               inspector would reach by trying every combination in Maps by
//               hand, which is exactly what this replaces.
//   lookups     Every address that becomes a stop is kept in localStorage, so
//               past site lookups survive a reload and come back in the
//               typeahead.
window.GEO = (function () {
  const OSRM = 'https://router.project-osrm.org';
  const PHOTON = 'https://photon.komoot.io/api';
  const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
  const LS_LOOK = 'fi3.lookups.v1', LS_GEO = 'fi3.geocache.v1';

  // ---------------------------------------------------------------- plumbing
  const readLS = (k, d) => { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } };
  const writeLS = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* private mode, or quota */ } };

  async function jget(url, ms = 10000) {
    const ctl = new AbortController(); const t = setTimeout(() => ctl.abort(), ms);
    try {
      const r = await fetch(url, { signal: ctl.signal, mode: 'cors' });
      if (!r.ok) throw new Error('HTTP ' + r.status + ' from ' + new URL(url).host);
      return await r.json();
    } finally { clearTimeout(t); }
  }

  const fmtTime = s => { s = Math.max(0, Math.round(s)); const h = Math.floor(s / 3600), m = Math.round((s % 3600) / 60); return h ? h + ' h ' + String(m).padStart(2, '0') + ' m' : m + ' min'; };
  const fmtDist = m => m >= 160 ? (m / 1609.344).toFixed(m < 16093 ? 1 : 0) + ' mi' : Math.round(m / 0.3048) + ' ft';
  const fmtNum = n => n.toLocaleString('en-US');

  // ------------------------------------------------------------ past lookups
  let lookups = readLS(LS_LOOK, []);
  const lookupsApi = {
    all: () => lookups.slice().sort((a, b) => String(b.last || '').localeCompare(String(a.last || ''))),
    count: () => lookups.length,
    get: id => lookups.find(l => l.id === id) || null,
    record(a) {
      const now = new Date().toISOString();
      let l = lookups.find(x => x.id === a.id);
      if (l) { l.count = (l.count || 0) + 1; l.last = now; l.lat = a.lat; l.lon = a.lon; }
      else { l = { id: a.id, addr: a.addr, where: a.where || '', lat: a.lat, lon: a.lon, osm: a.osm || '', source: a.source || 'seed', count: 1, first: now, last: now }; lookups.push(l); }
      writeLS(LS_LOOK, lookups); return l;
    },
    forget(id) { lookups = lookups.filter(l => l.id !== id); writeLS(LS_LOOK, lookups); },
    clear() { lookups = []; writeLS(LS_LOOK, lookups); },
  };

  // -------------------------------------------------------------- geocoding
  const gcache = readLS(LS_GEO, {});
  const net = new Map(); // matrix / route results, for this session only

  function fromPhoton(f) {
    const p = f.properties || {}, c = (f.geometry || {}).coordinates;
    if (!c) return null;
    const street = [p.housenumber, p.street].filter(Boolean).join(' ');
    const addr = street || p.name || '';
    if (!addr) return null;
    const where = [p.city || p.town || p.village || p.district || p.county, p.state, p.postcode].filter(Boolean).join(', ');
    return { addr, where, num: p.housenumber || '', lat: c[1], lon: c[0], source: 'photon', osm: (p.osm_type || '') + (p.osm_id || '') };
  }
  function fromNominatim(r) {
    const parts = String(r.display_name || '').split(', ').map(s => s.trim()).filter(Boolean);
    const numbered = /^\d/.test(parts[0]) && parts.length > 1;
    const addr = numbered ? parts[0] + ' ' + parts[1] : parts[0];
    const rest = numbered ? parts.slice(2) : parts.slice(1);
    return { addr: addr || r.display_name, where: rest.slice(0, 3).join(', '), num: numbered ? parts[0] : '', lat: +r.lat, lon: +r.lon, source: 'nominatim', osm: (r.osm_type || '') + (r.osm_id || '') };
  }

  // Typeahead, cached per query so re-typing never hits the network twice.
  async function suggest(q, near) {
    q = String(q || '').trim(); if (q.length < 3) return [];
    const key = q.toLowerCase() + (near ? '@' + near.map(n => n.toFixed(2)).join(',') : '');
    if (gcache[key]) return gcache[key];
    const wantsNumber = /^\s*\d+[a-z]?\s+\S/i.test(q);
    let out = [];
    try {
      let u = PHOTON + '?limit=6&lang=en&q=' + encodeURIComponent(q);
      if (near) u += '&lat=' + near[0] + '&lon=' + near[1];
      out = ((await jget(u, 7000)).features || []).map(fromPhoton).filter(Boolean);
    } catch (e) { out = []; }
    // Photon often answers a numbered query with the street it sits on. When the
    // query names a house number and nothing came back carrying one, ask
    // Nominatim too and let its numbered hits lead.
    if (!out.length || (wantsNumber && !out.some(r => r.num))) {
      try {
        let u = NOMINATIM + '?format=jsonv2&addressdetails=0&limit=6&q=' + encodeURIComponent(q);
        if (near) u += '&viewbox=' + [near[1] - .6, near[0] + .5, near[1] + .6, near[0] - .5].join(',');
        const j = await jget(u, 9000);
        out = (Array.isArray(j) ? j : []).map(fromNominatim).concat(out);
      } catch (e) { /* keep whatever Photon gave */ }
    }
    if (wantsNumber) out.sort((a, b) => (b.num ? 1 : 0) - (a.num ? 1 : 0));
    // Drop repeats. A street with no house number is one choice however many
    // OSM segments carry the name, so those collapse on the name alone.
    const seenAt = new Set(), seenAs = new Set();
    out = out.filter(r => {
      if (!isFinite(r.lat) || !isFinite(r.lon) || !r.addr) return false;
      const at = r.lat.toFixed(5) + ',' + r.lon.toFixed(5);
      const as = (r.num ? r.addr + '|' + r.where : r.addr).toLowerCase();
      if (seenAt.has(at) || seenAs.has(as)) return false;
      seenAt.add(at); seenAs.add(as); return true;
    }).slice(0, 6);
    // OSM often has the street but not the individual house. Keep the number the
    // inspector typed, pin it on the street, and say so rather than quietly
    // dropping it.
    if (wantsNumber) {
      const typed = q.match(/^\s*(\d+[a-z]?)\s+/i)[1];
      out.forEach(r => { if (!r.num) { r.addr = typed + ' ' + r.addr; r.approx = true; } });
    }
    gcache[key] = out; writeLS(LS_GEO, gcache);
    return out;
  }
  const geocode = async (q, near) => (await suggest(q, near))[0] || null;

  // ----------------------------------------------------------------- routing
  const coordStr = pts => pts.map(p => p.lon.toFixed(6) + ',' + p.lat.toFixed(6)).join(';');

  // Driving time and distance between every pair of points.
  async function table(pts) {
    const key = 't|' + coordStr(pts);
    if (net.has(key)) return net.get(key);
    const j = await jget(OSRM + '/table/v1/driving/' + coordStr(pts) + '?annotations=duration,distance', 20000);
    if (j.code !== 'Ok') throw new Error('OSRM table: ' + (j.message || j.code));
    const out = { durations: j.durations, distances: j.distances, pairs: pts.length * (pts.length - 1) };
    net.set(key, out); return out;
  }

  // The driven road itself: full geometry plus a time and distance per leg.
  async function road(pts) {
    const key = 'r|' + coordStr(pts);
    if (net.has(key)) return net.get(key);
    const j = await jget(OSRM + '/route/v1/driving/' + coordStr(pts) + '?overview=full&geometries=geojson&steps=false', 20000);
    if (j.code !== 'Ok' || !(j.routes || []).length) throw new Error('OSRM route: ' + (j.message || j.code));
    const r = j.routes[0];
    const out = {
      line: r.geometry.coordinates.map(c => [c[1], c[0]]),
      duration: r.duration, distance: r.distance,
      legs: (r.legs || []).map(l => ({ duration: l.duration, distance: l.distance })),
    };
    net.set(key, out); return out;
  }

  // ------------------------------------------------------------- the ordering
  // Point 0 is HQ; points 1..n are today's stops. We want the ordering of
  // 1..n that is fastest to drive starting from HQ - an open path, the day
  // ends at the last stop.
  const factorial = n => { let f = 1; for (let i = 2; i <= n; i++) f *= i; return f; };
  const costOf = (dur, order) => { if (!order.length) return 0; let c = dur[0][order[0]]; for (let i = 1; i < order.length; i++) c += dur[order[i - 1]][order[i]]; return c; };

  // Heap's algorithm: yields all n! orderings, reusing one array in place.
  function* permute(a) {
    const n = a.length, c = new Array(n).fill(0);
    yield a;
    let i = 1;
    while (i < n) {
      if (c[i] < i) { const k = i % 2 ? c[i] : 0; const t = a[i]; a[i] = a[k]; a[k] = t; c[i]++; i = 1; yield a; }
      else { c[i] = 0; i++; }
    }
  }

  // Literally every combination, timed one at a time, in slices so the count
  // can be watched while it runs.
  async function exhaustive(dur, n, onTick) {
    const seq = []; for (let i = 1; i <= n; i++) seq.push(i);
    const it = permute(seq), total = factorial(n);
    let best = null, bestCost = Infinity, tried = 0, done = false;
    while (!done) {
      const t0 = performance.now();
      while (performance.now() - t0 < 12) {
        const step = it.next();
        if (step.done) { done = true; break; }
        const p = step.value;
        let c = dur[0][p[0]];
        for (let i = 1; i < n; i++) c += dur[p[i - 1]][p[i]];
        tried++;
        if (c < bestCost) { bestCost = c; best = p.slice(); }
      }
      onTick && onTick(tried, total);
      if (!done) await new Promise(r => requestAnimationFrame(r));
    }
    return { order: best, cost: bestCost, tried, total, method: 'exhaustive' };
  }

  // The same answer, reached by dynamic programming over subsets instead of by
  // listing the orderings. Still exact: no ordering can beat what it returns.
  function heldKarp(dur, n) {
    const SZ = 1 << n, INF = Infinity;
    const dp = new Float64Array(SZ * n).fill(INF), par = new Int16Array(SZ * n).fill(-1);
    for (let j = 0; j < n; j++) dp[(1 << j) * n + j] = dur[0][j + 1];
    for (let mask = 1; mask < SZ; mask++) for (let j = 0; j < n; j++) {
      if (!(mask & (1 << j))) continue;
      const cur = dp[mask * n + j]; if (cur === INF) continue;
      for (let k = 0; k < n; k++) {
        if (mask & (1 << k)) continue;
        const nm = mask | (1 << k), v = cur + dur[j + 1][k + 1];
        if (v < dp[nm * n + k]) { dp[nm * n + k] = v; par[nm * n + k] = j; }
      }
    }
    const full = SZ - 1; let end = 0, bestCost = INF;
    for (let j = 0; j < n; j++) if (dp[full * n + j] < bestCost) { bestCost = dp[full * n + j]; end = j; }
    const order = []; let mask = full, j = end;
    while (j >= 0) { order.unshift(j + 1); const pj = par[mask * n + j]; mask ^= (1 << j); j = pj; }
    return { order, cost: bestCost, tried: factorial(n), total: factorial(n), method: 'exact' };
  }

  // Too many stops to be exact about: nearest stop first, then 2-opt until it
  // stops improving.
  function heuristic(dur, n) {
    const left = new Set(); for (let i = 1; i <= n; i++) left.add(i);
    let at = 0; const nn = [];
    while (left.size) { let b = -1, bc = Infinity; for (const v of left) if (dur[at][v] < bc) { bc = dur[at][v]; b = v; } nn.push(b); left.delete(b); at = b; }
    let best = nn, bestCost = costOf(dur, nn), tried = 1, again = true;
    while (again) {
      again = false;
      for (let i = 0; i < n - 1; i++) for (let k = i + 1; k < n; k++) {
        const cand = best.slice(0, i).concat(best.slice(i, k + 1).reverse(), best.slice(k + 1));
        tried++;
        const c = costOf(dur, cand);
        if (c < bestCost - 1e-9) { bestCost = c; best = cand; again = true; }
      }
    }
    return { order: best, cost: bestCost, tried, total: factorial(n), method: 'heuristic' };
  }

  async function fastestOrder(dur, n, onTick) {
    if (n <= 1) return { order: n ? [1] : [], cost: n ? dur[0][1] : 0, tried: 1, total: 1, method: 'exhaustive' };
    if (n <= 8) return exhaustive(dur, n, onTick);   // up to 40,320 orderings, one by one
    if (n <= 14) return heldKarp(dur, n);            // exact, but over subsets
    return heuristic(dur, n);
  }

  return { suggest, geocode, table, road, fastestOrder, costOf, factorial, lookups: lookupsApi, fmtTime, fmtDist, fmtNum, OSRM };
})();
