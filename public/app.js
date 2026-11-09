// V3 app: implements spec.js. One state object, one router, one render per screen.
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const clock = () => new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).replace(/ ?[AP]M/i, '');
const dateIn = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' }); };
const fmtDate = iso => new Date(iso + 'T12:00:00').toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
const todayISO = () => new Date().toISOString().slice(0, 10);
const addrOf = id => ADDRESSES.find(a => a.id === id);
// A dictated memo's length, mm:ss — shown while it records and again on the record.
const clipLen = ms => { const s = Math.round(ms / 1000); return (s < 60 ? '0:' : Math.floor(s / 60) + ':') + String(s % 60).padStart(2, '0'); };
const clone = o => JSON.parse(JSON.stringify(o));
// The one photo the hard-coded AR boxes in SCAN were measured against. Any
// other photo gets no boxes: percentages taken off this image would land in
// the wrong places on a different one.
const FIXTURE = 'assets/original.jpg';

let timers = []; const later = (fn, ms) => { const t = setTimeout(fn, ms); timers.push(t); return t; }; const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };
// Drafting a record is a network call, so it outlives the scan animation and
// can land after the inspector has cancelled or walked away. Every analysis
// takes a token; a reply holding a stale one is dropped.
let runSeq = 0; const newRun = () => ++runSeq; const isCurrentRun = n => n === runSeq;
const toast = () => {};
function confirmSheet(title, body, buttons) { const el = document.createElement('div'); el.className = 'confirm'; el.innerHTML = `<div class="cbox"><div class="ct">${esc(title)}</div><div class="cb">${esc(body)}</div><div class="cbtns">${buttons.map((b, i) => `<button class="btn ${b.cls || ''}" data-i="${i}">${esc(b.label)}</button>`).join('')}</div></div>`; $('#app').appendChild(el); el.querySelectorAll('[data-i]').forEach(b => b.onclick = () => { el.remove(); const fn = buttons[+b.dataset.i].fn; fn && fn(); }); el.onclick = e => { if (e.target === el) el.remove(); }; return el; }
function img(src, ph) { return `<img src="${src}" onerror="this.style.display='none';this.nextElementSibling.style.display='grid'"><div class="ph" style="display:none">${ph}</div>`; }

// ---------------- state ----------------
const fresh = () => ({ screen: 'map', stack: [], stops: [], done: new Set(), sel: null, sheet: 'half', entries: {}, ver: {}, cur: null, tab: 'today', snapshot: null,
  route: null, best: null, plan: null, routing: false,
  draft: null, rec: null, recDirty: false, deck: null, report: {}, notice: {}, wobble: false, posIdx: 0, menu: false, days: { q: '', cal: false },
  satZoom: 'parcel', basemap: 'sat' });
let S = fresh();
const POS = [[58, 46], [30, 40], [62, 30], [44, 64], [70, 58]];
const entriesOf = id => (S.entries[id] = S.entries[id] || []);
const bump = id => { S.ver[id] = (S.ver[id] || 0) + 1; };

// ---------------- router ----------------
// Leaving a screen closes the microphone. Holding the memo bar opens it for
// real, and an open recording whose UI has been re-rendered away is a live mic
// nobody can see — the one state this must never be left in.
function go(screen, opts = {}) { clearTimers(); VOICE.cancel(); $('#toast').classList.remove('on'); if (!opts.replace) S.stack.push(S.screen); S.screen = screen; S.wobble = false; render(); }
function back() { clearTimers(); VOICE.cancel(); $('#toast').classList.remove('on'); const prev = S.stack.pop() || 'map'; S.screen = prev; S.wobble = false; render(); }
function render() { const app = $('#app'); app.innerHTML = VIEWS[S.screen](); app.querySelectorAll('[data-go]').forEach(b => b.onclick = () => go(b.dataset.go)); app.querySelectorAll('[data-back]').forEach(b => b.onclick = () => backWithGuard()); AFTER[S.screen] && AFTER[S.screen](); renderHelp(); window.renderRail && renderRail(); const v = $('#view'); if (v) v.scrollTop = 0; }
function backWithGuard() { if (S.screen === 'record' && S.recDirty) { confirmSheet('Save this entry?', 'You have unsaved changes to this record.', [{ label: 'Discard', cls: 'danger', fn: () => { S.rec = null; S.recDirty = false; back(); } }, { label: 'Keep editing', cls: 'ghost' }, { label: 'Save', fn: saveRecord }]); return; }
  if (S.screen === 'camera' && S.draft && (S.draft.photo || S.draft.memo)) { confirmSheet('Leave without saving?', 'The photo and memo for this entry will be discarded.', [{ label: 'Discard', cls: 'danger', fn: () => { S.draft = null; back(); } }, { label: 'Stay', cls: 'ghost' }]); return; }
  back(); }
function frame(title, sub, body, bottom, opts = {}) { return `<div class="sb"><span>${clock()}</span><span>●●● ᯤ ▮</span></div>
<div class="top">${opts.noback ? '' : `<div class="ib" data-back>‹</div>`}<div><div class="ttl">${title}</div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>${opts.right ? `<div class="sp"></div>${opts.right}` : ''}</div>
<div class="view" id="view">${body}</div>${bottom ? `<div class="bottom">${bottom}</div>` : ''}`; }

// ---------------- map ----------------
// The day plan runs on real data: addresses are geocoded, the legs between them
// are real drives on the road network, and "best route" tries every ordering of
// today's stops from HQ and keeps the fastest. See geo.js.
const setKey = ids => ids.slice().sort().join('|');
const ptOf = p => ({ lat: p.lat, lon: p.lon });
const relDay = iso => { const d = iso.slice(0, 10); return d === todayISO() ? 'today' : d === dateISO(-1) ? 'yesterday' : fmtDate(d); };
const dateISO = n => { const d = new Date(); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); };

// A geocoded address gets a stable id from its OSM key, so a lookup saved last
// week still points at the same property after a reload.
const keyHash = s => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h).toString(36); };
const samePlace = (a, b) => Math.abs(a.lat - b.lat) < 1e-4 && Math.abs(a.lon - b.lon) < 1e-4;
function registerAddress(r) {
  const hit = ADDRESSES.find(a => (r.osm && a.osm && a.osm === r.osm) || samePlace(a, r));
  if (hit) return hit.id;
  const a = placeXY({ id: 'g' + keyHash(r.osm || r.lat.toFixed(5) + ',' + r.lon.toFixed(5)), addr: r.addr, where: r.where || '',
    lat: r.lat, lon: r.lon, osm: r.osm || '', source: r.source || 'geocoded', approx: !!r.approx, owner: { name: 'Owner of record', email: '' } });
  ADDRESSES.push(a); return a.id;
}
// Past site lookups come back out of localStorage and into the typeahead.
function restoreLookups() {
  GEO.lookups.all().forEach(l => {
    if (!isFinite(l.lat) || !isFinite(l.lon) || ADDRESSES.some(a => a.id === l.id)) return;
    ADDRESSES.push(placeXY({ id: l.id, addr: l.addr, where: l.where || '', lat: l.lat, lon: l.lon, osm: l.osm || '',
      source: l.source || 'geocoded', owner: { name: 'Owner of record', email: '' } }));
  });
}
const atStreet = 'house number not in OpenStreetMap — pinned on the street';
const lookupSub = l => `${l.where ? l.where + ' · ' : ''}looked up ${l.count}× · last ${relDay(l.last)}${(addrOf(l.id) || {}).approx ? ' · street-level' : ''}`;
const localSub = a => S.stops.includes(a.id) ? 'already on today’s route'
  : (HISTORY[a.id] || []).length ? 'last inspected ' + fmtDate(HISTORY[a.id][0].date)
  : GEO.lookups.get(a.id) ? 'saved lookup · ' + (a.where || 'no inspections on file')
  : (a.where ? a.where + ' · never inspected' : 'never inspected');
const approxNote = id => (addrOf(id) || {}).approx ? ` · ${atStreet}` : '';

// ---- what OSRM says about the order on screen ----
let routeToken = 0, rowDragging = false;
async function syncRoute(force) {
  const ids = S.stops.slice();
  // Only a call that actually starts a request may claim the token. Taking it
  // on every call orphaned the reply to a request already in flight — any
  // re-render of the map while the route was being timed (re-adding a stop
  // already on the list, switching basemap) left it pending for good.
  if (!ids.length) { routeToken++; S.route = null; paintRoute(); return; }
  if (S.route && S.route.ids.join() === ids.join() && !force) { paintRoute(); return; }
  const tk = ++routeToken;
  S.route = { ids, pending: true, error: null, line: S.route && S.route.line, duration: 0, distance: 0, legs: [] };
  paintRoute();
  let next;
  try {
    const r = await GEO.road([CONFIG.station, ...ids.map(addrOf)].map(ptOf));
    next = { ids, pending: false, error: null, line: r.line, duration: r.duration, distance: r.distance, legs: r.legs };
  } catch (e) {
    next = { ids, pending: false, error: e.message, line: null, duration: 0, distance: 0, legs: [] };
  }
  if (tk !== routeToken) return;
  S.route = next; paintRoute();
}

function routeStat() {
  const r = S.route;
  if (!S.stops.length) return '';   // the HQ line above and the hint below already say it
  if (!r || r.pending) return `<span class="dim">Timing the drive on real roads…</span>`;
  if (r.error) return `<span class="warn">Road network unreachable</span> <span class="dim">${esc(r.error)}</span><button class="mini" id="retry">Retry</button>`;
  const head = `<b>${GEO.fmtTime(r.duration)}</b> driving · ${GEO.fmtDist(r.distance)} · from ${esc(CONFIG.station.name)}`;
  const b = S.best;
  if (!b) return head;
  if (b.order.join() !== S.stops.join()) return head + `<br><span class="dim">Fastest order found was ${GEO.fmtTime(b.cost)} — tap ✦ to put it back.</span>`;
  const saved = b.baseline - b.cost;
  const how = b.method === 'exhaustive' ? `Fastest of all ${GEO.fmtNum(b.total)} orders` : b.method === 'exact' ? `Fastest of all ${GEO.fmtNum(b.total)} orders (exact)` : `Best of ${GEO.fmtNum(b.tried)} orders tried`;
  return head + `<br><span class="good">${how}${saved > 45 ? ' · ' + GEO.fmtTime(saved) + ' faster than the order you typed' : ''}</span>`;
}
function planHTML() {
  if (!S.plan || !S.plan.length) return '';
  return `<div class="plan">${S.plan.map(l => `<div class="pl ${l.state}"><span>${l.state === 'go' ? '⟳' : l.state === 'bad' ? '✕' : '✓'}</span><div>${l.txt}</div></div>`).join('')}</div>`;
}

// ---- the map canvas: Leaflet over OSM tiles, with the stylised map as fallback ----
let LWRAP = null, LMAP = null, LART = null, LBASE = null, LCRED = null, LCREDTXT = '', lastFit = '';
function mountMap() {
  const host = $('#map'); if (!host) return;
  if (!window.L) { host.innerHTML = mapSVG() + '<div class="offline">Stylised map · tiles unavailable</div>'; wirePins(); return; }
  if (!LWRAP) {
    LWRAP = document.createElement('div'); LWRAP.className = 'lmap'; host.appendChild(LWRAP);
    LMAP = L.map(LWRAP, { zoomControl: false, attributionControl: false, zoomSnap: .25, inertia: false });
    // Two basemaps, both keyless. Esri World Imagery to see the vegetation on
    // the way in; standard OSM raster, inverted in CSS (.leaflet-tile-pane) to
    // sit under the dark UI, to read the street the route turns on.
    LBASE = {
      sat: L.tileLayer(SAT.TILES, { maxZoom: 19 }),
      map: L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19 }),
    };
    // Top-right: the sheet covers the bottom of the map, and the attribution
    // has to stay visible.
    LCRED = L.control.attribution({ prefix: false, position: 'topright' }).addTo(LMAP);
    setBasemap();
    LMAP.setView([CONFIG.station.lat, CONFIG.station.lon], 12.5);
    LART = L.layerGroup().addTo(LMAP);
    // The canvas has no size until invalidateSize() below, so the first frame is
    // placed once it has one.
    requestAnimationFrame(() => { if (LMAP && S.screen === 'map') fitMap(true); });
  } else if (LWRAP.parentElement !== host) host.appendChild(LWRAP);
  LMAP.invalidateSize();
  paintMap();
}
// The imagery is true colour, so the inversion that makes OSM dark has to come
// off with it, and the credit changes with the source.
function setBasemap() {
  if (!LBASE) return;
  const sat = S.basemap === 'sat';
  Object.keys(LBASE).forEach(k => { const on = (k === 'sat') === sat; if (on) LBASE[k].addTo(LMAP); else LMAP.removeLayer(LBASE[k]); });
  LWRAP.classList.toggle('imagery', sat);
  const txt = (sat ? SAT.creditShort : '© OpenStreetMap') + ' · roads and times via OSRM';
  if (LCREDTXT) LCRED.removeAttribution(LCREDTXT);
  LCRED.addAttribution(txt); LCREDTXT = txt;
}
function paintMap() {
  if (S.screen !== 'map') return;
  if (!LMAP) { const host = $('#map'); if (host) { host.innerHTML = mapSVG() + '<div class="offline">Stylised map · tiles unavailable</div>'; wirePins(); } return; }
  LART.clearLayers();
  const st = CONFIG.station, r = S.route;
  if (r && r.line) {                       // the actual roads, as driven
    L.polyline(r.line, { color: '#061019', weight: 9, opacity: .85, lineCap: 'round', lineJoin: 'round' }).addTo(LART);
    L.polyline(r.line, { color: '#35e0ff', weight: 4, opacity: .95, lineCap: 'round', lineJoin: 'round' }).addTo(LART);
  } else if (S.stops.length) {             // waiting on OSRM: straight hint lines
    L.polyline([[st.lat, st.lon], ...S.stops.map(id => { const a = addrOf(id); return [a.lat, a.lon]; })],
      { color: '#35e0ff', weight: 2, opacity: .4, dashArray: '5 7' }).addTo(LART);
  }
  const mk = (lat, lon, cls, txt, title) => L.marker([lat, lon], { icon: L.divIcon({ className: 'lpin ' + cls, html: `<i></i><b>${txt}</b>`, iconSize: [34, 34], iconAnchor: [17, 17] }), keyboard: false, title, riseOnHover: true }).addTo(LART);
  mk(st.lat, st.lon, 'station', 'HQ', st.name + ' · ' + st.addr);
  S.stops.forEach((id, i) => {
    const a = addrOf(id), done = S.done.has(id);
    const m = mk(a.lat, a.lon, (done ? 'done ' : '') + (S.sel === id ? 'sel' : ''), done ? '✓' : i + 1, a.addr);
    m.on('click', () => selectStop(id));
    const el = m.getElement(); if (el) el.setAttribute('data-pin', id);
  });
  fitMap();
}
// The map canvas is the whole phone, but most of the bottom of it is under the
// sheet and the top under the controls. Everything that frames or centres has
// to work in the strip that is actually visible, which is what these are.
function mapPad() {
  const sheet = $('#sheet');
  return { top: 110, bottom: (sheet ? sheet.offsetHeight : 320) + 20, left: 44, right: 44 };
}
// Put a coordinate in the middle of the visible strip rather than the middle of
// the container. Centring on the container put HQ behind the sheet: on screen it
// sat low and half-covered, which read as the map being off rather than as the
// sheet being over it.
function centreOn(lat, lon, zoom, animate) {
  const z = zoom == null ? LMAP.getZoom() : zoom, p = mapPad();
  // A point renders at (container centre + P - C). Wanting it at the centre of
  // the strip, which is (top - bottom) / 2 below the container centre, fixes C.
  const c = LMAP.project([lat, lon], z).subtract([(p.left - p.right) / 2, (p.top - p.bottom) / 2]);
  LMAP.setView(LMAP.unproject(c, z), z, { animate: !!animate });
}
function fitMap(force) {
  if (!LMAP) return;
  const pad = mapPad();
  const key = S.stops.join('|') + '#' + (S.route && S.route.line ? S.route.line.length : 0) + '#' + pad.bottom;
  if (key === lastFit && !force) return;
  lastFit = key;
  if (!S.stops.length) { centreOn(CONFIG.station.lat, CONFIG.station.lon, 13, true); return; }
  const pts = [[CONFIG.station.lat, CONFIG.station.lon], ...S.stops.map(id => { const a = addrOf(id); return [a.lat, a.lon]; })];
  LMAP.fitBounds(L.latLngBounds(S.route && S.route.line ? S.route.line.concat(pts) : pts),
    { paddingTopLeft: [pad.left, pad.top], paddingBottomRight: [pad.right, pad.bottom], maxZoom: 16, animate: true });
}
function paintRoute() {
  if (S.screen !== 'map') return;
  if (S.best && S.best.set !== setKey(S.stops)) S.best = null;
  const meta = $('#rmeta'), stat = $('#rstat'), rows = $('#rows');
  if (meta) meta.textContent = S.stops.length ? S.stops.length + ' stop' + (S.stops.length === 1 ? '' : 's') + ' · ' + S.done.size + ' done' : CONFIG.station.name + ' · ' + CONFIG.station.addr;
  if (stat) { stat.innerHTML = routeStat(); const rt = $('#retry'); if (rt) rt.onclick = () => syncRoute(true); }
  if (rows && !rowDragging) { rows.innerHTML = stopRows(); wireRows(); }
  paintMap();
}

// Fallback map, used only when Leaflet or the tiles cannot load. The route is
// the real road geometry, projected into the stylised 0–100 space.
function mapSVG() {
  const st = CONFIG.station;
  const proj = (lat, lon) => { const p = toMapXY(lat, lon); return p.x.toFixed(2) + ',' + p.y.toFixed(2); };
  const line = S.route && S.route.line ? S.route.line.map(p => proj(p[0], p[1])).join(' ')
    : [st, ...S.stops.map(addrOf)].map(a => a.x.toFixed(2) + ',' + a.y.toFixed(2)).join(' ');
  const streets = ['M-20 20 L130 14', 'M-20 48 L130 42', 'M-20 76 L130 70', 'M-20 -10 L130 -18', 'M-20 108 L130 100', 'M-20 136 L130 130', 'M18 -60 L24 180', 'M46 -60 L52 180', 'M74 -60 L80 180', 'M-10 -60 L-4 180', 'M102 -60 L108 180', 'M-20 60 Q 50 66 130 58'];
  return `<svg viewBox="-6 -40 112 186" preserveAspectRatio="xMidYMid slice"><rect x="-20" y="-60" width="160" height="240" fill="#0d1420"/>
  ${streets.map(d => `<path d="${d}" stroke="#161f2d" stroke-width="2.6" fill="none" stroke-linecap="round"/>`).join('')}
  ${S.stops.length ? `<polyline points="${line}" fill="none" stroke="var(--cyan)" stroke-width=".9" stroke-linejoin="round" stroke-linecap="round" opacity=".9"/>` : ''}
  <g class="station"><circle cx="${st.x}" cy="${st.y}" r="4" fill="rgba(255,182,72,.18)"/><circle cx="${st.x}" cy="${st.y}" r="2" fill="#ffb648"/><text x="${st.x}" y="${st.y + 6.5}" font-size="2.6" fill="#ffd79a" text-anchor="middle" font-family="-apple-system,sans-serif" font-weight="600">${esc(st.name)}</text></g>
  ${S.stops.map((id, i) => { const a = addrOf(id); const done = S.done.has(id); return `<g class="pin ${done ? 'done' : ''} ${S.sel === id ? 'sel' : ''}" data-pin="${id}" style="cursor:pointer"><circle class="halo" cx="${a.x}" cy="${a.y}" r="4.4"/><circle class="body" cx="${a.x}" cy="${a.y}" r="2.7" fill="${done ? '#1f6f49' : '#35e0ff'}" stroke="#0b0f17" stroke-width=".6"/><text x="${a.x}" y="${a.y + .95}" font-size="2.6" font-weight="700" fill="${done ? '#b9f5cf' : '#06101a'}" text-anchor="middle" font-family="-apple-system,sans-serif">${done ? '✓' : i + 1}</text></g>`; }).join('')}
  </svg>`;
}
function selectStop(id) { S.sel = id; if (S.sheet === 'peek') S.sheet = 'half'; render(); later(() => { const r = $('#sheet .srow.sel'); r && r.scrollIntoView({ block: 'center', behavior: 'smooth' }); }, 60); }
function wirePins() { $$('[data-pin]').forEach(p => p.onclick = () => selectStop(p.dataset.pin)); }

function stopRows() {
  if (!S.stops.length) return `<div class="hint">Type the addresses you are visiting today. They are geocoded, pinned, and timed as real drives from ${esc(CONFIG.station.name)}. California addresses only — this unit does not inspect out of state.</div>`;
  const r = S.route;
  const legs = (r && !r.pending && !r.error && r.ids.join() === S.stops.join()) ? r.legs : null;
  return S.stops.map((id, i) => {
    const a = addrOf(id), n = entriesOf(id).length, done = S.done.has(id);
    const from = i === 0 ? CONFIG.station.name : addrOf(S.stops[i - 1]).addr;
    const leg = legs && legs[i] ? `↳ ${GEO.fmtTime(legs[i].duration)} · ${GEO.fmtDist(legs[i].distance)} from ${esc(from)}` : '';
    const state = (done ? 'Completed · ' + n + ' entr' + (n === 1 ? 'y' : 'ies') : n ? n + ' entr' + (n === 1 ? 'y' : 'ies') + ' so far' : 'Not started') + approxNote(id);
    return `<div class="srow ${done ? 'done' : ''} ${S.sel === id ? 'sel' : ''}" data-id="${id}"><span class="grip">≡</span><span class="num">${done ? '✓' : i + 1}</span><div><div class="t">${esc(a.addr)}</div><div class="s">${state}</div>${leg ? `<div class="leg">${leg}</div>` : ''}</div><button class="x nav" data-nav title="Navigate in Apple Maps">➚</button><button class="x" data-x="${id}" title="Remove stop">✕</button></div>`;
  }).join('');
}
VIEWS = {
  map: () => `<div class="mapwrap" id="map"></div><div class="mtop"><div class="ib" id="menu">☰</div><div class="mtr"><div class="ib ${S.basemap === 'sat' ? 'on' : ''}" id="basemap" title="${S.basemap === 'sat' ? 'Showing satellite · switch to roads' : 'Showing roads · switch to satellite'}">◉</div><div class="ib" id="recenter" title="Fit the route">◎</div></div></div>
  <div class="sheet ${S.sheet}" id="sheet"><div class="handle" id="handle"><i></i></div><div class="sbody"><div class="addr"><input id="addr" placeholder="Add an address for today" autocomplete="off"><span class="ic">⌕</span><div class="sugg" id="sugg" style="display:none"></div></div>
  <div class="routebar"><span class="meta" id="rmeta">${S.stops.length ? S.stops.length + ' stop' + (S.stops.length === 1 ? '' : 's') + ' · ' + S.done.size + ' done' : CONFIG.station.name + ' · ' + CONFIG.station.addr}</span><button class="btn" id="best" style="width:auto;padding:12px 16px" ${S.stops.length < 2 || S.routing ? 'disabled' : ''}>${S.routing ? '✦ Finding…' : '✦ Best route'}</button></div>
  <div class="rstat" id="rstat">${routeStat()}</div><div id="plan">${planHTML()}</div>
  <div id="rows">${stopRows()}</div></div></div>`,
  days: () => { const q = S.days.q.toLowerCase(); const today = { label: 'Today', date: todayISO(), stops: S.stops }; const days = [today, ...DAYS].filter(d => d.stops.length);
    const match = (id, d) => { if (!q) return true; const a = addrOf(id); const hist = (HISTORY[id] || []).find(h => h.date === d.date); const txt = [a.addr, ...(hist ? hist.entries.map(e => e.note + ' ' + e.kind) : entriesOf(id).map(e => e.memo + ' ' + e.kind)), hist ? hist.outcome : ''].join(' ').toLowerCase(); return txt.includes(q); };
    const body = days.map(d => { const ids = d.stops.filter(id => match(id, d)); if (!ids.length) return ''; return `<div class="dsec" id="day-${d.date}">${esc(d.label)}${d.label === 'Today' ? '' : ''}</div>${ids.map(id => { const a = addrOf(id); const h = (HISTORY[id] || []).find(x => x.date === d.date); const n = d.label === 'Today' ? entriesOf(id).length : (h ? h.entries.length : 0); const outcome = d.label === 'Today' ? (S.done.has(id) ? 'Completed' : n ? 'In progress' : 'Not started') : (h ? h.outcome : '—'); return `<div class="loc" data-loc="${id}" data-date="${d.date}"><div class="thumb">${satThumb(id, d.label === 'Today' ? entriesOf(id) : (h ? h.entries : []))}</div><div><div class="t">${esc(a.addr)}</div><div class="s">${n} entr${n === 1 ? 'y' : 'ies'} · ${esc(outcome)}</div></div><div class="r">${d.label === 'Today' ? 'today' : esc(d.label.replace(', 2026', ''))}</div></div>`; }).join('')}`; }).join('') || `<div class="hint">Nothing matches “${esc(S.days.q)}”.</div>`;
    return frame('Previous inspections', '', `<div class="search"><input id="dq" placeholder="Search address, finding, outcome…" value="${esc(S.days.q)}"><div class="ib" id="calbtn" title="Pick a date">▦</div></div>${body}`, ''); },
  location: () => locationView(),
  camera: () => cameraView(),
  record: () => recordView(),
  deck: () => deckView(),
  report: () => reportView(),
  notice: () => noticeView(),
  kb: () => kbView(),
};
AFTER = {
  map() {
    mountMap();
    const inp = $('#addr'), sg = $('#sugg'); const near = [CONFIG.station.lat, CONFIG.station.lon];
    let hl = 0, items = [], remote = [], remoteFor = null, searching = false, debT = null, qTok = 0;

    const addStop = id => {
      const a = addrOf(id); GEO.lookups.record(a);
      inp.value = ''; sg.style.display = 'none';
      if (S.stops.includes(id)) { S.sel = id; render(); later(() => { const r = $('#sheet .srow.sel'); r && r.scrollIntoView({ block: 'center' }); }, 50); return; }
      S.stops.push(id); S.sel = null;
      if (S.sheet === 'peek') S.sheet = 'half';
      render(); $('#addr').focus();
    };
    const choose = it => { if (!it) return; addStop(it.kind === 'remote' ? registerAddress(it.r) : it.id); };

    const build = () => {
      const q = inp.value.trim(), lq = q.toLowerCase();
      if (!q) { items = GEO.lookups.all().slice(0, 6).filter(l => addrOf(l.id)).map(l => ({ kind: 'local', id: l.id, addr: l.addr, sub: lookupSub(l) })); return { head: items.length ? 'Recent site lookups' : '' }; }
      const local = ADDRESSES.filter(a => (a.addr + ' ' + (a.where || '')).toLowerCase().includes(lq)).map(a => ({ kind: 'local', id: a.id, addr: a.addr, sub: localSub(a) }));
      const rem = (remoteFor === lq ? remote : []).filter(r => !local.some(it => samePlace(addrOf(it.id), r)))
        .map(r => ({ kind: 'remote', r, addr: r.addr, sub: r.approx ? (r.where ? r.where + ' · ' : '') + atStreet : (r.where || 'OpenStreetMap') }));
      items = local.concat(rem);
      return { loading: q.length >= 3 && remoteFor !== lq };
    };
    const show = () => {
      const st = build();
      if (hl >= items.length) hl = Math.max(0, items.length - 1);
      const head = st.head ? `<div class="sgh">${esc(st.head)}</div>` : '';
      const extra = st.loading ? `<div class="searching">${searching ? 'Searching OpenStreetMap…' : 'Keep typing — addresses are looked up for real.'}</div>` : '';
      // Every candidate carries a coordinate, so each row can show the property
      // it would actually pin. The images are lazy and cached, so arrowing
      // through the list costs one small request per row at most.
      const where = it => it.kind === 'remote' ? it.r : addrOf(it.id);
      sg.innerHTML = head + items.map((it, i) => { const c = where(it);
        return `<div class="${i === hl ? 'hl' : ''}" data-i="${i}"><span class="sgt">${c ? satSpot(c.lat, c.lon) : ''}</span><span class="sgx">${esc(it.addr)}<small>${esc(it.sub)}</small></span></div>`; }).join('') + extra;
      sg.style.display = (items.length || extra) ? 'block' : 'none';
      sg.querySelectorAll('[data-i]').forEach(d => d.onpointerdown = e => { e.preventDefault(); choose(items[+d.dataset.i]); });
    };
    const lookup = () => {
      const q = inp.value.trim().toLowerCase(); clearTimeout(debT);
      if (q.length < 3 || q === remoteFor) { searching = false; return; }
      searching = true;
      debT = later(async () => {
        const tok = ++qTok; const res = await GEO.suggest(q, near);
        if (tok !== qTok || inp.value.trim().toLowerCase() !== q) return;
        remote = res; remoteFor = q; searching = false; show();
      }, 340);
    };
    const enter = async () => {
      if (items[hl]) return choose(items[hl]);
      const q = inp.value.trim(); if (q.length < 4) return;
      sg.innerHTML = `<div class="searching">Looking up “${esc(q)}”…</div>`; sg.style.display = 'block';
      const r = await GEO.geocode(q, near);
      if (inp.value.trim() !== q) return;
      if (!r) { sg.innerHTML = `<div class="searching">No California address found for “${esc(q)}”.</div>`; return; }
      choose({ kind: 'remote', r });
    };
    inp.oninput = () => { hl = 0; lookup(); show(); };
    // Focus alone must not open the panel. Adding a stop refocuses the field so
    // the next address can be typed straight away (addStop), and popping the
    // recent-lookup list on that refocus buries the route just added to — the
    // one thing the tap was meant to change. A half-typed query still restores
    // its matches on focus, and a deliberate tap still opens the list.
    inp.onfocus = () => { if (inp.value.trim()) show(); };
    inp.onpointerdown = () => show();
    inp.onkeydown = e => {
      if (e.key === 'ArrowDown') { hl = Math.min(hl + 1, items.length - 1); show(); }
      if (e.key === 'ArrowUp') { hl = Math.max(0, hl - 1); show(); }
      if (e.key === 'Enter') { e.preventDefault(); enter(); }
      if (e.key === 'Escape') sg.style.display = 'none';
    };
    inp.onblur = () => later(() => sg.style.display = 'none', 150);

    $('#menu').onclick = () => openMenu();
    $('#recenter').onclick = () => fitMap(true);
    $('#basemap').onclick = () => { S.basemap = S.basemap === 'sat' ? 'map' : 'sat'; setBasemap(); render(); };
    const rt = $('#retry'); if (rt) rt.onclick = () => syncRoute(true);
    // sheet detents
    const sheet = $('#sheet'), handle = $('#handle'); const order = ['peek', 'half', 'full']; let sy = 0, sh = 0, moved = false;
    handle.onclick = () => { if (moved) return; S.sheet = order[(order.indexOf(S.sheet) + 1) % 3]; sheet.className = 'sheet ' + S.sheet; later(() => fitMap(true), 480); };
    handle.onpointerdown = e => { sy = e.clientY; sh = sheet.offsetHeight; moved = false; handle.setPointerCapture(e.pointerId); sheet.classList.add('drag'); };
    handle.onpointermove = e => { if (!sheet.classList.contains('drag')) return; const dy = sy - e.clientY; if (Math.abs(dy) > 4) moved = true; sheet.style.height = Math.max(120, Math.min(sheet.parentElement.offsetHeight * .9, sh + dy)) + 'px'; };
    handle.onpointerup = handle.onpointercancel = e => { if (!sheet.classList.contains('drag')) return; sheet.classList.remove('drag'); const h = sheet.offsetHeight / sheet.parentElement.offsetHeight; S.sheet = h < .3 ? 'peek' : h < .68 ? 'half' : 'full'; sheet.style.height = ''; sheet.className = 'sheet ' + S.sheet; later(() => moved = false, 50); };
    wireRows(); $('#best').onclick = bestRoute;
    syncRoute();
  },
  days() { const q = $('#dq'); q.oninput = () => { S.days.q = q.value; const pos = q.selectionStart; render(); const q2 = $('#dq'); q2.focus(); q2.setSelectionRange(pos, pos); };
    $$('[data-loc]').forEach(c => c.onclick = () => { const id = c.dataset.loc, date = c.dataset.date; S.cur = id; if (date === todayISO()) { S.snapshot = null; S.tab = 'today'; } else { const h = (HISTORY[id] || []).find(x => x.date === date); S.snapshot = h ? { date: h.date, entries: h.entries, outcome: h.outcome } : null; S.tab = 'today'; } go('location'); });
    $('#calbtn').onclick = () => { const have = new Set([todayISO(), ...DAYS.map(d => d.date)]); const first = new Date(2026, 10, 1); const dow = first.getDay(); const cells = []; for (let i = 0; i < dow; i++) cells.push('<span></span>'); for (let d = 1; d <= 30; d++) { const iso = `2026-11-${String(d).padStart(2, '0')}`; cells.push(`<span class="${have.has(iso) ? 'has' : ''} ${iso === todayISO() ? 'today' : ''}" data-day="${iso}">${d}</span>`); }
      const el = document.createElement('div'); el.className = 'cal'; el.innerHTML = `<div class="calbox"><h5><span>November 2026</span><span style="color:var(--faint);font-weight:500">October ‹ ›</span></h5><div class="calgrid">${['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => `<span style="color:var(--faint)">${d}</span>`).join('')}${cells.join('')}</div><div style="font-size:12px;color:var(--faint);margin-top:10px">Highlighted days have inspections. October dates are listed below the November ones.</div></div>`; $('#app').appendChild(el); el.onclick = e => { if (e.target === el) el.remove(); }; el.querySelectorAll('.has').forEach(s => s.onclick = () => { el.remove(); const sec = $('#day-' + s.dataset.day); if (sec) sec.scrollIntoView({ block: 'start', behavior: 'smooth' }); else toast('That day is further down'); }); }; },
  location() { locationAfter(); }, camera() { cameraAfter(); }, record() { recordAfter(); }, deck() { deckAfter(); }, report() { reportAfter(); }, notice() { noticeAfter(); }, kb() { kbAfter(); },
};
function wireRows() { const rows = $('#rows'); if (!rows) return; const HOLD = 180;
  rows.querySelectorAll('.srow').forEach(row => { const id = row.dataset.id;
    let holdT = null, lifted = false, sx = 0, sy = 0, offY = 0, ghost = null, order = null, moved = false;
    const lift = e => { lifted = true; moved = true; rowDragging = true; const r = row.getBoundingClientRect(); offY = e.clientY - r.top; order = [...rows.querySelectorAll('.srow')]; row.classList.add('placeholder'); ghost = row.cloneNode(true); ghost.classList.add('ghost'); ghost.classList.remove('placeholder', 'open', 'sel'); ghost.style.width = r.width + 'px'; ghost.style.left = r.left + 'px'; ghost.style.top = r.top + 'px'; document.body.appendChild(ghost); requestAnimationFrame(() => ghost.classList.add('up')); if (navigator.vibrate) navigator.vibrate(10); document.addEventListener('pointermove', move); document.addEventListener('pointerup', drop); document.addEventListener('pointercancel', drop); };
    const move = e => { if (!lifted) return; const y = e.clientY - offY; ghost.style.top = y + 'px'; const mid = e.clientY; const others = order.filter(r => r !== row); for (const o of others) { const r = o.getBoundingClientRect(); if (mid < r.top + r.height / 2 && o.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_FOLLOWING) { flip(() => rows.insertBefore(row, o)); break; } if (mid > r.top + r.height / 2 && o.compareDocumentPosition(row) & Node.DOCUMENT_POSITION_PRECEDING) { flip(() => rows.insertBefore(row, o.nextSibling)); break; } } };
    const flip = fn => { const all = [...rows.querySelectorAll('.srow')]; const first = new Map(all.map(r => [r, r.getBoundingClientRect().top])); fn(); all.forEach(r => { if (r === row) return; const d = first.get(r) - r.getBoundingClientRect().top; if (!d) return; r.style.transition = 'none'; r.style.transform = 'translateY(' + d + 'px)'; requestAnimationFrame(() => { r.style.transition = 'transform .22s cubic-bezier(.2,.8,.2,1)'; r.style.transform = ''; }); }); };
    const drop = () => { if (!lifted) return; lifted = false; document.removeEventListener('pointermove', move); document.removeEventListener('pointerup', drop); document.removeEventListener('pointercancel', drop); const r = row.getBoundingClientRect(); ghost.style.transition = 'top .18s cubic-bezier(.2,.8,.2,1),left .18s,transform .18s,box-shadow .18s'; ghost.style.top = r.top + 'px'; ghost.classList.remove('up'); setTimeout(() => { ghost.remove(); row.classList.remove('placeholder'); const next = [...rows.querySelectorAll('.srow')].map(x => x.dataset.id); S.stops = next; rowDragging = false; render(); }, 190); };
    row.onpointerdown = e => { if (e.target.closest('.x')) return; sx = e.clientX; sy = e.clientY; moved = false; if (e.target.closest('.grip')) { e.preventDefault(); lift(e); return; } holdT = setTimeout(() => lift(e), HOLD); };
    row.onpointermove = e => { if (lifted) return; if (Math.abs(e.clientY - sy) > 6 || Math.abs(e.clientX - sx) > 6) { clearTimeout(holdT); } };
    row.onpointerup = row.onpointercancel = () => { clearTimeout(holdT); };
    row.onclick = e => { if (moved || e.target.closest('.x')) return; S.cur = id; S.snapshot = null; S.tab = 'today'; go('location'); };
    row.querySelector('.x[data-x]').onclick = e => { e.stopPropagation(); const n = entriesOf(id).length; const rm = () => { S.stops = S.stops.filter(x => x !== id); S.done.delete(id); if (S.sel === id) S.sel = null; render(); }; if (n) confirmSheet('Remove this stop?', `${addrOf(id).addr} has ${n} entr${n === 1 ? 'y' : 'ies'} today. They stay on file; the stop just leaves today’s route.`, [{ label: 'Remove', cls: 'danger', fn: rm }, { label: 'Keep', cls: 'ghost' }]); else rm(); };
    const nav = row.querySelector('[data-nav]'); if (nav) nav.onclick = e => { e.stopPropagation(); const a = addrOf(id); const dest = encodeURIComponent(a.addr + (a.where ? ', ' + a.where : '')); const url = `https://maps.apple.com/?saddr=${CONFIG.station.lat},${CONFIG.station.lon}&daddr=${a.lat},${a.lon}&q=${dest}&dirflg=d`;
      confirmSheet('Navigate with Apple Maps?', a.addr + ' · turn-by-turn opens in Maps; this app stays here.', [{ label: 'Open Maps', fn: () => window.open(url, '_blank', 'noopener') }, { label: 'Cancel', cls: 'ghost' }]); }; }); }

// Try every ordering of today's stops on the real road network and keep the
// fastest one. The panel reports the real stages and the live count.
async function bestRoute() {
  if (S.routing || S.stops.length < 2) return;
  const ids = S.stops.slice(), n = ids.length;
  S.routing = true; S.plan = []; render();
  const lines = [];
  const draw = () => { S.plan = lines.map(l => ({ txt: l.txt, state: l.state })); const p = $('#plan'); if (p) p.innerHTML = planHTML(); };
  const step = txt => { lines.push({ txt, state: 'go' }); draw(); return lines.length - 1; };
  const settle = (i, txt, state) => { lines[i] = { txt, state }; draw(); };
  const stop = () => { S.routing = false; render(); };
  let at = -1;
  // What the order on screen actually costs to drive, if we already know it.
  const wasReal = (S.route && !S.route.pending && !S.route.error && S.route.ids.join() === ids.join()) ? S.route.duration : null;
  try {
    const pts = [CONFIG.station, ...ids.map(addrOf)].map(ptOf);
    at = step(`Timing every pair of ${n + 1} points on the road network…`);
    const t = await GEO.table(pts);
    settle(at, `${GEO.fmtNum(t.pairs)} road legs timed · OSRM car profile`, 'ok');

    const baseline = GEO.costOf(t.durations, ids.map((_, k) => k + 1));
    const total = GEO.factorial(n);
    const label = tried => `Driving all ${GEO.fmtNum(total)} orders from ${esc(CONFIG.station.name)}… <b>${GEO.fmtNum(tried)}</b>`;
    at = step(label(0));
    const res = await GEO.fastestOrder(t.durations, n, tried => settle(at, label(tried), 'go'));
    settle(at, res.method === 'exhaustive' ? `All ${GEO.fmtNum(res.tried)} orders driven and timed`
      : res.method === 'exact' ? `All ${GEO.fmtNum(res.total)} orders ranked — too many to list one by one, so solved exactly over subsets`
      : `${GEO.fmtNum(res.tried)} orders tried — more stops than an exact answer allows`, 'ok');

    const order = res.order.map(k => ids[k - 1]);
    at = step('Fetching the winning road route…');
    const r = await GEO.road([CONFIG.station, ...order.map(addrOf)].map(ptOf));
    // Compare like with like: both numbers are driven routes, not matrix cells.
    // (The matrix is what the search ranks on; it rounds turn costs differently.)
    const saved = wasReal == null ? baseline - res.cost : wasReal - r.duration;
    settle(at, `${GEO.fmtTime(r.duration)} · ${GEO.fmtDist(r.distance)}${saved > 45 ? ' · saves ' + GEO.fmtTime(saved) + ' on the order you typed' : ' · the order you typed was already fastest'}`, 'ok');

    S.stops = order; S.sel = null;
    S.best = { set: setKey(order), order: order.slice(), cost: r.duration, baseline: wasReal == null ? baseline : wasReal, tried: res.tried, total: res.total, method: res.method };
    S.route = { ids: order.slice(), pending: false, error: null, line: r.line, duration: r.duration, distance: r.distance, legs: r.legs };
    S.routing = false; render();
    setTimeout(() => { S.plan = null; if (S.screen === 'map') render(); }, 4200);
  } catch (e) {
    if (at >= 0) settle(at, 'Could not reach the road network · ' + esc(e.message), 'bad');
    else { lines.push({ txt: 'Could not reach the road network · ' + esc(e.message), state: 'bad' }); draw(); }
    stop();
    setTimeout(() => { S.plan = null; if (S.screen === 'map') render(); }, 6000);
  }
}

function openMenu() { const nLook = GEO.lookups.count(); const el = document.createElement('div'); el.className = 'drawer'; el.innerHTML = `<div class="scrim"></div><div class="pane"><div class="hero" style="margin-bottom:14px">${esc(CONFIG.inspector.name)}<small>${esc(CONFIG.inspector.badge)} · ${esc(CONFIG.unit)}</small></div>
  <div class="mi" data-m="days"><span class="ic">▤</span><div>Previous inspections<small>by day, date or search</small></div></div><div class="mi" data-m="looks"><span class="ic">⌕</span><div>Saved site lookups<small>${nLook ? nLook + ' address' + (nLook === 1 ? '' : 'es') + ' kept on this device' : 'none yet'}</small></div></div><div class="mi" data-m="profile"><span class="ic">◉</span><div>Profile<small>${esc(CONFIG.inspector.email)}</small></div></div><div class="mi" data-m="settings"><span class="ic">⚙</span><div>Settings<small>${esc(CONFIG.localCode)} · ${CONFIG.correctionDays}-day window</small></div></div></div>`;
  $('#app').appendChild(el); el.querySelector('.scrim').onclick = () => el.remove(); el.querySelectorAll('[data-m]').forEach(m => m.onclick = () => { el.remove(); const k = m.dataset.m; if (k === 'days') go('days'); else if (k === 'looks') lookupsSheet(); else if (k === 'profile') confirmSheet(CONFIG.inspector.name, `${CONFIG.inspector.badge} · ${CONFIG.unit}\n${CONFIG.inspector.email} · ${CONFIG.inspector.phone}`, [{ label: 'Close', cls: 'ghost' }]); else confirmSheet('Settings', `Jurisdiction: ${CONFIG.localCode}. Correction window: ${CONFIG.correctionDays} days. Appeal window: ${CONFIG.appealDays} days. Notices post to ${CONFIG.portal}. Routes start at ${CONFIG.station.name}, ${CONFIG.station.addr}. (Read-only in the demo.)`, [{ label: 'Close', cls: 'ghost' }]); }); }

// Every address that has ever been added to a day, kept on the device.
function lookupsSheet() {
  const all = GEO.lookups.all();
  const el = document.createElement('div'); el.className = 'cal'; el.id = 'lookbox';
  el.innerHTML = `<div class="calbox"><h5><span>Saved site lookups</span><span style="color:var(--faint);font-weight:500">${all.length || 'none'}</span></h5>
    <div class="looks">${all.length ? all.map(l => `<div class="look" data-look="${esc(l.id)}"><div><div class="t">${esc(l.addr)}</div><div class="s">${esc(lookupSub(l))}</div></div><button class="x" data-drop="${esc(l.id)}" title="Forget this address">✕</button></div>`).join('') : '<div class="hint">Nothing saved yet. Every address you add to a day is kept here and comes back in the search field.</div>'}</div>
    ${all.length ? `<button class="btn ghost" id="clrLook" style="margin-top:12px">Forget all ${all.length}</button>` : ''}</div>`;
  $('#app').appendChild(el);
  el.onclick = e => { if (e.target === el) el.remove(); };
  el.querySelectorAll('[data-look]').forEach(row => row.onclick = e => {
    if (e.target.closest('[data-drop]')) return;
    const id = row.dataset.look; el.remove();
    if (S.screen !== 'map') go('map', { replace: true });
    if (!S.stops.includes(id)) { S.stops.push(id); GEO.lookups.record(addrOf(id)); }
    S.sel = id; if (S.sheet === 'peek') S.sheet = 'half'; render();
  });
  el.querySelectorAll('[data-drop]').forEach(b => b.onclick = e => { e.stopPropagation(); GEO.lookups.forget(b.dataset.drop); el.remove(); lookupsSheet(); });
  const clr = el.querySelector('#clrLook');
  if (clr) clr.onclick = () => confirmSheet('Forget every saved lookup?', `${all.length} address${all.length === 1 ? '' : 'es'} will be removed from this device. Today’s stops stay where they are.`,
    [{ label: 'Forget all', cls: 'danger', fn: () => { GEO.lookups.clear(); el.remove(); render(); } }, { label: 'Keep', cls: 'ghost' }]);
}

// ---------------- location ----------------
// The parcel view is real satellite imagery of the address, framed on its own
// coordinate by sat.js, with everything else drawn over it. The overlay lives
// in a 0–100 space cropped exactly as the image is, and the defensible-space
// rings are sized from the real metres-per-pixel of that frame, so they are
// true to scale rather than decorative.
//
// Entry pips still sit at the demo coordinate carried on the entry (e.geo).
// When the real GPS fix lands (TODO.md §3) they become a v.xy(lat, lon) call
// and nothing else here changes.
const toneOf = k => k === 'violation' ? 'var(--red)' : k === 'compliance' ? 'var(--green)' : 'var(--amber)';
// A pip's e.geo, and the simulated standing position in POS, are 0–100
// coordinates in a notional parcel box this many metres across. Projecting
// them through the view anchors them to the ground, so they stay on the same
// patch of it as the inspector zooms instead of staying put on the glass.
//
// The box is deliberately small. At 60 m across, a pip 15 units off centre
// landed 9 m away and the spread of them covered a frontage and a half — on a
// suburban lot that is the neighbour's yard, and a citation that appears to
// have been written on the wrong property is worse than one with no pip at
// all. At 24 m the whole scatter, standing positions included, stays inside
// the lot being inspected and within a few paces of "you are here", which is
// what a walk round a house actually looks like.
const PARCEL_M = 24;
const geoXY = (v, at, g) => ({ x: at.x + v.pct((g[0] - 50) / 100 * PARCEL_M), y: at.y + v.pct((g[1] - 50) / 100 * PARCEL_M) });
// The same offset as a coordinate, for the record footer. Still invented — see
// TODO.md §3 — but invented about the property being inspected rather than a
// fixed pair of degrees, and labelled as simulated so no document passes it
// off as a fix. Real GPS replaces the whole function.
function simFix(id, g) {
  const a = addrOf(id); if (!a) return 'position unavailable';
  const lat = a.lat + ((50 - g[1]) / 100 * PARCEL_M) / 111320;
  const lon = a.lon + ((g[0] - 50) / 100 * PARCEL_M) / (111320 * Math.cos(a.lat * Math.PI / 180));
  return `${Math.abs(lat).toFixed(5)}° ${lat < 0 ? 'S' : 'N'}, ${Math.abs(lon).toFixed(5)}° ${lon < 0 ? 'W' : 'E'} · simulated`;
}
// ---- where the frame sits over the property ----------------------------
// The geocoded point is a pin on the street, and the house, the woodpile and
// the slope behind it are not always in the box drawn around it. So the lot
// view can be dragged off that point, and where the inspector leaves it is
// where that property's view stays — per address, on this device, so opening
// it again next season opens on the ground they chose to look at.
//
// Kept as an offset in metres east and north of the address rather than as a
// centre coordinate, so one drag holds across the parcel, zone and block
// views instead of being re-made at each span. Thumbnails stay on the address
// itself: a list of properties is read by comparing them, and each one framed
// differently is harder to read, not easier.
const LS_PAN = 'fi3.satpan.v1';
const PAN_MAX = 250;   // metres; far enough to frame a deep lot, not another street
let PAN = (() => { try { return JSON.parse(localStorage.getItem(LS_PAN)) || {}; } catch (e) { return {}; } })();
const savePan = () => { try { localStorage.setItem(LS_PAN, JSON.stringify(PAN)); } catch (e) { /* private mode, or quota */ } };
const panOf = id => PAN[id] || null;
function setPan(id, e, n) {
  const cl = v => Math.max(-PAN_MAX, Math.min(PAN_MAX, v));
  const ce = cl(e), cn = cl(n);
  // Dragged back to within half a metre of the pin is a reset, not an offset.
  if (Math.abs(ce) < 0.5 && Math.abs(cn) < 0.5) delete PAN[id];
  else PAN[id] = { e: +ce.toFixed(1), n: +cn.toFixed(1) };
  savePan();
}
// The coordinate the lot view centres on: the address, plus whatever offset was
// saved for it.
function satCentre(id) {
  const a = addrOf(id); if (!a) return null;
  const p = panOf(id); if (!p) return { lat: a.lat, lon: a.lon };
  return { lat: a.lat + p.n / 111320, lon: a.lon + p.e / (111320 * Math.cos(a.lat * Math.PI / 180)) };
}
function pipSVG(entries, mini, v, at) {
  return (entries || []).map(e => { const c = toneOf(e.kind), r = mini ? 3.2 : 3.6, p = geoXY(v, at, e.geo), x = p.x.toFixed(2), y = p.y.toFixed(2);
    return `<g class="pip" data-pip="${e.id || e.n}"><circle cx="${x}" cy="${y}" r="${r + 2.2}" fill="${c}" opacity=".18"/><circle cx="${x}" cy="${y}" r="${r}" fill="#0b0f17" stroke="${c}" stroke-width=".8"/><text x="${x}" y="${(p.y + 1.2).toFixed(2)}" font-size="${mini ? 3.6 : 3.8}" font-weight="700" fill="${c}" text-anchor="middle" font-family="-apple-system,sans-serif">${e.n}</text></g>`; }).join('');
}
// What sits on top of the imagery: the point we geocoded and routed to, where
// the inspector is standing, and a pip per entry. The three defensible-space
// zones belong to the 100 ft zone view alone — over the parcel they cover the
// ground the inspector is actually reading, so that view stays plain imagery.
function satOverlay(id, entries, mini) {
  // The frame is centred on the saved view; the address, the pips and the rings
  // are placed by projecting their real coordinates into it, so a dragged frame
  // moves the imagery and the marks together.
  const a = addrOf(id), c = satCentre(id);
  const v = SAT.view(c.lat, c.lon, SAT.spanOf(S.satZoom), 640), at = v.xy(a.lat, a.lon);
  const you = geoXY(v, at, POS[S.posIdx % POS.length]);
  const marks = mini ? '' : (S.satZoom === 'zone' ? SAT.zones(v, at) : '')
    + `<g class="target"><circle cx="${at.x.toFixed(2)}" cy="${at.y.toFixed(2)}" r="1.6"/><path d="M${at.x.toFixed(2)} ${(at.y - 3.4).toFixed(2)}v1.2M${at.x.toFixed(2)} ${(at.y + 2.2).toFixed(2)}v1.2M${(at.x - 3.4).toFixed(2)} ${at.y.toFixed(2)}h1.2M${(at.x + 2.2).toFixed(2)} ${at.y.toFixed(2)}h1.2"/></g>`
    + `<circle class="you" cx="${you.x.toFixed(2)}" cy="${you.y.toFixed(2)}" r="6" fill="rgba(53,224,255,.12)" stroke="rgba(53,224,255,.6)" stroke-width=".5"/><circle cx="${you.x.toFixed(2)}" cy="${you.y.toFixed(2)}" r="1.8" fill="#35e0ff"/>`;
  return `<svg class="satover" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${marks}${pipSVG(entries, mini, v, at)}</svg>`;
}
// Shown only when every imagery provider has failed: the stylised parcel the
// app drew before it had photographs to draw on.
function sketchSVG(id, mini) { const a = addrOf(id); const seed = a.x * 7 + a.y * 3; const trees = Array.from({ length: 9 }, (_, i) => [((seed * (i + 3)) % 80) + 8, ((seed * (i + 7)) % 60) + 12, 4 + (i % 3) * 2]);
  const u = mini ? 'm' : '';
  return `<svg class="satsketch" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice"><defs><pattern id="gr${u}" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M10 0H0V10" fill="none" stroke="rgba(255,255,255,.05)" stroke-width=".3"/></pattern><radialGradient id="sh${u}"><stop offset="0" stop-color="#1b2a20"/><stop offset="1" stop-color="#0d1614"/></radialGradient></defs>
  <rect width="100" height="100" fill="url(#sh${u})"/><rect width="100" height="100" fill="url(#gr${u})"/>
  ${trees.map(t => `<circle cx="${t[0]}" cy="${t[1]}" r="${t[2]}" fill="#1f3a2a" opacity=".85"/><circle cx="${t[0] - 1}" cy="${t[1] - 1}" r="${t[2] * .55}" fill="#27503a" opacity=".6"/>`).join('')}
  <rect x="0" y="84" width="100" height="16" fill="#151a22"/><path d="M0 92 L100 92" stroke="rgba(255,255,255,.18)" stroke-width=".4" stroke-dasharray="3 2"/>
  <rect x="38" y="24" width="30" height="26" rx="1.5" fill="#1a1f29" stroke="rgba(53,224,255,.6)" stroke-width=".5"/><rect x="54" y="52" width="14" height="30" fill="#1c222c" stroke="rgba(255,255,255,.12)" stroke-width=".3"/>
  <rect x="12" y="56" width="34" height="6" rx="3" fill="#24422f" opacity=".9"/><rect x="12" y="62" width="34" height="3" rx="1.5" fill="#2c5238" opacity=".8"/>
  ${mini ? '' : `<text x="50" y="97" font-size="3" fill="rgba(189,243,255,.55)" text-anchor="middle" font-family="-apple-system,sans-serif">Imagery unavailable · stylised parcel</text>`}</svg>`; }
// A property thumbnail: imagery of the address, the sketch behind it, pips over it.
function satThumb(id, entries) { const a = addrOf(id), span = 130, v = SAT.view(a.lat, a.lon, span, 200);
  return SAT.tile(a.lat, a.lon, { span, px: 200, dead: sketchSVG(id, true) })
    + `<svg class="satover" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">${pipSVG(entries, true, v, v.xy(a.lat, a.lon))}</svg>`; }
// The same, for a coordinate with no address record yet — a typeahead hit.
const satSpot = (lat, lon) => SAT.tile(lat, lon, { span: 130, px: 200 });
function kindChip(k) { return k === 'violation' ? '<span class="chip red">Violation</span>' : k === 'compliance' ? '<span class="chip green">Compliant</span>' : '<span class="chip amber">Note</span>'; }
function locationView() { const id = S.cur, a = addrOf(id); const snap = S.snapshot; const entries = snap ? snap.entries.map((e, i) => ({ ...e, id: 'h' + i })) : entriesOf(id); const done = S.done.has(id); const hist = HISTORY[id] || [];
  // Keyed on the document existing, not on the state object: visiting the
  // notice screen creates the state before anything has been drafted into it.
  const dst = key => { const st = S[key][id]; return st && st.doc ? st : null; };
  const changed = key => { const st = dst(key); if (!st) return S[key][id] && S[key][id].status === 'pending' ? '<span class="badge">drafting…</span>' : '';
    return st.ver !== (S.ver[id] || 0) ? '<span class="badge">changes since generated</span>' : '<span class="badge" style="color:#b9f5cf;border-color:rgba(74,222,128,.45);background:rgba(74,222,128,.1)">up to date</span>'; };
  const today = (S.tab === 'today' || snap) ? (entries.length ? `<div id="elist" class="${S.wobble ? 'wobble' : ''}">${entries.map(e => `<div class="entry" data-e="${e.id}"><div class="th">${e.photo ? img(e.photo, 'photo') : 'Note'}<span class="n">${e.n}</span></div><div><div class="t">${kindChip(e.kind)} <span style="color:var(--faint);font-size:12px;font-weight:500">${esc(e.time)}</span></div><div class="s">${esc(e.ai ? e.ai.summary[0][1] : e.note)}</div></div>${snap ? '' : `<button class="x" data-del="${e.id}">✕</button>`}</div>`).join('')}</div>` : `<div class="hint" style="padding:34px 20px">${snap ? 'No entries were recorded that day.' : 'Nothing recorded here yet today.<br>Start with a photo and a note.'}</div>`)
    + (snap || !done ? '' : `<div id="docs"><div class="lbl" style="margin-top:18px">Documents</div><div class="docbtn" data-go="report"><span class="ic">▤</span><div><div class="t">Internal report</div><div class="s">Technical compilation of all entries</div></div>${changed('report')}</div><div class="docbtn" data-go="notice"><span class="ic">✉</span><div><div class="t">Notice to owner</div><div class="s">Plain-language email with approved fixes</div></div>${changed('notice')}</div></div>`)
    : (hist.length ? hist.map(h => `<div class="loc" data-hist="${h.date}"><div class="thumb">${satThumb(id, h.entries)}</div><div><div class="t">${fmtDate(h.date)}</div><div class="s">${h.entries.length} entr${h.entries.length === 1 ? 'y' : 'ies'} · ${esc(h.outcome)}</div></div><div class="r">›</div></div>`).join('') : '<div class="hint">No previous inspections on file for this address.</div>');
  // The hero is wider than it is tall (376 × 300 in the frame), so the slice-
  // cropped overlay shows the full width of the view and the scale bar below
  // can be a straight percentage of it.
  const span = SAT.spanOf(S.satZoom), bar = SAT.scaleBar(span), ctr = satCentre(id);
  const body = `<div class="sat" id="sathero">${SAT.tile(ctr.lat, ctr.lon, { span, px: 640, eager: true, dead: sketchSVG(id, false) })}${satOverlay(id, entries, false)}
  <div class="ban ${snap ? 'snap' : ''}">${snap ? 'Viewing ' + fmtDate(snap.date) + ' · read-only' : 'Live · you are here'}</div>
  <div class="satz">${SAT.ZOOMS.map(z => `<button class="${z.id === S.satZoom ? 'on' : ''}" data-sz="${z.id}">${esc(z.label)}</button>`).join('')}</div>
  ${panOf(id) ? `<button class="satpan" id="satreset" title="Put the frame back on the geocoded point">⌖ Recentre</button>` : ''}
  <div class="satn">N</div>
  <div class="satfoot"><span class="sbar" style="width:${bar.pct.toFixed(2)}%">${esc(bar.label)}</span><span class="scred" data-cred>${esc(SAT.credit)}</span></div></div>
  ${snap ? '' : `<div class="tabs"><button class="${S.tab === 'today' ? 'on' : ''}" data-tab="today">Today${entries.length ? ' · ' + entries.length : ''}</button><button class="${S.tab === 'history' ? 'on' : ''}" data-tab="history">History${hist.length ? ' · ' + hist.length : ''}</button></div>`}
  ${snap ? `<div class="hero" style="margin-top:12px">${fmtDate(snap.date)}<small>${esc(snap.outcome)} · as recorded at the end of that inspection</small></div>` : ''}${today}`;
  const bottom = snap ? `<button class="btn ghost" id="exitSnap">Back to today</button>` : S.tab === 'today' ? (done ? `<div class="row2"><button class="btn ghost" id="finish">Reopen</button><button class="btn" id="toMap">Next stop →</button></div>` : `<div class="row2"><button class="btn ghost" id="finish">Finish</button><button class="btn" id="newEntry">+ New entry</button></div>`) : '';
  return frame(a.addr, snap ? 'history' : done ? 'Completed · documents ready' : 'inspection in progress', body, bottom); }
// Dragging the lot view. The imagery and the overlay are translated together
// under the finger for the whole gesture — a new frame is a round trip to Esri
// and cannot be re-requested per pointermove — and on release the drag is
// converted to ground metres, saved, and the real frame re-requested around the
// new centre.
//
// A gesture that never moved more than a few pixels is a tap, so the pips
// underneath keep working; one that did ends in a re-render, which takes the
// pip out from under the click before it can fire.
function wireLotPan(id) {
  const hero = $('#sathero'); if (!hero) return;
  const reset = $('#satreset');
  if (reset) reset.onclick = () => { delete PAN[id]; savePan(); render(); };
  const shift = [...hero.querySelectorAll('.satimg, .satover')];
  let px = 0, py = 0, dx = 0, dy = 0, down = false, moved = false;
  // The frame is an <img>, and the browser's own image drag fires
  // pointercancel the moment it starts - which ended the gesture after about
  // six pixels and saved that as the new centre. draggable="false" on the tile
  // and this between them leave the pointer to us.
  hero.ondragstart = e => { e.preventDefault(); return false; };
  hero.onpointerdown = e => {
    if (e.target.closest('.satz, .satpan, .satfoot, .ban')) return;
    down = true; moved = false; dx = dy = 0; px = e.clientX; py = e.clientY;
  };
  hero.onpointermove = e => {
    if (!down) return;
    dx = e.clientX - px; dy = e.clientY - py;
    if (!moved && Math.abs(dx) + Math.abs(dy) > 4) {
      moved = true; hero.classList.add('panning');
      // Captured only now. Capturing on every pointerdown would retarget the
      // click a tap on a pip turns into, and the pips are how an entry is
      // found from the picture.
      try { hero.setPointerCapture(e.pointerId); } catch (err) { /* already gone */ }
    }
    if (moved) shift.forEach(el => el.style.transform = `translate(${dx}px,${dy}px)`);
  };
  // A cancel is the system taking the pointer away - a palm, a back-swipe, a
  // dialog. It is not a decision about where the frame should sit, so the frame
  // goes back where it was.
  hero.onpointercancel = () => {
    if (!down) return;
    down = false; moved = false; hero.classList.remove('panning');
    shift.forEach(el => el.style.transform = '');
  };
  hero.onpointerup = () => {
    if (!down) return;
    down = false; hero.classList.remove('panning');
    if (!moved) return;
    // The frame is a square of `span` metres shown with object-fit:cover, so it
    // is scaled to the longer edge of the box — that is what one pixel of drag
    // is worth on the ground.
    const m = SAT.spanOf(S.satZoom) / Math.max(hero.clientWidth, hero.clientHeight);
    const p = panOf(id) || { e: 0, n: 0 };
    // Pulling the image right brings ground in from the west, so the centre of
    // the frame goes west; pulling it down brings ground in from the north.
    setPan(id, p.e - dx * m, p.n + dy * m);
    // The dragged frame is held on screen until the frame for the new centre is
    // in the cache, so letting go does not drop the view back to the skeleton
    // for a round trip. Capped, because a provider that never answers must not
    // leave the gesture hanging — the skeleton is the honest state by then.
    const c = satCentre(id), draw = () => { if (S.screen === 'location' && S.cur === id) render(); };
    let drawn = false;
    const once = () => { if (drawn) return; drawn = true; draw(); };
    later(once, 1600);
    SAT.prefetch(c.lat, c.lon, { span: SAT.spanOf(S.satZoom), px: 640 }).then(once, once);
  };
}

function wrapUp(id) { const a = addrOf(id); const es = entriesOf(id); const v = es.filter(e => e.kind === 'violation').length;
  const el = document.createElement('div'); el.className = 'wrap'; el.innerHTML = `<div class="wbox"><div class="wcheck">✓</div><div class="wt">Inspection complete</div><div class="ws">${esc(a.addr)} · ${es.length} entr${es.length === 1 ? 'y' : 'ies'} · ${v} violation${v === 1 ? '' : 's'}</div>
  <div class="wdocs"><div class="wdoc" id="wd1"><span class="dot spin"></span><div><b>Internal report</b><small>drafting from every entry against the code library…</small></div></div><div class="wdoc" id="wd2"><span class="dot spin"></span><div><b>Notice to owner</b><small>drafting the plain-language email…</small></div></div></div>
  <button class="btn" id="wgo" disabled>Drafting…</button></div>`; $('#app').appendChild(el);
  // Both are real model calls, so this card reports what actually happened —
  // including a failure, which must not read as a finished document.
  const settle = (sel, st, okText) => { const d = el.querySelector(sel); if (!d) return; const dot = d.querySelector('.dot'); dot.classList.remove('spin');
    const bad = st.status !== 'ok'; dot.textContent = bad ? '!' : '✓'; dot.style.color = bad ? 'var(--amber)' : 'var(--green)';
    d.querySelector('small').textContent = bad ? 'could not be drafted · showing template text' : okText; };
  let left = 2; const tickDown = () => { if (--left) return; const b = el.querySelector('#wgo'); if (b) { b.disabled = false; b.textContent = 'See the documents'; } };
  // Each entry queued its own pictures as it was drafted, so most have landed
  // by now and the rest are in flight. This is only a sweep for anything that
  // never made it into the queue; it is not what starts them.
  const q = VISUALS.start(id); if (q) console.log(`drawing ${q} recommendation visual${q === 1 ? '' : 's'} not yet queued`);
  genDoc('report', id, { silent: true }).then(st => { settle('#wd1', st, es.length + ' entr' + (es.length === 1 ? 'y' : 'ies') + ' compiled · ' + st.doc.sections.length + ' sections'); tickDown(); });
  genDoc('notice', id, { silent: true }).then(st => { settle('#wd2', st, v ? v + ' violation' + (v === 1 ? '' : 's') + ' explained · options and attachments to confirm' : 'no action needed for the owner'); tickDown(); });
  el.querySelector('#wgo').onclick = () => { el.remove(); render(); later(() => { const sec = $('#docs'); if (sec) { sec.scrollIntoView({ block: 'center', behavior: 'smooth' }); sec.classList.add('reveal'); } }, 80); }; }
function locationAfter() { const id = S.cur; $$('[data-tab]').forEach(b => b.onclick = () => { S.tab = b.dataset.tab; render(); });
  $$('[data-sz]').forEach(b => b.onclick = () => { S.satZoom = b.dataset.sz; render(); });
  wireLotPan(id);
  const ne = $('#newEntry'); if (ne) ne.onclick = () => { S.draft = { photo: null, memo: '', kind: null, snapped: false }; go('camera'); };
  const fin = $('#finish'); if (fin) fin.onclick = () => { if (S.done.has(id)) { S.done.delete(id); render(); return; } const n = entriesOf(id).length; const mark = () => { S.done.add(id); S.tab = 'today'; wrapUp(id); }; if (!n) confirmSheet('Finish with no entries?', 'The stop will be marked as visited with no findings recorded.', [{ label: 'Mark visited', fn: mark }, { label: 'Keep inspecting', cls: 'ghost' }]); else mark(); };
  const tm = $('#toMap'); if (tm) tm.onclick = () => { S.cur = null; S.stack = []; go('map', { replace: true }); };
  const ex = $('#exitSnap'); if (ex) ex.onclick = () => { S.snapshot = null; S.tab = 'history'; render(); };
  $$('[data-hist]').forEach(h => h.onclick = () => { const hh = HISTORY[id].find(x => x.date === h.dataset.hist); S.snapshot = { date: hh.date, entries: hh.entries, outcome: hh.outcome }; render(); });
  $$('[data-pip]').forEach(p => p.onclick = () => { const el = $(`[data-e="${p.dataset.pip}"]`); if (el) { el.scrollIntoView({ block: 'center', behavior: 'smooth' }); el.style.outline = '1px solid var(--cyan)'; later(() => el.style.outline = '', 1200); } });
  const list = $('#elist'); if (list && !S.snapshot) { list.querySelectorAll('.entry').forEach(card => { let t = null; const eid = card.dataset.e;
      card.onpointerdown = e => { if (e.target.closest('.x')) return; t = setTimeout(() => { t = null; S.wobble = true; render(); }, 500); };
      card.onpointerup = e => { if (e.target.closest('.x')) return; if (t) { clearTimeout(t); if (S.wobble) { S.wobble = false; render(); return; } openRecord(eid); } };
      card.onpointerleave = () => { if (t) { clearTimeout(t); t = null; } };
      card.querySelector('.x').onclick = e => { e.stopPropagation(); confirmSheet('Delete this entry?', 'Entry ' + card.querySelector('.n').textContent + ' and its record, recommendations and pip will be removed.', [{ label: 'Delete', cls: 'danger', fn: () => { S.entries[id] = entriesOf(id).filter(x => x.id !== eid); entriesOf(id).forEach((x, i) => x.n = i + 1); bump(id); S.wobble = false; render(); toast('Entry deleted'); } }, { label: 'Keep', cls: 'ghost' }]); }; }); }
  if (S.wobble) { const v = $('#view'); v.onclick = e => { if (!e.target.closest('.entry')) { S.wobble = false; render(); } }; } }

// ---------------- camera ----------------
function cameraView() { const d = S.draft || {}; const a = addrOf(S.cur); const m = d.photoMeta;
  const vf = `<div class="vf">${img(d.photo || FIXTURE, d.photo ? 'Photo' : 'Live viewfinder')}${m ? `<span class="src">${esc(PHOTO.caption(m))}</span>` : ''}</div>`;
  return `<div class="cam ${d.snapped ? 'snap' : ''} ${d.photo ? '' : 'nophoto'}" id="cam">${vf}<div class="grid"></div><div class="hud"><div style="display:flex;gap:8px"><button class="camx" id="camBack">‹ Back</button><button class="camx" id="retake" style="display:none">↺ Retake</button><button class="camx" id="cancelScan" style="display:none">Cancel</button></div><span class="addr2">${esc(a.addr)}<small>${esc(CONFIG.inspector.name)} · ${clock()}</small></span></div>
  <div class="scanline" id="scan"></div><div class="ar" id="ar"></div><div class="stat" id="status"><div class="dot spin"></div><div><div class="t"></div><div class="d"></div></div></div>
  <div class="ctl"><button class="side" id="upload" title="Upload a photo">▲<small>Upload</small></button><button class="shutter" id="shutter" aria-label="Take picture"><i></i></button><button class="side" id="noteOnly" title="Note without a photo">⌨<small>Note only</small></button></div><div class="flash"></div>
  <input type="file" id="file" accept="image/jpeg,image/png,image/webp,image/heic,image/heif" hidden>
  <div class="picker" id="picker"><div class="pk"><div class="pk-h">Add a photo<button class="pk-x" id="pkX" aria-label="Close">✕</button></div>
    <button class="pk-file" id="pkFile">Choose from this device<small>JPEG, PNG or WebP · rotated and resized automatically</small></button>
    <div class="pk-err" id="pkErr" hidden></div>
    <div class="pk-lab">Reference photos</div>
    <div class="pk-grid">${PHOTOLIB.map(x => `<button class="pk-i" data-lib="${x.id}">${img(x.src, x.label)}<span>${esc(x.label)}</span></button>`).join('')}</div></div></div>
  <div class="sheet2" id="sheet2"><div class="say" id="say"><div class="tx" id="tx"></div><div class="pill" id="pill"><span class="mic">◉</span><span class="hint">Tap to type · hold to speak</span><div class="wave">${'<i></i>'.repeat(18)}</div></div></div><div class="typed" id="typed"><textarea class="memo" id="memo" rows="3" placeholder="What did you see?"></textarea><div class="typed-row"><button class="link" id="useVoice">◉ Use voice instead</button><span class="link-hint" id="memoHint"></span></div><button class="btn" id="submit" style="margin-top:10px" disabled>Submit entry</button></div></div></div>`; }
function cameraAfter() { const cam = $('#cam'), sheet = $('#sheet2'), say = $('#say'), pill = $('#pill'), tx = $('#tx'), memo = $('#memo'), submit = $('#submit'); const d = S.draft;
  // This screen can re-render under a live recording (a photo chosen, a retake).
  // The bar it was being held on is gone, so the microphone goes with it.
  VOICE.cancel();
  const showSheet = () => { cam.classList.add('snap'); d.snapped = true; $('#retake').style.display = d.photo ? '' : 'none'; $('#retake').textContent = d.photoMeta ? '↺ Change photo' : '↺ Retake'; };
  const grow = fn => { const h0 = sheet.offsetHeight; fn(); const h1 = sheet.offsetHeight; if (h0 === h1) return; sheet.style.height = h0 + 'px'; sheet.style.overflow = 'hidden'; void sheet.offsetHeight; sheet.style.transition = 'height .45s cubic-bezier(.2,.8,.2,1),transform .5s cubic-bezier(.2,.8,.2,1),opacity .4s'; sheet.style.height = h1 + 'px'; setTimeout(() => { sheet.style.height = ''; sheet.style.overflow = ''; sheet.style.transition = ''; }, 480); };
  const checkMemo = () => { const v = memo.value.trim(); submit.disabled = !v && !d.photo; $('#memoHint').textContent = v ? '' : d.photo ? 'Optional · the scan works from the photo' : 'Add a note to continue'; };
  $('#shutter').onclick = () => { d.photo = 'assets/original.jpg'; showSheet(); };
  const picker = $('#picker'), fileIn = $('#file');
  const closePicker = () => picker.classList.remove('on');
  const setPhoto = p => { d.photo = p.src; d.photoMeta = p; S.draft = d; closePicker(); render();
    later(() => { const c = $('#cam'); if (!c) return; c.classList.add('snap'); S.draft.snapped = true; const r = $('#retake'); if (r) { r.style.display = ''; r.textContent = '↺ Change photo'; } }, 60); };
  $('#upload').onclick = () => picker.classList.add('on');
  $('#pkX').onclick = closePicker;
  picker.onclick = e => { if (e.target === picker) closePicker(); };
  // toast() is a no-op in this build, so a file that cannot be read says so in
  // the picker — where the tap happened, and where the next try is.
  const pkErr = $('#pkErr');
  const showErr = m => { pkErr.textContent = m; pkErr.hidden = !m; };
  $('#pkFile').onclick = () => { showErr(''); fileIn.click(); };
  $$('[data-lib]').forEach(b => b.onclick = () => setPhoto(PHOTO.fromLibrary(b.dataset.lib)));
  fileIn.onchange = async () => { const f = fileIn.files && fileIn.files[0]; fileIn.value = ''; if (!f) return;
    const btn = $('#pkFile'); const reset = () => { btn.disabled = false; btn.firstChild.textContent = 'Choose from this device'; };
    showErr(''); btn.disabled = true; btn.firstChild.textContent = 'Reading ' + f.name + '…';
    try { setPhoto(await PHOTO.fromFile(f)); }
    catch (err) { showErr(err.message); reset(); } };
  $('#noteOnly').onclick = () => { d.photo = null; showSheet(); };
  $('#camBack').onclick = () => backWithGuard();
  $('#retake').onclick = () => { d.photo = null; d.photoMeta = null; d.snapped = false; S.draft = d; render(); toast('Viewfinder live · memo kept'); };
  $('#cancelScan').onclick = () => { newRun(); clearTimers(); cam.classList.remove('scanning'); $('#ar').innerHTML = ''; $('#scan').classList.remove('go'); $('#status').classList.remove('on'); $('#cancelScan').style.display = 'none'; sheet.classList.remove('recede'); sheet.classList.add('type'); toast('Analysis cancelled · memo kept'); };
  // ---- hold to speak ----------------------------------------------------
  // The microphone, for real: voice.js opens it on the hold, meters it while
  // the bar is down, and posts the recording to be transcribed on release. The
  // words arrive in the box above and stay editable.
  //
  // Nothing in this path invents a sentence. A blocked microphone, a hold with
  // nobody speaking, a transcription that fails — each says which, in the panel
  // or on the memo hint, and hands over the keyboard. The note is the evidence
  // the record is drafted from and the owner's notice is written from, so the
  // only two things that may end up in it are what was said and what was typed.
  //
  // The states are: idle → opening (permission, mic warm-up) → live (recording)
  // → busy (transcribing) → idle. A release during `opening` sets `abort`,
  // because the permission dialog can outlast the gesture that asked for it.
  let t0 = 0, mode = 'idle', wt = null, raf = null, tickT = null;
  const wave = pill.querySelector('.wave'), bars = [...wave.querySelectorAll('i')], hint = pill.querySelector('.hint');
  const IDLE_HINT = 'Tap to type · hold to speak';
  const saying = html => { tx.innerHTML = html || ''; };
  const warn = m => saying(`<span class="warn">${esc(m)}</span>`);

  // The bars are the analyser's last 18 samples, oldest on the left, so the
  // trace scrolls as the voice moves. When the mic is shut they go back to the
  // CSS idle animation.
  const meterFrame = () => { const tr = VOICE.trace(bars.length); bars.forEach((b, i) => { b.style.height = (5 + Math.round(tr[i] * 23)) + 'px'; b.style.opacity = (0.4 + tr[i] * 0.6).toFixed(2); }); raf = requestAnimationFrame(meterFrame); };
  const stopMeter = () => { if (raf) cancelAnimationFrame(raf); raf = null; clearInterval(tickT); tickT = null; wave.classList.remove('live'); bars.forEach(b => { b.style.height = ''; b.style.opacity = ''; }); };
  // Back to the resting bar. Not animated in itself — every caller wraps it in
  // one grow() with whatever else is changing, so the sheet resizes once.
  const resetVoice = () => { stopMeter(); say.classList.remove('hold', 'busy'); hint.textContent = IDLE_HINT; };

  const toKeyboard = h => { grow(() => { resetVoice(); saying(''); sheet.classList.add('type'); if (!memo.value) memo.value = d.memo || ''; checkMemo(); if (h) $('#memoHint').textContent = h; }); setTimeout(() => memo.focus(), 460); };
  // Stay on the voice bar, with a line saying why nothing came of that hold.
  const voiceAgain = m => grow(() => { resetVoice(); warn(m); });

  // Release of a real recording: stop, judge the clip, transcribe it.
  const release = async () => {
    mode = 'busy'; stopMeter();
    const clip = await VOICE.stop();
    // Too short, or the recorder gave nothing back. Stay in voice mode — the
    // next thing the inspector wants is to hold it again, properly.
    if (!clip || clip.short) { mode = 'idle'; voiceAgain(clip ? 'Too short · hold the bar down while you speak' : 'Nothing was recorded · hold the bar down while you speak'); return; }
    // Metered and flat: the mic is muted, covered, or nobody spoke. Typing is
    // the way out of that, not holding it again.
    if (clip.silent) { mode = 'idle'; return toKeyboard('Nothing was heard · type the note'); }

    grow(() => { say.classList.remove('hold'); say.classList.add('busy'); hint.textContent = 'Transcribing…'; saying(`Transcribing <b>${clipLen(clip.ms)}</b> of audio<span class="cur"></span>`); });
    let r;
    try { r = await VOICE.transcribe(clip, { address: addrOf(S.cur).addr, hasPhoto: !!d.photo }); }
    catch (err) { mode = 'idle'; return toKeyboard(err.hint || 'Could not transcribe that · type the note'); }
    mode = 'idle';
    // The model heard the recording and found no speech in it. Said plainly:
    // a guess at what the wind might have been saying is the one answer worse
    // than an empty box.
    if (!r.text) return toKeyboard('No speech in that recording · type the note');

    // When the level meter and the transcriber disagree, say so rather than
    // picking a winner. A flat clip that comes back with words in it is the
    // shape of a hallucination — a 440 Hz tone transcribed as "Zone 0, cypress
    // overhanging porch, needs limbing" — but a flat clip can equally be one
    // unbroken sentence over traffic, and throwing that away would be worse.
    // So the words go in the box, the hint says to check them, and the
    // recording is there to check them against.
    const flat = !!(clip.meter && clip.meter.swing < 10);
    // The recording stays with the entry. The transcript is editable — and
    // should be — so the only unedited account of what was said is the audio.
    d.clip = { mimeType: clip.mimeType, data: clip.data, ms: clip.ms, model: r.model, flat };
    grow(() => { resetVoice(); saying(''); sheet.classList.add('type'); const had = memo.value.trim(); memo.value = had ? had + ' ' + r.text : r.text; d.memo = memo.value; d.spoken = true; checkMemo(); $('#memoHint').textContent = flat ? 'Transcribed · play it back and check it' : 'Transcribed · edit if needed'; });
    setTimeout(() => memo.focus(), 460);
  };

  pill.onpointerdown = e => { e.preventDefault(); if (mode !== 'idle') return; t0 = Date.now(); pill.setPointerCapture(e.pointerId);
    wt = setTimeout(async () => {
      mode = 'opening';
      grow(() => say.classList.add('hold'));
      saying('Opening the microphone<span class="cur"></span>');
      try { await VOICE.start(); }
      catch (err) { const held = mode === 'opening'; mode = 'idle'; if (held) toKeyboard(err.hint || 'Microphone unavailable · type the note'); else grow(() => { resetVoice(); saying(''); }); return; }
      // Let go while the browser was still asking, or while the mic opened.
      if (mode !== 'opening') { VOICE.cancel(); mode = 'idle'; voiceAgain('Hold the bar down while you speak'); return; }
      mode = 'live';
      wave.classList.add('live'); meterFrame();
      // voice.js stops itself at two minutes, which is a stuck pointer rather
      // than a memo. If that happens the counter must not keep running as
      // though the mic were still open, so the tick finishes the hold instead.
      const tick = () => { if (!VOICE.active()) return release(); saying(`Listening <b>${clipLen(VOICE.ms())}</b><span class="cur"></span>`); };
      tick(); tickT = setInterval(tick, 300);
    }, 220); };
  pill.onpointerup = pill.onpointercancel = () => { clearTimeout(wt);
    if (mode === 'opening') { mode = 'abort'; return; }
    if (mode === 'live') return release();
    if (mode === 'idle' && Date.now() - t0 < 600) { grow(() => { sheet.classList.add('type'); if (!memo.value) memo.value = d.memo || ''; checkMemo(); }); setTimeout(() => memo.focus(), 460); } };
  memo.addEventListener('input', () => { d.memo = memo.value; checkMemo(); }); $('#useVoice').onclick = () => grow(() => sheet.classList.remove('type'));
  submit.onclick = () => { d.memo = memo.value.trim(); d.kind = !d.photo ? 'note' : (/compliant|clear|ok|good/i.test(d.memo) ? 'compliance' : 'violation'); if (!d.memo) d.memo = ''; sheet.classList.add('recede'); analyze(); };
  // The boxes used to be a fixture on a timer, so they could be scheduled the
  // moment the scan began. Now the model draws them from the photograph, which
  // means they cannot appear until it answers — so the scanline and the status
  // stream cover the wait, and the boxes land at the end as the result of it.
  // The hand-measured fixture is kept as a fallback for the one image it was
  // measured against, for when the model is unreachable.
  const paintScan = (sc, ar) => {
    if (!sc) return 0;
    const all = (sc.boxes || []).map(b => [b, false]).concat(sc.issue ? [[sc.issue, true]] : []);
    const gap = Math.min(300, 1000 / Math.max(1, all.length));
    all.forEach(([b, isIssue], i) => later(() => ar.insertAdjacentHTML('beforeend',
      `<div class="${isIssue ? 'issue' : 'bx'} ${b.tone}" style="left:${b.box[0]}%;top:${b.box[1]}%;width:${b.box[2]}%;height:${b.box[3]}%"><span>${esc(b.label)}</span></div>`), i * gap));
    return all.length * gap + 400;
  };
  const analyze = () => { cam.classList.add('scanning'); $('#cancelScan').style.display = ''; const st = $('#status'); const ar = $('#ar'); const stepMs = 600; const fallbackScan = d.photo === FIXTURE ? SCAN[d.kind === 'violation' ? 'violation' : 'compliance'] : null; const steps = d.photo ? STREAM : [STREAM[0], STREAM[4], STREAM[5], STREAM[6]];
    if (d.photo) later(() => $('#scan').classList.add('go'), 350);
    later(() => st.classList.add('on'), 500); steps.forEach((x, i) => later(() => { st.classList.remove('swap'); void st.offsetWidth; st.classList.add('swap'); st.querySelector('.t').textContent = x.t; st.querySelector('.d').textContent = x.d; }, 600 + i * stepMs));
    // The record is drafted by the model from the note that was just typed, so
    // the call starts here, in parallel with the animation, and the last status
    // step waits on the reply instead of on a timer. The animation is the floor
    // on how fast this can feel, not the whole of it.
    const run = newRun();
    const entry = { n: entriesOf(S.cur).length + 1, kind: d.kind, time: clock(), photo: d.photo, spoken: d.spoken, memo: d.memo };
    const pending = DRAFTS.record(addrOf(S.cur), entry);
    const animMs = 600 + steps.length * stepMs;
    later(() => { st.querySelector('.t').textContent = 'Drafting the record'; st.querySelector('.d').textContent = 'writing it up from your note…'; }, animMs);
    const open = ai => { if (!isCurrentRun(run)) return;
      // What the model saw, or the fixture if it never answered.
      const sc = (ai && ai.scan) || fallbackScan;
      const done = () => { const paintMs = paintScan(sc, ar);
        st.querySelector('.dot').classList.remove('spin'); st.querySelector('.dot').textContent = '✓';
        st.querySelector('.t').textContent = ai.source === 'template' ? 'Templates used' : sc && sc.source === 'model' ? 'Photograph read' : 'Record drafted';
        st.querySelector('.d').textContent = ai.source === 'template' ? 'the model could not be reached' : sc && sc.source === 'model' ? (sc.boxes.length + (sc.issue ? 1 : 0)) + ' things found in the frame' : 'opening…';
        later(() => { if (isCurrentRun(run)) createRecord(sc, ai); }, Math.max(paintMs, ai.source === 'template' ? 1100 : 700)); };
      // Never open sooner than the animation would have: a 2-second record
      // reads as a stunt, and the status line has steps still to show.
      const wait = Math.max(0, animMs + 300 - (Date.now() - t1));
      later(done, wait); };
    const t1 = Date.now();
    pending.then(open, e => open(DRAFTS.recordFallback(d.kind, String((e && e.message) || e)))); };
  if (d.snapped) { cam.classList.add('snap'); $('#retake').style.display = d.photo ? '' : 'none'; } }
function createRecord(sc, drafted) { const d = S.draft; const ai = drafted || clone(AI[d.kind]); const n = entriesOf(S.cur).length + 1; const pos = POS[S.posIdx % POS.length]; S.posIdx++;
  S.rec = { id: 'e' + Date.now(), n, kind: d.kind, kindRaw: d.kind, photo: d.photo, photoMeta: d.photoMeta || null, memo: d.memo, spoken: !!d.spoken, voice: d.clip || null, ai, recs: ai.recs.map(r => ({ ...r, decision: null })), scan: sc, geo: pos, time: clock(), meta: [['Date', fmtDate(todayISO())], ['Time', clock()], ['Location', simFix(S.cur, pos)], ['Address', addrOf(S.cur).addr], ['Inspector', CONFIG.inspector.name + ' · ' + CONFIG.inspector.badge]], feedback: [] };
  // The pictures start here, not at Finish: a card takes fifteen to twenty
  // seconds, and starting now means the first ones have landed by the time the
  // inspector has read the record and reached the deck. Nothing waits on them —
  // each card says it is being drawn and repaints itself when it is.
  VISUALS.startEntry(S.cur, S.rec);
  S.recDirty = true; S.draft = null; go('record'); }
function openRecord(eid) { const e = entriesOf(S.cur).find(x => x.id === eid); S.rec = clone(e); S.recDirty = false; go('record'); }
function saveRecord() { const list = entriesOf(S.cur); const i = list.findIndex(x => x.id === S.rec.id); if (i >= 0) list[i] = S.rec; else list.push(S.rec); bump(S.cur); S.rec = null; S.recDirty = false; S.tab = 'today'; S.stack = S.stack.filter(s => s !== 'camera' && s !== 'record' && s !== 'deck'); go('location', { replace: true }); toast('Entry saved'); }

// ---------------- record ----------------

// Where the text on this screen came from. A template is not a draft of this
// property, so it is never allowed to look like one.
function provChip(ai) {
  if (!ai || ai.source === 'template') return '<span class="chip amber" style="margin-left:8px;font-weight:600">Template · not this property</span>';
  const m = ai.meta && ai.meta.model ? ai.meta.model : 'model';
  return `<span class="chip cyan" style="margin-left:8px;font-weight:600">${esc(m)}</span>`;
}

function provNote(ai) {
  if (!ai || ai.source !== 'template') return '';
  return `<p style="margin-top:10px;color:var(--amber);font-size:12px">This is built-in example text, not a description of this property${ai.fallbackReason ? ' — ' + esc(ai.fallbackReason) : ''}. Edit it or try again when the model is reachable.</p>`;
}

// Citation caveats, in the order they matter: a section the model invented is a
// defect, a section whose text was never source-checked is a task.
function codeCaveat(ai) {
  const a = (ai && ai.audit) || {};
  const out = [];
  if ((a.unknownCitations || []).length) out.push(`<p style="margin-top:10px;color:var(--red);font-size:12px">${a.unknownCitations.length} citation${a.unknownCitations.length === 1 ? ' is' : 's are'} not in the department code library. Do not rely on ${a.unknownCitations.length === 1 ? 'it' : 'them'}.</p>`);
  if ((a.pendingCitations || []).length) out.push(`<p style="margin-top:8px;color:var(--amber);font-size:12px">${a.pendingCitations.length} cited section${a.pendingCitations.length === 1 ? ' is' : 's are'} adopted but not yet enforceable as a present violation.</p>`);
  if ((a.unsourcedCitations || []).length) out.push(`<p style="margin-top:8px;color:var(--faint);font-size:12px">Marked <b>verify source</b>: in the library, but the wording was never checked against the adopted code. Confirm before this goes on a notice.</p>`);
  if ((a.mirroredCitations || []).length) out.push(`<p style="margin-top:8px;color:var(--faint);font-size:12px">Marked <b>confirm source</b>: transcribed verbatim, but from a mirror rather than the signed or official publication. Confirm the wording — local sections against the ordinance on file with the Fire Marshal — before this goes on a notice.</p>`);
  if (a.codeEdition) out.push(`<p style="margin-top:8px;color:var(--faint);font-size:12px">Edition: ${esc(a.codeEdition)}${a.codeOrdinance ? ' · ' + esc(a.codeOrdinance) : ''}${a.codeEffective ? ' · effective ' + esc(a.codeEffective) : ''}</p>`);
  return out.join('');
}

function overlay(sc, cls) { if (!sc) return ''; const lab = cls === 'lab';
  // `issue` is the one highlighted box. The hand-measured fixtures always have
  // one; a model that labelled elements without isolating a finding may not.
  const issue = sc.issue ? `<div class="bx issue ${sc.issue.tone}" style="left:${sc.issue.box[0]}%;top:${sc.issue.box[1]}%;width:${sc.issue.box[2]}%;height:${sc.issue.box[3]}%">${lab ? `<span class="il">${esc(sc.issue.label)}</span>` : ''}</div>` : '';
  return `<div class="ov ${cls || ''}">${(sc.boxes || []).map(b => `<div class="bx ${b.tone}" style="left:${b.box[0]}%;top:${b.box[1]}%;width:${b.box[2]}%;height:${b.box[3]}%">${lab ? `<span>${esc(b.label)}</span>` : ''}</div>`).join('')}${issue}</div>`; }
function recordView() { const r = S.rec; const ed = (path, v) => `<span class="ed" data-path="${path}">${esc(v)}</span>`; const card = (title, body, delay, key) => `<div class="card edcard" data-key="${key || title}" style="animation-delay:${delay}s"><h4>${title}<button class="edbtn main" data-edit>Edit</button></h4>${body}</div>`;
  const kindT = r.kind === 'violation' ? 'Violation' : r.kind === 'compliance' ? 'Compliant' : 'Note'; const sevColor = r.kind === 'violation' ? 'var(--red)' : r.kind === 'compliance' ? 'var(--green)' : 'var(--amber)';
  const photos = r.photo ? `<div class="photos fade"><div class="pbox" id="pOrig">${img(r.photo, 'photo')}<span class="lab">Original</span></div><div class="pbox" id="pScan">${img(r.photo, 'photo')}${overlay(r.scan)}<span class="lab">Scanned</span></div></div>` : '';
  const inc = r.recs.filter(x => x.decision === 'in').length, dec = r.recs.filter(x => x.decision).length;
  const body = `${photos}
  <div class="card" style="animation-delay:.05s"><h4>Inspector’s note ${r.spoken ? `<span class="chip cyan" style="margin:0 0 0 8px;padding:3px 8px">${r.voice ? 'Voice · ' + clipLen(r.voice.ms) : 'Voice · transcribed'}</span>` : ''}</h4><p style="color:${r.memo ? 'var(--ink)' : 'var(--faint)'}">${r.memo ? esc(r.memo) : 'No note · record drafted from the photo alone'}</p>${r.voice ? `<div class="vclip"><button class="vb" id="vplay">▶ Play what was said</button><span class="vm${r.voice.flat ? ' warn' : ''}">${r.voice.flat ? 'The level did not look like speech · check the note against the recording' : 'Transcribed from this recording · the note is editable, the recording is not'}</span></div>` : ''}${r.ai && r.ai.photoNote ? `<div class="pdiff"><b>The photograph also shows</b>${esc(r.ai.photoNote)}</div>` : ''}</div>
  ${card(`AI summary ${provChip(r.ai)}`, r.ai.summary.map((x, i) => `<div class="st"><b>${esc(x[0])}</b>${ed('summary.' + i + '.1', x[1])}</div>`).join('') + provNote(r.ai), .1, 'summary')}
  ${r.kind === 'note' ? '' : card(r.kind === 'violation' ? 'Severity' : 'Determination', `<div class="sev"><div class="ring" style="background:conic-gradient(${sevColor} 0 ${Math.max(r.ai.severity.score, 6)}%,rgba(255,255,255,.08) ${Math.max(r.ai.severity.score, 6)}% 100%)"><i style="color:${sevColor}">${r.kind === 'violation' ? r.ai.severity.score : '✓'}</i></div><div><div style="font-weight:650">${ed('severity.level', r.ai.severity.level)}</div><div style="font-size:12px;color:var(--faint)">${ed('severity.why', r.ai.severity.why)}</div></div></div><div style="margin-top:8px">${r.ai.category.map(c => `<span class="chip">${esc(c)}</span>`).join('')}</div>`, .2, 'severity')}
  ${r.ai.estimates.length ? card('Estimates', r.ai.estimates.map((x, i) => `<div class="st"><b>${esc(x[0])}</b>${ed('estimates.' + i + '.1', x[1])}</div>`).join(''), .3, 'estimates') : ''}
  ${r.ai.codes.length ? card('Code references', r.ai.codes.map((c, i) => `<div style="margin:6px 0"><span class="chip ${c.scope === 'Local' ? 'amber' : 'cyan'}">${esc(c.scope)} · ${esc(c.c)}</span>${c.unverified ? '<span class="chip red" title="This section is not in the department code library">not in library</span>' : ''}${c.unsourced ? '<span class="chip amber" title="In the library, but its text was never checked against a primary source">verify source</span>' : ''}${c.mirrored ? '<span class="chip amber" title="Transcribed verbatim, but from a mirror rather than the signed or official publication">confirm source</span>' : ''}${c.edition ? `<div class="ct2" style="margin-top:3px">${esc(c.edition)}</div>` : ''}<p style="margin-top:4px">${ed('codes.' + i + '.t', c.t)}</p></div>`).join('') + codeCaveat(r.ai), .4, 'codes') : ''}
  ${r.feedback.length ? `<div class="card" style="animation-delay:.45s"><h4>Scan feedback applied</h4>${r.feedback.map(f => `<p>↳ ${esc(f)}</p>`).join('')}</div>` : ''}
  ${r.kind === 'violation' ? `<div class="docbtn" id="openDeck" style="margin-top:14px"><span class="ic">▥</span><div><div class="t">Recommendations for the owner</div><div class="s">${dec ? inc + ' included · ' + (dec - inc) + ' left out of ' + r.recs.length : r.recs.length + ' suggested · swipe to decide'}</div></div><span style="margin-left:auto;color:var(--cyan)">›</span></div>` : ''}
  <div class="metaf fade">${r.meta.map(m => `<span><b>${esc(m[0])}</b> ${esc(m[1])}</span>`).join('')}</div>`;
  return frame(`Entry ${r.n} · ${kindT}`, addrOf(S.cur).addr, body, `<div class="row2"><button class="btn ghost" data-back>Back</button><button class="btn" id="save">Save entry</button></div>`); }
function recordAfter() { const r = S.rec; $('#save').onclick = saveRecord; const od = $('#openDeck'); if (od) od.onclick = () => { S.deck = { idx: r.recs.findIndex(x => !x.decision) < 0 ? r.recs.length : r.recs.findIndex(x => !x.decision) }; go('deck'); };
  // The dictated memo, playable. The transcript is editable and the model that
  // wrote it is not infallible, so the recording is kept as the one unedited
  // account of what the inspector actually said at the property.
  const vp = $('#vplay');
  if (vp && r.voice) { let au = null; const idle = '▶ Play what was said';
    const rest = () => { vp.classList.remove('on'); vp.textContent = idle; };
    vp.onclick = () => {
      if (!au) { au = new Audio(`data:${r.voice.mimeType.split(';')[0]};base64,${r.voice.data}`); au.onended = rest; au.onerror = () => { au = null; rest(); vp.textContent = 'This browser cannot play it back'; }; }
      if (au.paused) { vp.classList.add('on'); vp.textContent = '❙❙ Playing…'; au.play().catch(() => { rest(); vp.textContent = 'This browser cannot play it back'; }); }
      else { au.pause(); au.currentTime = 0; rest(); } }; }
  wireEdits(r.ai, () => { S.recDirty = true; });
  const pic = img(r.photo, 'photo');
  const po = $('#pOrig'); if (po) po.onclick = () => lightbox(`<div class="lb-top"><span>Original photo</span><button class="ib" data-close>✕</button></div><div class="lb-wrap"><div class="lb-pic">${pic}</div></div><div class="foot"><button class="btn" id="lbRetake">Retake photo</button></div>`, el => { el.querySelector('#lbRetake').onclick = () => { confirmSheet('Retake and start over?', 'A new photo means a new scan, new notes and a new deck. This entry’s current draft is discarded.', [{ label: 'Retake', cls: 'danger', fn: () => { el.remove(); S.draft = { photo: null, memo: r.memo, kind: null, snapped: false }; S.rec = null; S.recDirty = false; go('camera', { replace: true }); } }, { label: 'Keep', cls: 'ghost' }]); }; });
  const ps = $('#pScan'); if (ps) ps.onclick = () => lightbox(`<div class="lb-top"><span>Scanned photo</span><button class="ib" data-close>✕</button></div><div class="lb-wrap"><div class="lb-pic">${pic}${overlay(r.scan, 'lab')}</div></div><div class="foot"><div class="fb"><input id="fbin" placeholder="Tell the scan what it got wrong…"><button id="fbgo">Re-scan</button></div><div class="fbnote" id="fbnote" hidden></div></div>`, el => {
    const inp = el.querySelector('#fbin'), b = el.querySelector('#fbgo'), note = el.querySelector('#fbnote');
    const say = (m, bad) => { note.textContent = m || ''; note.hidden = !m; note.classList.toggle('bad', !!bad); };
    const idle = () => { b.textContent = 'Re-scan'; b.disabled = false; inp.disabled = false; };
    b.onclick = async () => { const v = inp.value.trim(); if (!v) return;
      b.textContent = 'Re-scanning…'; b.disabled = true; inp.disabled = true;
      say('Sending the photograph back with your correction…');
      const res = await rescan(v);
      if (!res.ok) { idle(); say(res.why, true); return; }
      el.remove(); render(); };
    inp.onkeydown = e => { if (e.key === 'Enter') b.onclick(); }; }); }

/**
 * Re-scan: the inspector read the draft and said what it got wrong, so the
 * photograph goes back to the model with that correction and the whole record
 * is drafted again.
 *
 * This used to be a 1.6-second setTimeout that appended the inspector's own
 * words to the estimates table — the one thing on the record screen that only
 * looked like it was working. Nothing was re-read and nothing was corrected.
 *
 * Two things survive a redraft, because they are not the model's to replace:
 * a recommendation the inspector wrote themselves, and the in/out decisions
 * they already made on cards that come back unchanged.
 */
async function rescan(text) {
  const r = S.rec, run = newRun();
  const entry = { n: r.n, kind: r.kindRaw || r.kind, time: r.time, photo: r.photo, spoken: r.spoken, memo: r.memo, feedback: (r.feedback || []).concat(text) };
  const ai = await DRAFTS.record(addrOf(S.cur), entry);
  // A redraft takes seconds; the inspector may have saved or left in the
  // meantime, and writing into a record that is no longer open would land
  // the correction on nothing.
  if (!isCurrentRun(run) || S.rec !== r) return { ok: false, why: 'Cancelled.' };
  // DRAFTS.record never throws; it hands back a template when the call fails.
  // Taking that would quietly replace a real record with fixture text.
  if (ai.source !== 'ai') return { ok: false, why: 'Could not reach the model — ' + (ai.fallbackReason || 'the draft failed') + '. The record is unchanged.' };
  const own = (r.recs || []).filter(x => x.own);
  const decided = new Map((r.recs || []).filter(x => x.decision && !x.own).map(x => [x.title, x.decision]));
  r.feedback = entry.feedback;
  r.ai = ai;
  if (ai.scan) r.scan = ai.scan;
  VISUALS.reset(r.id, r.recs);
  r.recs = own.concat(ai.recs.map(x => ({ ...x, decision: decided.get(x.title) || null })));
  S.recDirty = true;
  // `reset` above threw away what we knew about the old cards, so these are
  // new ones and are drawn like any others — the deck is very likely open on
  // them right now.
  VISUALS.startEntry(S.cur, r);
  return { ok: true };
}
function lightbox(html, wire) { const el = document.createElement('div'); el.className = 'lb'; el.innerHTML = html; $('#app').appendChild(el); el.querySelectorAll('[data-close]').forEach(b => b.onclick = () => el.remove()); wire && wire(el); return el; }
function getPath(root, p) { let o = root; for (let i = 0; i < p.length - 1; i++) o = o[p[i]]; return o; }
function wireEdits(root, onChange) { $$('.edcard').forEach(card => { const btn = card.querySelector('[data-edit]'); if (!btn) return; const snap = card.dataset.snap || (card.dataset.snap = JSON.stringify([...card.querySelectorAll('.ed')].map(e => e.textContent)));
    const changed = () => JSON.stringify([...card.querySelectorAll('.ed')].map(e => e.textContent)) !== snap; const save = e => { const p = e.dataset.path.split('.'); getPath(root, p)[p[p.length - 1]] = e.textContent; onChange && onChange(); };
    const showRevert = () => { let r = card.querySelector('.revert'); if (changed()) { if (!r) { r = document.createElement('button'); r.className = 'edbtn revert'; r.textContent = 'Revert'; r.onclick = () => { const orig = JSON.parse(snap); card.querySelectorAll('.ed').forEach((e, i) => { e.textContent = orig[i]; save(e); }); showRevert(); toast('Reverted to the generated text'); }; btn.before(r); } } else if (r) r.remove(); };
    btn.onclick = () => { const on = card.classList.toggle('editing'); btn.textContent = on ? 'Done' : 'Edit'; card.querySelectorAll('.ed').forEach(e => e.contentEditable = on); if (on) { const f = card.querySelector('.ed'); f && f.focus(); } else { showRevert(); if (changed()) toast('Saved'); } };
    card.querySelectorAll('.ed').forEach(e => { e.addEventListener('input', () => save(e)); e.addEventListener('keydown', ev => { if (ev.key === 'Enter') { ev.preventDefault(); e.blur(); } }); }); showRevert(); }); }

// ---------------- deck ----------------
function deckView() { return frame('Recommendations', 'swipe right to include · left to leave out', `<div class="deck" id="deck"></div><div class="dbtns"><button class="info" id="bUndo" aria-label="Undo"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/></svg></button><button class="no" id="bNo">✕</button><button class="yes" id="bYes">✓</button><span class="info spacer"></span></div><div style="text-align:center;font-size:12px;color:var(--faint);margin:8px 0 0" id="dcount"></div>`, `<button class="link" id="own" style="display:block;margin:0 auto 12px">✎ Write your own recommendation</button><button class="btn ghost" id="deckDone">Skip the rest</button>`); }
function renderDeck() { const r = S.rec, dk = S.deck; const deck = $('#deck'); const rest = r.recs.slice(dk.idx, dk.idx + 3); const inc = r.recs.filter(x => x.decision === 'in').length;
  const eid = S.rec.id;
  deck.innerHTML = rest.map((s, i) => `<div class="dcard ${VISUALS.has(eid, s) ? '' : 'text'} ${i === 1 ? 'back' : i === 2 ? 'back2' : ''}" style="z-index:${10 - i}">${VISUALS.has(eid, s) ? `<div class="img${s.img ? ' on' : ''}" data-vis="${VISUALS.key(eid, s.id)}">${VISUALS.cell(eid, s)}${s.own && s.img ? `<div class="arph"><span>${esc(s.title)}</span></div>` : ''}</div>` : ''}<div class="body"><h3>${esc(s.title)}</h3><p>${esc(s.text)}</p></div><div class="stamp in">Include</div><div class="stamp out">Leave out</div></div>`).reverse().join('');
  $('#dcount').textContent = dk.idx < r.recs.length ? `${dk.idx + 1} of ${r.recs.length} · ${inc} included` : `All reviewed · ${inc} included`; $('#deckDone').disabled = !inc; $('#deckDone').textContent = inc ? (dk.idx < r.recs.length ? `Skip the rest · use ${inc}` : `Back to the record · use ${inc}`) : 'Include at least one to continue';
  const top = deck.querySelector('.dcard:not(.back):not(.back2)'); if (!top) { deck.innerHTML = `<div class="deck-end"><div class="big">${inc}</div><div>included · ${r.recs.length - inc} left out</div></div>`; return; }
  let sx = 0, dx = 0, dragging = false; top.onpointerdown = e => { dragging = true; sx = e.clientX; top.setPointerCapture(e.pointerId); top.classList.add('drag'); };
  top.onpointermove = e => { if (!dragging) return; dx = e.clientX - sx; top.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; top.querySelector('.stamp.in').style.opacity = Math.min(1, Math.max(0, dx / 80)); top.querySelector('.stamp.out').style.opacity = Math.min(1, Math.max(0, -dx / 80)); };
  top.onpointerup = top.onpointercancel = () => { if (!dragging) return; dragging = false; top.classList.remove('drag'); if (Math.abs(dx) > 110) swipe(dx > 0); else { top.style.transform = ''; top.querySelectorAll('.stamp').forEach(s => s.style.opacity = 0); } dx = 0; }; }
function swipe(yes) { const r = S.rec, dk = S.deck; const top = $('#deck .dcard:not(.back):not(.back2)'); if (!top || dk.idx >= r.recs.length) return; r.recs[dk.idx].decision = yes ? 'in' : 'out'; S.recDirty = true; top.classList.remove('drag'); top.style.transform = `translateX(${yes ? 560 : -560}px) rotate(${yes ? 30 : -30}deg)`; top.style.opacity = '0'; top.querySelector(yes ? '.stamp.in' : '.stamp.out').style.opacity = 1; dk.idx++; later(renderDeck, 320); }
function deckAfter() { renderDeck(); $('#bNo').onclick = () => swipe(false); $('#bYes').onclick = () => swipe(true); $('#bUndo').onclick = () => { const dk = S.deck; if (!dk.idx) return; dk.idx--; S.rec.recs[dk.idx].decision = null; renderDeck(); }; $('#deckDone').onclick = () => back();
  $('#own').onclick = () => { const el = document.createElement('div'); el.className = 'confirm'; el.innerHTML = `<div class="cbox"><div class="ct">Your recommendation</div><div class="cb">Describe what the owner should do. An AR card is generated for it and placed on top of the deck.</div><textarea class="memo" id="ownTx" rows="3" placeholder="e.g. Replace the wooden retaining wall cap with stone and keep the bed clear 5 ft out."></textarea><div class="cbtns" style="margin-top:12px"><button class="btn ghost" data-no>Cancel</button><button class="btn" data-yes>Generate card</button></div></div>`; $('#app').appendChild(el); el.querySelector('[data-no]').onclick = () => el.remove(); el.querySelector('[data-yes]').onclick = () => { const v = el.querySelector('#ownTx').value.trim(); if (!v) return; const b = el.querySelector('[data-yes]'); b.textContent = 'Generating…'; b.disabled = true; later(() => { el.remove(); const r = S.rec; const title = v.split(/[,.;]/)[0].slice(0, 40); r.recs.splice(S.deck.idx, 0, { id: 'own' + Date.now(), title, text: v, img: r.photo || null, own: true, decision: null }); S.recDirty = true; renderDeck(); toast('Your card is on top of the deck'); }, 1500); }; }; }

// ---------------- documents (report + notice) ----------------
// Both documents are drafted per property from the inspector's notes and the
// code library — see drafts.js for the call and ai/ for the prompts and codes.
// The app holds the result as a structured document, renders it with one
// section renderer, and lets every line of it be edited in place. The AI
// drafts; the inspector decides.

const docState = (key, id) => (S[key][id] = S[key][id] || (key === 'notice'
  ? { ver: null, status: 'idle', doc: null, error: null, at: null, attached: new Set(), kbDone: false, own: [], draft: false, sent: false }
  : { ver: null, status: 'idle', doc: null, error: null, at: null }));
const noticeState = () => docState('notice', S.cur);

function docAttachments(id) { const ns = docState('notice', id); return KB.filter(k => ns.attached.has(k.id)).map(k => ({ title: k.title, src: k.src })); }

// Draft (or refresh) one document. `silent` suppresses the re-render, for the
// wrap-up card, which lives inside #app and would be wiped by one.
async function genDoc(key, id, opts = {}) {
  const st = docState(key, id);
  st.ver = S.ver[id] || 0; st.status = 'pending'; st.error = null;
  if (!opts.silent) render();
  const ctx = DRAFTS.context(key, addrOf(id), entriesOf(id), { attachments: key === 'notice' ? docAttachments(id) : [] });
  try {
    st.doc = await DRAFTS.draft(key, ctx); st.status = 'ok';
  } catch (e) {
    st.doc = DRAFTS.fallback(key, ctx, e.message); st.status = 'fallback'; st.error = e.message;
  }
  st.at = clock();
  if (!opts.silent) render();
  return st;
}

// One renderer for both documents. `cls` lets the notice reuse it inside the
// light mail styling.
function docSection(s, i, cls, delay) {
  const p = `sections.${i}`;
  const ed = (path, v, tag, style) => `<${tag || 'span'} class="ed" data-path="${path}"${style ? ` style="${style}"` : ''}>${esc(v)}</${tag || 'span'}>`;
  let inner = '';
  if (s.type === 'prose') inner = ed(`${p}.body`, s.body, 'p', 'margin:0;white-space:pre-wrap');
  else if (s.type === 'list') inner = `<ul class="dlist">${s.items.map((x, j) => ed(`${p}.items.${j}`, x, 'li')).join('')}</ul>`;
  else if (s.type === 'fields') inner = s.fields.map((f, j) => `<div class="st"><b>${esc(f.label)}</b>${ed(`${p}.fields.${j}.value`, f.value)}</div>`).join('');
  else inner = s.codes.map((c, j) => `<div class="cref"><span class="chip ${c.scope === 'Local' ? 'amber' : 'cyan'}">${esc(c.scope)} · ${esc(c.citation)}</span>${c.unverified ? '<span class="chip red">not in the code library</span>' : ''}${c.pending ? '<span class="chip amber">not yet enforceable</span>' : ''}${c.unsourced ? '<span class="chip amber">verify source</span>' : ''}${c.mirrored ? '<span class="chip amber">confirm source</span>' : ''}<div class="ct2">${esc(c.title)}</div>${c.edition ? `<div class="ct2">${esc(c.edition)}</div>` : ''}${ed(`${p}.codes.${j}.relevance`, c.relevance, 'p', 'margin:3px 0 0')}</div>`).join('');
  return `<div class="${cls || 'card'} edcard" data-key="${esc(s.id)}"${delay ? ` style="animation-delay:${delay}s"` : ''}><h4>${esc(s.heading)}<button class="edbtn main" data-edit>Edit</button></h4>${inner}</div>`;
}

// The banner above a document: drafting, failed-and-fell-back, or stale.
function docBanner(key, id) {
  const st = docState(key, id);
  if (st.status === 'pending') return `<div class="stale work"><span class="spin"></span>Drafting from ${entriesOf(id).length} entr${entriesOf(id).length === 1 ? 'y' : 'ies'} and the ${CONFIG.dept} code library…</div>`;
  const out = [];
  // Exactly one #refresh in the document: a second element with the same id is
  // unreachable, so the button would silently stop working.
  const failed = st.status === 'fallback', stale = st.doc && st.ver !== (S.ver[id] || 0);
  const btn = `<button id="refresh">${failed ? 'Retry' : 'Refresh'}</button>`;
  if (failed) out.push(`<div class="stale bad"><div><b>Could not draft this document.</b><br>${esc(st.error || 'The drafting service did not answer.')}<br>Showing generic template text — it is <b>not</b> about this property. Do not send it.</div>${btn}</div>`);
  if (stale) out.push(`<div class="stale">Entries or decisions changed since this draft.${failed ? '' : btn}</div>`);
  if (st.doc && st.doc.audit && st.doc.audit.unknownCitations.length) out.push(`<div class="stale bad">Cites ${st.doc.audit.unknownCitations.length} section(s) that are not in the code library. Check them before this leaves the office.</div>`);
  return out.join('');
}

function docFoot(key, id) {
  const st = docState(key, id); const d = st.doc; if (!d) return '';
  const a = d.audit || {};
  return `<div class="metaf fade"><span><b>Drafted</b> ${esc(st.at || '—')}</span><span><b>Source</b> ${d.source === 'ai' ? esc((d.meta && d.meta.model) || 'model') : 'built-in template'}</span>${a.codeEdition ? `<span><b>Code edition</b> ${esc(a.codeEdition)}</span>` : ''}<span><b>Reviewed and edited by</b> ${esc(CONFIG.inspector.name)} · ${esc(CONFIG.inspector.badge)}</span></div>`;
}

// ---------------- internal report ----------------
function reportView() {
  const id = S.cur, a = addrOf(id), es = entriesOf(id), st = docState('report', id), d = st.doc;
  const head = `<div class="card" style="animation-delay:0s"><h4>Inspection report</h4><div class="st"><b>Property</b><span>${esc(a.addr)}</span></div><div class="st"><b>Date</b><span>${fmtDate(todayISO())}</span></div><div class="st"><b>Inspector</b><span>${esc(CONFIG.inspector.name)} · ${esc(CONFIG.inspector.badge)}</span></div><div class="st"><b>Entries</b><span>${es.length} · ${es.filter(e => e.kind === 'violation').length} violation(s), ${es.filter(e => e.kind === 'compliance').length} compliant, ${es.filter(e => e.kind === 'note').length} note(s)</span></div>${d && d.headline ? `<div class="st"><b>Outcome</b><span>${esc(d.headline)}</span></div>` : ''}</div>`;
  const body = docBanner('report', id) + head
    + (d ? d.sections.map((s, i) => docSection(s, i, 'card', .08 + i * .06)).join('') : st.status === 'pending' ? '' : '<div class="hint">Nothing drafted yet.</div>')
    + docFoot('report', id);
  return frame('Internal report', a.addr, body, `<div class="row2"><button class="btn ghost" data-back>Back</button><button class="btn" id="export" ${d ? '' : 'disabled'}>Export</button></div>`);
}
function reportAfter() {
  const id = S.cur, st = docState('report', id);
  if (st.status === 'idle') { genDoc('report', id); return; }
  const rd = $('#refresh'); if (rd) rd.onclick = () => genDoc('report', id);
  if (st.doc) wireEdits(st.doc, () => { st.edited = true; });
  const ex = $('#export'); if (ex) ex.onclick = () => exportDoc('report', id);
}

// A real file, rather than a toast claiming one was saved. Plain text, because
// a PDF needs a renderer the project does not have yet (see TODO.md §7).
function docToText(key, id) {
  const d = docState(key, id).doc, a = addrOf(id); if (!d) return '';
  const L = [];
  if (key === 'report') L.push(`INTERNAL INSPECTION REPORT`, `${a.addr}${a.where ? ', ' + a.where : ''}`, `${fmtDate(todayISO())} · ${CONFIG.inspector.name} (${CONFIG.inspector.badge}) · ${CONFIG.unit}`, '', d.headline || '');
  else L.push(`Subject: ${d.subject}`, `To: ${(a.owner && a.owner.email) || '(no address on file)'}`, `From: ${CONFIG.inspector.name} <${CONFIG.inspector.email}>`, '', d.greeting);
  d.sections.forEach(s => {
    L.push('', s.heading.toUpperCase());
    if (s.type === 'prose') L.push(s.body);
    if (s.type === 'list') s.items.forEach(x => L.push('  - ' + x));
    if (s.type === 'fields') s.fields.forEach(f => L.push(`  ${f.label}: ${f.value}`));
    if (s.type === 'codes') s.codes.forEach(c => L.push(`  [${c.scope}] ${c.citation} — ${c.title}`, `      ${c.relevance}`));
  });
  if (d.closing) L.push('', d.closing, '', `${CONFIG.inspector.name} · ${CONFIG.inspector.badge}`, `${CONFIG.unit} · ${CONFIG.inspector.phone}`);
  const au = d.audit || {};
  L.push('', '---', `Drafted ${docState(key, id).at || ''} · source: ${d.source === 'ai' ? (d.meta && d.meta.model) : 'built-in template'}`, au.codeEdition ? `Code edition: ${au.codeEdition}` : '');
  return L.filter(x => x !== undefined).join('\n');
}
function exportDoc(key, id) {
  const txt = docToText(key, id); if (!txt) return;
  const name = `${key}-${addrOf(id).addr.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}-${todayISO()}.txt`;
  const url = URL.createObjectURL(new Blob([txt], { type: 'text/plain;charset=utf-8' }));
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  later(() => URL.revokeObjectURL(url), 4000);
}

// ---------------- notice to owner ----------------
function noticeView() {
  const id = S.cur, a = addrOf(id), ns = docState('notice', id), d = ns.doc;
  const es = entriesOf(id), viol = es.filter(e => e.kind === 'violation');
  const att = KB.filter(k => ns.attached.has(k.id));
  const canSend = !!d && (viol.length ? viol.some(e => e.recs.some(r => r.decision === 'in')) : true) && !!(a.owner && a.owner.email);

  // Blocks the app owns, dropped in under the section whose id names them.
  const optBlock = e => { const inc = e.recs.filter(r => r.decision === 'in'); return inc.length
    ? `<div class="ctl-row"><span class="ctl" data-deck="${e.id}">${inc.length} option${inc.length === 1 ? '' : 's'} · Edit ›</span></div>${inc.map((s, i) => `<div class="eopt">${VISUALS.has(e.id, s) ? `<div class="eph" data-vis="${VISUALS.key(e.id, s.id)}">${VISUALS.cell(e.id, s)}</div>` : ''}<b>Option ${i + 1}: ${esc(s.title)}</b><p>${esc(s.text)}</p></div>`).join('')}`
    : `<div class="slot cta" data-deck="${e.id}"><span class="cta-ic">▥</span><span class="cta-t">Choose what to offer for entry ${e.n}</span><span class="cta-ch">›</span></div>`; };
  const slots = {
    'what-to-do': () => viol.map(optBlock).join(''),
    'attached-documents': () => att.length || ns.own.length
      ? `<div class="ctl-row"><span class="ctl" data-go="kb">${att.length + ns.own.length} attached · Edit ›</span><span class="ctl" id="addOwn">+ Add your own</span></div><div class="eatts">${att.map(k => `<div class="eatt"><span class="eatt-ic">PDF</span><div><b>${esc(k.title)}</b><span>${esc(k.src)} · ${esc(k.size)}</span></div></div>`).join('')}${ns.own.map(o => `<div class="eatt"><span class="eatt-ic">PDF</span><div><b>${esc(o)}</b><span>from this device</span></div></div>`).join('')}</div>`
      : `<div class="slot cta" data-go="kb"><span class="cta-ic">📎</span><span class="cta-t">Find supporting documents</span><span class="cta-ch">›</span></div><div class="ctl-row" style="justify-content:flex-start"><span class="ctl" id="addOwn">+ Add your own</span></div>`,
  };
  const used = new Set();
  const letter = d ? `<div class="mail fade"><div class="hd"><b>${esc(d.subject || '')}</b><br>To: ${esc((a.owner && a.owner.name) || 'Owner of record')} &lt;${esc((a.owner && a.owner.email) || 'no address on file')}&gt;<br>From: ${esc(CONFIG.inspector.name)}, ${esc(CONFIG.unit)} · ${esc(CONFIG.inspector.email)}</div>
    <p class="ed" data-path="greeting">${esc(d.greeting || '')}</p>
    ${d.sections.map((s, i) => { used.add(s.id); return docSection(s, i, 'msec') + (slots[s.id] ? slots[s.id]() : ''); }).join('')}
    ${Object.keys(slots).filter(k => !used.has(k)).map(k => slots[k]()).join('')}
    <p class="ed" data-path="closing">${esc(d.closing || '')}</p>
    <p>${esc(CONFIG.inspector.name)} · ${esc(CONFIG.inspector.badge)}<br>${esc(CONFIG.unit)} · ${esc(CONFIG.inspector.phone)}</p></div>` : '';

  const warn = !(a.owner && a.owner.email) ? `<div class="stale bad">No mailing address is on file for this property, so this notice cannot be sent. Look the owner up on the assessor roll first.</div>` : '';
  const sentLine = ns.sent ? `<div class="stale ok">Sent to ${esc(a.owner.email)} at ${esc(ns.sentAt)}.</div>` : ns.draft ? `<div class="stale ok">Saved to drafts at ${esc(ns.draftAt)} · not sent.</div>` : '';
  const body = docBanner('notice', id) + warn + sentLine + letter
    + (!d && ns.status !== 'pending' ? '<div class="hint">Nothing drafted yet.</div>' : '') + docFoot('notice', id);
  return frame('Notice to owner', (a.owner && a.owner.email) ? 'to ' + a.owner.email : 'no recipient on file', body,
    `<div class="row2"><button class="btn ghost" id="saveDraft" ${d ? '' : 'disabled'}>Save draft</button><button class="btn" id="send" ${canSend ? '' : 'disabled'} title="${canSend ? '' : !d ? 'Nothing drafted yet' : !(a.owner && a.owner.email) ? 'No address on file for the owner' : 'Choose at least one option first'}"><span class="fill"></span><span style="position:relative">Hold to send</span></button></div>`);
}
function noticeAfter() {
  const id = S.cur, ns = docState('notice', id);
  if (ns.status === 'idle') { genDoc('notice', id); return; }
  const rd = $('#refresh'); if (rd) rd.onclick = () => genDoc('notice', id);
  if (ns.doc) wireEdits(ns.doc, () => { ns.edited = true; });
  $$('[data-deck]').forEach(b => b.onclick = () => { const e = entriesOf(id).find(x => x.id === b.dataset.deck); S.rec = e; S.recDirty = false; S.deck = { idx: e.recs.findIndex(x => !x.decision) < 0 ? 0 : e.recs.findIndex(x => !x.decision) }; S.fromNotice = true; go('deck'); });
  const ao = $('#addOwn'); if (ao) ao.onclick = () => { ns.own.push('Owner-provided document ' + (ns.own.length + 1) + '.pdf'); render(); };
  const sd = $('#saveDraft'); if (sd) sd.onclick = () => { ns.draft = true; ns.draftAt = clock(); render(); };
  const b = $('#send'); if (!b || b.disabled) return;
  const fill = b.querySelector('.fill'); let t0 = 0, raf = 0; const HOLD = 900;
  const tick = () => { const p = Math.min(1, (Date.now() - t0) / HOLD); fill.style.width = (p * 100) + '%'; if (p >= 1) { cancelAnimationFrame(raf); ns.sent = true; ns.sentAt = clock(); ns.draft = false; render(); } else raf = requestAnimationFrame(tick); };
  const start = e => { e.preventDefault(); t0 = Date.now(); raf = requestAnimationFrame(tick); }; const stop = () => { cancelAnimationFrame(raf); fill.style.width = '0'; };
  b.onpointerdown = start; b.onpointerup = stop; b.onpointerleave = stop; b.onpointercancel = stop;
}

// when the deck was opened from the notice, "back" should return there with decisions saved into the entry
const _back = back; back = function () { if (S.screen === 'deck' && S.fromNotice) { S.fromNotice = false; bump(S.cur); S.rec = null; S.recDirty = false; } _back(); };

// ---------------- kb ----------------
function kbView() { return frame('Department library', 'documents for this notice', `<div class="kbwrap"><div class="idx" id="idx"></div></div><div class="card" id="hits" style="animation-delay:.2s"><h4>Matches</h4></div>`, `<button class="btn" id="attach" disabled>Searching…</button>`); }
function kbAfter() { const ns = noticeState(); const hits = $('#hits'); const btn = $('#attach'); const row = k => `<div class="hit ${ns.attached.has(k.id) ? '' : 'off'}" data-id="${k.id}"><div class="ic">PDF</div><div><div class="t">${esc(k.title)}</div><div class="s">${esc(k.src)} · ${esc(k.size)}</div><div class="w">↳ ${esc(k.why)}</div></div><button class="chk">${ns.attached.has(k.id) ? '✓' : '○'}</button></div>`;
  const sync = () => { btn.disabled = false; btn.textContent = `Attach ${ns.attached.size} of ${KB.length} · back to notice`; };
  hits.onclick = e => { const h = e.target.closest('.hit'); if (!h) return; const id = h.dataset.id; if (ns.attached.has(id)) { ns.attached.delete(id); h.classList.add('off'); h.querySelector('.chk').textContent = '○'; } else { ns.attached.add(id); h.classList.remove('off'); h.querySelector('.chk').textContent = '✓'; } sync(); };
  btn.onclick = () => { bump(S.cur); back(); };
  if (ns.kbDone) { KB.forEach(k => hits.insertAdjacentHTML('beforeend', row(k).replace('class="hit', 'style="animation:none;opacity:1" class="hit'))); sync(); return; }
  const idx = $('#idx'); idx.innerHTML = [...KB_INDEX, ...KB_INDEX].map(l => `<div>${esc(l)}</div>`).join('');
  KB.forEach((k, i) => later(() => { ns.attached.add(k.id); hits.insertAdjacentHTML('beforeend', row(k)); idx.querySelectorAll('div').forEach((d, j) => { if (j % 3 === i % 3) d.classList.add('hl'); }); }, 700 + i * 600));
  later(() => { ns.kbDone = true; sync(); }, 700 + KB.length * 600 + 300); }

// ---------------- help overlay + keys ----------------
function renderHelp() { const sc = SPEC.screens.find(s => s.id === S.screen); const box = $('#helpbox'); if (!sc) return; box.innerHTML = `<h3>${esc(sc.name)}</h3><div class="pur">${esc(sc.purpose)}</div><table>${sc.affordances.map(a => `<tr><td>${esc(a[0])}</td><td>${esc(a[1])}</td><td>${esc(a[2])}</td></tr>`).join('')}</table>${sc.edge.length ? `<div class="edge">${sc.edge.map(e => '· ' + esc(e)).join('<br>')}</div>` : ''}`; }
$('#helpbtn').onclick = () => $('#helpbox').classList.toggle('on');
document.addEventListener('keydown', e => { if (e.target.tagName === 'TEXTAREA' || e.target.tagName === 'INPUT' || e.target.isContentEditable) return; if (e.key === 'r' || e.key === 'R') { S = fresh(); render(); return; } if (S.screen === 'deck') { if (e.key === 'ArrowRight') swipe(true); if (e.key === 'ArrowLeft') swipe(false); } if (S.screen === 'camera' && e.key === ' ') { e.preventDefault(); const sh = $('#shutter'); if (sh && !$('#cam').classList.contains('snap')) sh.click(); } });
setInterval(() => { const sb = document.querySelector('.sb span'); if (sb) sb.textContent = clock(); }, 15000);
// demo seed: nothing on the route yet (the inspector types addresses); press R to reset.
// Past site lookups come back from localStorage first, so they are in the typeahead.
restoreLookups();
render();
