// fire-geo, the Technology view: one photograph, a pin you move, and the fire code that applies where the pin is.
// Logic and data live in lib/ and data/ (see API.md). This file is only the screen.
//
// What is on the screen: the photograph with its correction, the map with the pin, the verdict, and one line per
// rule. The chosen rule shows its own text. Everything else (history, sources, caveats) is behind "Sources and notes".
//
// Motion rules this file is built around (STYLE.md):
//   - dragging is direct: the pin and the divider are written in the pointer handler, with no easing;
//   - after a move only what changed is touched: rows are keyed by meaning and patched in place, never rebuilt;
//   - text that changes crossfades in two fixed slots, numbers count, moved things glide (FLIP), new rows rise once;
//   - a card whose content changes size has its height interpolated, never snapped;
//   - every transition can be interrupted and reversed, so a fast scrub across a town line never queues or flickers;
//   - the statewide block is rendered when the photograph changes and at no other time.
(function () {
'use strict';
const { geo, codes, solutions, beforeAfter, emphasis, pinDrag } = window.FireGeo;
const REDUCE = window.matchMedia('(prefers-reduced-motion: reduce)');
const FLAT = 'cubic-bezier(.22,1,.36,1)', NS = 'http://www.w3.org/2000/svg';
const $ = sel => document.querySelector(sel);
const h = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const svgEl = (tag, attrs, parent) => { const n = document.createElementNS(NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); if (parent) parent.append(n); return n; };
const Q = new URLSearchParams(location.search);

// ------------------------------------------------------------------ state
const startPin = (() => { const p = Q.get('pin'); if (p && geo.pins[p]) return geo.pins[p]; if (p && /^-?[\d.]+,-?[\d.]+$/.test(p)) return p.split(',').map(Number); return geo.pins.ross; })();
const S = {
  photo: Q.get('photo') === 'sprinkler' ? 'sprinkler' : 'ladder',
  lon: startPin[0], lat: startPin[1], place: null, scope: null, classes: [], hazardLabel: '', zone: null, zoneName: '',
  region: geo.regionOf(startPin[0], startPin[1]),      // which of the two maps is on screen: 'rossvalley' | 'berkeley'
  distance: Q.has('d') ? Math.max(0, Math.min(150, Math.round(+Q.get('d') || 0))) : codes.DISTANCE.default,
  sol: { ladder: Q.get('photo') !== 'sprinkler' && Q.get('sol') ? Q.get('sol') : 'a', sprinkler: 'a' },
  selected: Q.get('sel') || null, picked: Q.has('sel'),
  showChange: Q.get('change') === '1',                 // "Show what changed" on the photograph: off until asked for
};
const photoInfo = id => codes.PHOTOS.find(p => p.id === id);

// ------------------------------------------------------------------ small motion helpers
// Two fixed slots that crossfade. Setting the text that is fading out simply reverses the fade, so a fast
// back-and-forth never shows a blank frame and never adds or removes a node.
function makeSwap(host, text, block, fit) {
  host.textContent = ''; host.classList.add('swap'); if (block) host.classList.add('is-block'); if (fit) host.classList.add('is-fit');   // is-fit: the box is the size of the words on show (app.css)
  const a = h('span', 'swap-item on', text || ''), b = h('span', 'swap-item', ''); b.setAttribute('aria-hidden', 'true');
  host.append(a, b); host.__sw = { on: a, off: b }; return host;
}
// Two strings are alike when they are nearly the same length and mostly the same characters in the same places: a
// number that moved, a suffix that changed. Those crossfade in place (a morph). Anything else is a replacement: the
// old words leave before the new ones arrive, so two different sentences are never legible in one spot.
const alike = (a, b) => { const n = Math.max(a.length, b.length); if (Math.abs(a.length - b.length) > 2) return false; let same = 0; for (let i = 0, m = Math.min(a.length, b.length); i < m; i++) if (a[i] === b[i]) same++; return same >= n * 0.75; };
function setSwap(host, text, opt) {
  const s = host.__sw, cur = s.on.textContent; text = text || '';
  if (cur === text) return false;
  host.classList.toggle('is-replace', ((opt && opt.mode) || (!cur || !text || alike(cur, text) ? 'morph' : 'replace')) === 'replace');
  if (s.off.textContent !== text) s.off.textContent = text;
  s.on.classList.remove('on'); s.on.setAttribute('aria-hidden', 'true'); s.off.classList.add('on'); s.off.removeAttribute('aria-hidden');
  host.__sw = { on: s.off, off: s.on }; return true;
}
// Numbers count from what is on screen to the new value (about 400 ms, ease-out, tabular digits).
function countTo(node, to) {
  const from = node.__shown != null ? node.__shown : (parseFloat(node.textContent) || 0);
  cancelAnimationFrame(node.__raf);
  if (from === to || REDUCE.matches) { node.textContent = String(to); node.__shown = to; return; }
  const t0 = performance.now();
  (function step(now) { const k = Math.min(1, (now - t0) / 400), e = 1 - Math.pow(1 - k, 3), v = Math.round(from + (to - from) * e); if (node.__shown !== v) { node.textContent = String(v); node.__shown = v; } if (k < 1) node.__raf = requestAnimationFrame(step); })(t0);
}
function setNumber(node, v) { cancelAnimationFrame(node.__raf); if (node.__shown !== v) { node.textContent = String(v); node.__shown = v; } }

// Keyed list. Nodes whose key is still wanted stay where they are (the same node, untouched unless their content
// changed). New keys rise in, missing keys sink out of flow, and anything that ends up somewhere else glides there.
// `before` runs after the rows have been measured and before they change: anything it resizes above the list is part
// of the same move, so the rows glide to make room instead of jumping.
function reconcile(list, items, make, patch, animate, before) {
  const wanted = new Set(items.map(it => it.key)), live = [...list.children].filter(n => !n.__leaving), first = new Map();
  const moving = animate && !REDUCE.matches;
  if (moving) live.forEach(n => first.set(n, n.getBoundingClientRect().top));
  if (before) before();
  const byKey = new Map(); [...list.children].forEach(n => byKey.set(n.dataset.key, n));
  const stays = n => { while (n && (n.__leaving || !wanted.has(n.dataset.key))) n = n.nextElementSibling; return n; };
  const keep = new Set(), fresh = new Set();
  let cursor = stays(list.firstElementChild);
  items.forEach(it => {
    let n = byKey.get(it.key);
    if (n && n.__leaving) { revive(n); fresh.add(n); patch(n, it); }
    else if (!n) { n = make(it); n.dataset.key = it.key; fresh.add(n); }
    else patch(n, it);
    keep.add(n);
    if (cursor === n) cursor = stays(n.nextElementSibling); else list.insertBefore(n, cursor);
  });
  let gone = 0, moved = false;
  // each row that leaves stays where it was drawn before anything changed (measured then: taking one row out of the
  // flow moves the ones after it, so they must not be measured one by one now)
  live.forEach(n => { if (!keep.has(n)) { leave(list, n, moving, first.get(n)); gone = 100; } });
  if (!moving) return;
  keep.forEach(n => { if (n.__glide) { n.__glide.cancel(); n.__glide = null; } });
  keep.forEach(n => {
    if (fresh.has(n)) return; const from = first.get(n); if (from == null) return;
    const dy = from - n.getBoundingClientRect().top;
    if (Math.abs(dy) > 0.5) { moved = true; n.__glide = n.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 220, delay: gone, easing: FLAT, fill: 'backwards' }); n.__glide.onfinish = () => { n.__glide = null; }; }
  });
  // in order: the rows that leave go first (100 ms), then the rows that stay glide to their places, then the new rows
  // rise in one after another. A row never shows where another row is still legible.
  let i = 0; fresh.forEach(n => enter(n, gone + (moved ? 160 : 0) + 25 * i++));
}
function leave(list, n, moving, was) {
  if (!moving) { n.remove(); return; }
  const top = (was != null ? was : n.getBoundingClientRect().top) - list.getBoundingClientRect().top, op = getComputedStyle(n).opacity;
  if (n.__glide) { n.__glide.cancel(); n.__glide = null; } if (n.__enter) { n.__enter.cancel(); n.__enter = null; }
  n.__leaving = true; n.classList.add('is-leaving'); n.style.top = top + 'px';
  n.__leave = n.animate([{ opacity: op, transform: 'translateY(0)' }, { opacity: 0, transform: 'translateY(4px)' }], { duration: 100, easing: 'linear', fill: 'forwards' });
  n.__leave.onfinish = () => { if (n.__leaving) n.remove(); };
}
function revive(n) {                                  // it came back before it was gone: pick it up from where it is
  const op = +getComputedStyle(n).opacity;
  n.__leave.onfinish = null; n.__leave.cancel(); n.__leave = null; n.__leaving = false; n.classList.remove('is-leaving'); n.style.top = ''; n.__from = op;
}
function enter(n, delay) {                            // an entrance plays once, when the thing first appears (after `delay`: see reconcile)
  if (REDUCE.matches) return; const from = n.__from != null ? n.__from : 0; n.__from = null;
  n.__enter = n.animate([{ opacity: from, transform: 'translateY(' + (8 * (1 - from)).toFixed(1) + 'px)' }, { opacity: 1, transform: 'none' }], { duration: 180, delay: from ? 0 : (delay || 0), easing: FLAT, fill: 'backwards' });
  n.__enter.onfinish = () => { n.__enter = null; };
}
// A box whose content changes size: its height travels from where it is to the new height (about 250 ms, ease-out).
function resizeWith(box, mutate) {
  const before = box.getBoundingClientRect().height;
  if (box.__size) { box.__size.cancel(); box.__size = null; }
  mutate();
  const after = box.getBoundingClientRect().height;
  if (REDUCE.matches || Math.abs(after - before) < 0.5) return;
  box.__size = box.animate([{ height: before + 'px' }, { height: after + 'px' }], { duration: 250, easing: FLAT });
  box.__size.onfinish = box.__size.oncancel = () => { box.__size = null; };
}
// A thing that has to follow a layout change below it: it glides from where it was drawn to where it now belongs.
function follow(node, mutate) {
  const moving = !REDUCE.matches, from = moving ? node.getBoundingClientRect().top : 0;
  mutate();
  if (!moving) return;
  if (node.__glide) { node.__glide.cancel(); node.__glide = null; }
  const dy = from - node.getBoundingClientRect().top;
  if (Math.abs(dy) > 0.5) { node.__glide = node.animate([{ transform: 'translateY(' + dy + 'px)' }, { transform: 'none' }], { duration: 250, easing: FLAT }); node.__glide.onfinish = () => { node.__glide = null; }; }
}

// ------------------------------------------------------------------ map
// One world, two regions (lib/geo.js): the Ross Valley and Berkeley. At rest the box shows 1344 x 1289 world pixels
// of one of them. The camera is the world point at the centre of the box and a zoom (1 at rest). Each region is one
// element that takes one transform from the camera, so moving the camera never touches layout, and the pin is drawn
// on top at its own size, at the camera's projection of where it is.
const mapBox = $('#mapBox'), world = $('#mapWorld'), BW = 1344, BH = 1289, REG = geo.regions;
const regionEls = {}, areaEls = {}, nameEls = {}, chipEls = {};
const homeCam = id => { const v = REG[id].view; return { x: (v.x0 + v.x1) / 2, y: (v.y0 + v.y1) / 2, z: 1 }; };
let cam = homeCam(S.region), pinEl, pinPlace, pinZone, boxW = 0, boxH = 0, flight = null;

const ringArea = r => { let a = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) a += r[j][0] * r[i][1] - r[i][0] * r[j][1]; return a; };
const wound = (r, positive) => ((ringArea(r) > 0) === positive ? r : r.slice().reverse());
// Every ring wound one way and every hole the other, so with the non-zero rule overlaps fill once and holes stay open.
const zonePath = zs => geo.path(zs.reduce((all, z) => all.concat(z.rings.map(r => wound(r, true)), z.holes.map(r => wound(r, false))), []));
const stipple = (defs, id, step, r, alpha) => { const p = svgEl('pattern', { id, patternUnits: 'userSpaceOnUse', width: step, height: step }, defs); [[step / 4, step / 4], [step * 3 / 4, step * 3 / 4]].forEach(c => svgEl('circle', { cx: c[0], cy: c[1], r, fill: 'rgba(38,42,49,' + alpha + ')' }, p)); };

function buildRegion(r) {
  const el = h('div', 'map-region'); el.dataset.region = r.id;
  el.style.left = ((r.x - 96) / BW * 100) + '%'; el.style.top = (r.y / BH * 100) + '%'; el.style.width = (r.w / BW * 100) + '%'; el.style.height = (r.h / BH * 100) + '%';      // its place in the world
  world.append(el); regionEls[r.id] = el;
  const base = h('img', 'map-layer map-base'); base.alt = ''; base.draggable = false; base.src = r.src; el.append(base);
  const layer = cls => svgEl('svg', { class: 'map-layer ' + cls, viewBox: r.x + ' ' + r.y + ' ' + r.w + ' ' + r.h, preserveAspectRatio: 'none', 'aria-hidden': 'true' }, el);
  const mine = geo.areas.filter(a => a.region === r.id && a.rings.length), hz = layer('map-hazard'), defs = svgEl('defs', {}, hz);
  if (r.id === 'rossvalley') {
    // Mapped fire hazard zones and WUI areas (Ross Valley Fire map): one shape, a soft tint with a fine stipple.
    // This is the same geometry geo.hazardAt() tests, so what is drawn is what is "in".
    stipple(defs, 'stipple', 20, 2.5, .36);
    const ross = geo.areas.find(a => a.id === 'ross');
    const d = zonePath([{ rings: ross.rings, holes: [] }].concat(geo.hazardZones.filter(z => z.town === 'san_anselmo' || z.town === 'fairfax')));
    svgEl('path', { class: 'zone-tint', d, 'fill-rule': 'nonzero' }, hz); svgEl('path', { class: 'zone-dots', id: 'zoneShape', d, 'fill-rule': 'nonzero' }, hz);
  } else {
    // Berkeley (the City's fire map): three zones, in the order geo.hazardAt() tests them. High is a plain tint, the
    // Very High zone is dotted like the Ross Valley zones (the local rules bite there), and the two mitigation areas
    // (Zone 0) are darker with a denser dot. Each has its edge drawn. The Very High dots are masked out where a
    // mitigation area lies over them, and everything is clipped to the city limit, so every drawn pixel is the zone
    // the hit test returns.
    const B = geo.hazardZones.filter(z => z.town === r.id), d = { high: zonePath(B.filter(z => z.cls === 'high')), very: zonePath(B.filter(z => z.cls === 'very-high')), mit: zonePath(B.filter(z => z.cls === 'mitigation')) };
    // Its own patterns: a pattern that lives in the other region's picture is hidden whenever that picture is.
    stipple(defs, 'stippleVery', 20, 2.5, .36); stipple(defs, 'stippleDense', 12, 2.3, .5);
    svgEl('path', { id: 'limitShape', d: geo.path(mine.find(a => a.id === 'berkeley').rings) }, svgEl('clipPath', { id: 'limitClip' }, defs));
    const mask = svgEl('mask', { id: 'notMitigation', maskUnits: 'userSpaceOnUse', x: r.x, y: r.y, width: r.w, height: r.h }, defs);
    svgEl('rect', { x: r.x, y: r.y, width: r.w, height: r.h, fill: '#fff' }, mask); svgEl('path', { d: d.mit, fill: '#000' }, mask);
    const g = svgEl('g', { 'clip-path': 'url(#limitClip)' }, hz);
    svgEl('path', { class: 'zone-tint is-high', id: 'zoneHigh', d: d.high }, g);
    const vh = svgEl('g', { mask: 'url(#notMitigation)' }, g); svgEl('path', { class: 'zone-tint', d: d.very }, vh); svgEl('path', { class: 'zone-dots is-very', id: 'zoneVeryHigh', d: d.very }, vh);
    svgEl('path', { class: 'zone-tint is-mitigation', d: d.mit }, g); svgEl('path', { class: 'zone-dots is-mitigation', id: 'zoneMitigation', d: d.mit }, g);
    svgEl('path', { class: 'zone-edge', d: d.high }, g); svgEl('path', { class: 'zone-edge', d: d.very }, g); svgEl('path', { class: 'zone-edge is-mitigation', d: d.mit }, g);
  }
  // every limit as a hairline; the entered one is drawn again in blue on its own layer so it can ease in and out
  const lines = layer('map-lines');
  mine.forEach(a => svgEl('path', { d: geo.path(a.rings), class: a.kind === 'town' ? 'is-town' : 'is-other' }, lines));
  mine.forEach(a => { const s = layer('map-area' + (a.kind === 'town' ? '' : ' is-other')); svgEl('path', { d: geo.path(a.rings) }, s); areaEls[a.id] = s; });
  mine.filter(a => a.kind === 'town' && a.labelAt).forEach(a => {
    const xy = geo.toXY(a.labelAt[0], a.labelAt[1]), n = h('span', 'map-name', a.name);
    n.style.left = ((xy[0] - r.x) / r.w * 100) + '%'; n.style.top = ((xy[1] - r.y) / r.h * 100) + '%'; el.append(n); nameEls[a.id] = n;
  });
}
function buildMap() {
  for (const id in REG) buildRegion(REG[id]);
  pinEl = h('div', 'map-pin'); pinEl.append(h('span', 'pin-halo'), h('span', 'pin-dot'), h('span', 'pin-hit'));
  const tag = h('div', 'pin-tag'); pinPlace = makeSwap(h('span', 'pin-place'), ''); pinZone = makeSwap(h('span', 'pin-zone'), ''); tag.append(pinPlace, pinZone); pinEl.append(tag);
  mapBox.append(pinEl);
  // Two rows, on purpose: the places on the map in front of you, then the far-away ones (a different region, reached
  // by a flight). A new far-away place joins the second row.
  const chips = $('#chips'), rows = { rossvalley: h('div', 'chips-row'), far: h('div', 'chips-row is-far') }; chips.append(rows.rossvalley, rows.far);
  [['ross', 'Ross'], ['san_anselmo', 'San Anselmo'], ['fairfax', 'Fairfax'], ['marin', 'Unincorporated'], ['berkeley', 'Berkeley']].forEach(([id, text]) => {
    if (!geo.pins[id]) return;
    const b = h('button', 'shell-pill', text); b.type = 'button'; b.dataset.place = id; b.setAttribute('aria-pressed', 'false'); b.addEventListener('click', () => goTo(id));
    (geo.regionOf(geo.pins[id][0], geo.pins[id][1]) === 'rossvalley' ? rows.rossvalley : rows.far).append(b); chipEls[id] = b;
  });
  if (!rows.far.children.length) rows.far.remove();
  applyCam(cam); paintWhere();
  // the corridor picture and the other region's picture are fetched and decoded once the page is idle, before any trip
  if (geo.corridor) (window.requestIdleCallback ? requestIdleCallback(loadCorridor, { timeout: 1200 }) : setTimeout(loadCorridor, 300));
}
const ZONE_WORDS = { wui: 'WUI area', high: 'High hazard zone', moderate: 'Moderate hazard zone', 'very-high': 'Very High hazard zone' };
function paintMap() {
  for (const id in areaEls) areaEls[id].classList.toggle('on', id === S.place);
  for (const id in nameEls) nameEls[id].classList.toggle('on', id === S.place);
  for (const id in chipEls) { const on = String(id === S.place); if (chipEls[id].getAttribute('aria-pressed') !== on) chipEls[id].setAttribute('aria-pressed', on); }
  setSwap(pinPlace, codes.place(S.place).short);
  setSwap(pinZone, S.scope === 'in' ? (S.zoneName || ZONE_WORDS[S.classes[0]]) : S.scope === 'out' ? 'Outside the hazard zones' : '');
}

// ---- the camera
// ONE transform, on the world. Everything in it (the corridor picture, its names, the two regional pictures with
// their layers) sits at a fixed place in world pixels, so the pictures register on each other by construction and a
// frame of a trip writes one transform, a few opacities and the pin.
function applyCam(c) {
  world.style.transform = 'translate(' + ((.5 - (c.x - 96) / BW * c.z) * 100).toFixed(4) + '%,' + ((.5 - c.y / BH * c.z) * 100).toFixed(4) + '%) scale(' + c.z.toFixed(5) + ')';
  // The detail of a region belongs to its own scale. Pulled back, the regional pictures (with their limits, zones and
  // names) dissolve into the corridor picture under them, and the corridor's town names come up; coming down on a
  // region its detail arrives again. A pure function of the zoom, so a trip can be turned round at any point.
  const u = Math.max(0, Math.min(1, (c.z - .86) / .12)), d = +(u * u * (3 - 2 * u)).toFixed(3);
  if (d !== applyCam.detail) { applyCam.detail = d; for (const id in regionEls) regionEls[id].style.opacity = d === 1 ? '' : String(d); }
  // the corridor's names come up only once the regional names have gone, so no place is ever named twice
  const v = Math.max(0, Math.min(1, (.8 - c.z) / .1)), names = +(v * v * (3 - 2 * v)).toFixed(3);
  if (farNames && names !== applyCam.names) { applyCam.names = names; farNames.style.opacity = String(names); }
}
function paintWhere() { if (window.Shell && window.Shell.where) window.Shell.where(document.body.dataset.view === 'inspectors' ? REG.rossvalley.name : REG[S.region].name); }
const fracOf = (c, xy) => [(xy[0] - c.x) * c.z / BW + .5, (xy[1] - c.y) * c.z / BH + .5];           // world pixel -> fraction of the box
const worldAt = (c, f) => [c.x + (f[0] - .5) * BW / c.z, c.y + (f[1] - .5) * BH / c.z];              // and back
const inView = (id, xy) => { const v = REG[id].view; return [Math.max(v.x0 + 36, Math.min(v.x1 - 36, xy[0])), Math.max(v.y0 + 36, Math.min(v.y1 - 36, xy[1]))]; };

// ---- the corridor picture: everything a trip between the two regions can pass over (tools/corridor-draw.js)
// It is fetched and decoded when the page is idle, then drawn ONCE into a canvas with the page's own map treatment
// baked in (the same grey, strength and multiply the regional pictures get from CSS). A canvas is one texture that is
// always there: nothing is decoded, rastered or fetched during a trip, and nothing can show up late.
let corridor = null, farNames = null;
function bakeCorridor() {
  const cv = corridor.el, g = cv.getContext('2d', { alpha: false }), like = getComputedStyle((regionEls.berkeley || regionEls.rossvalley).querySelector('.map-base')), ground = getComputedStyle(mapBox).backgroundColor;
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; g.fillStyle = ground; g.fillRect(0, 0, cv.width, cv.height);
  g.globalCompositeOperation = 'multiply'; g.globalAlpha = +like.opacity; g.filter = like.filter; g.drawImage(corridor.img, 0, 0);
  g.globalCompositeOperation = 'source-over'; g.globalAlpha = 1; g.filter = 'none'; corridor.ground = ground; cv.dataset.ready = '1';
}
function loadCorridor() {
  const c = geo.corridor; if (!c || corridor) return;
  const place = (el, x, y, w, h2) => { el.style.left = ((x - 96) / BW * 100) + '%'; el.style.top = (y / BH * 100) + '%'; el.style.width = (w / BW * 100) + '%'; el.style.height = (h2 / BH * 100) + '%'; };
  const cv = h('canvas', 'map-corridor'); cv.width = c.w; cv.height = c.h; cv.setAttribute('aria-hidden', 'true'); place(cv, c.x, c.y, c.worldW, c.worldH); world.prepend(cv);
  farNames = h('div', 'map-far'); farNames.setAttribute('aria-hidden', 'true');
  c.places.forEach(p => { const xy = geo.toXY(p.lon, p.lat), n = h('span', 'map-name' + (p.kind === 'water' ? ' is-water' : ''), p.name); n.style.left = ((xy[0] - 96) / BW * 100) + '%'; n.style.top = (xy[1] / BH * 100) + '%'; farNames.append(n); });
  cv.after(farNames);
  const img = new Image(); img.decoding = 'async'; img.src = c.src;
  corridor = { el: cv, img, done: false, ok: false, ground: '' };
  const others = Object.values(regionEls).map(el => el.querySelector('.map-base')).map(b => (b.decode ? b.decode().catch(() => {}) : null));
  corridor.ready = Promise.all([img.decode(), ...others]).then(() => { bakeCorridor(); corridor.ok = true; }, () => {}).then(() => { corridor.done = true; return corridor.ok; });
  // the look can be switched without a reload (the Gleb kit): the ground colour changes, so bake again
  new MutationObserver(() => { if (corridor.ok && getComputedStyle(mapBox).backgroundColor !== corridor.ground) bakeCorridor(); }).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
}

// The pin. Pressing away from it slides it to the pointer; from then on its transform is written straight from the
// pointer (lib/pindrag.js). The hit test runs once per frame, on the position the pin is drawn at.
let hitRaf = 0, glideRaf = 0, pinHold = null;
function placePin() {
  const f = fracOf(cam, geo.toXY(S.lon, S.lat)), x = f[0] * boxW, y = f[1] * boxH;
  pinEl.style.transform = 'translate3d(' + x.toFixed(2) + 'px,' + y.toFixed(2) + 'px,0)';
  const low = y < 52; if (pinEl.__low !== low) { pinEl.__low = low; pinEl.classList.toggle('is-low', low); }
  const side = x > boxW - 96 ? 'east' : x < 96 ? 'west' : '';                                         // keep the label inside the map
  if (pinEl.__side !== side) { pinEl.__side = side; pinEl.classList.toggle('is-east', side === 'east'); pinEl.classList.toggle('is-west', side === 'west'); }
}
function setPin(lon, lat, now) {
  const xy = inView(S.region, geo.toXY(lon, lat)), p = geo.toLonLat(xy[0], xy[1]);
  S.lon = p[0]; S.lat = p[1]; placePin();
  if (now) { cancelAnimationFrame(hitRaf); hitRaf = 0; locate(); } else if (!hitRaf) hitRaf = requestAnimationFrame(() => { hitRaf = 0; locate(); });
}
function stopGlide() { if (glideRaf) { cancelAnimationFrame(glideRaf); glideRaf = 0; } }
function glideTo(lon, lat) {                           // a place chip in the region on screen: the pin travels there and stops, no overshoot
  stopGlide(); if (pinHold) pinHold.stop(); if (REDUCE.matches) return setPin(lon, lat, true);
  const a = geo.toXY(S.lon, S.lat), b = geo.toXY(lon, lat), px = Math.hypot(b[0] - a[0], b[1] - a[1]) * (boxW / BW), dur = Math.max(260, Math.min(640, px * 1.7)), t0 = performance.now();
  (function step(now) { const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3), p = geo.toLonLat(a[0] + (b[0] - a[0]) * e, a[1] + (b[1] - a[1]) * e); setPin(p[0], p[1], true); glideRaf = k < 1 ? requestAnimationFrame(step) : 0; })(t0);
}

// ---- the trip between the two regions
// A fly-to: pull back a little, slide across the map, come down (van Wijk and Nuij, "Smooth and efficient zooming and
// panning", 2003). RHO sets how far it pulls back: 0.904 takes the full trip to 0.52 of the regional scale, enough for
// the 28 km to read as travel while the Bay, the bridge and the towns stay legible as they pass. It never goes under
// 0.5, which is also what the corridor picture is cut for. at(s) is the camera at s in 0..1; len is the path's length.
const RHO = 0.904, RHO2 = RHO * RHO, RHO4 = RHO2 * RHO2;
function zoomPath(a, b) {
  const w0 = BW / a.z, w1 = BW / b.z, dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
  if (d2 < 1) { const L = Math.log(w1 / w0) / RHO; return { len: Math.abs(L), at: s => ({ x: b.x, y: b.y, z: BW / (w0 * Math.exp(RHO * s * L)) }) }; }
  const d1 = Math.sqrt(d2), b0 = (w1 * w1 - w0 * w0 + RHO4 * d2) / (2 * w0 * RHO2 * d1), b1 = (w1 * w1 - w0 * w0 - RHO4 * d2) / (2 * w1 * RHO2 * d1);
  const r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0), r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1), L = (r1 - r0) / RHO, c0 = Math.cosh(r0), s0 = Math.sinh(r0);
  return { len: L, at: s => { const q = RHO * s * L + r0, u = w0 / (RHO2 * d1) * (c0 * Math.tanh(q) - s0); return { x: a.x + u * dx, y: a.y + u * dy, z: Math.max(.5, BW / (w0 * c0 / Math.cosh(q))) }; } };
}
const FULL = (() => { const ids = Object.keys(REG); return ids.length > 1 ? zoomPath(homeCam(ids[0]), homeCam(ids[1])).len : 1; })();
// One trip: from the camera and the pin as they are now, to a region at rest with the pin on its landing spot.
// pose(k) draws the trip at time k in 0..1. The pin keeps its place on the screen, drifting to where it will land,
// so it travels with the camera and settles with no overshoot. Nothing is located on the way: the panel changes
// once, on landing.
function makeTrip(region, lon, lat) {
  const to = homeCam(region), land = inView(region, geo.toXY(lon, lat)), from = { x: cam.x, y: cam.y, z: cam.z }, path = zoomPath(from, to);
  const f0 = fracOf(from, geo.toXY(S.lon, S.lat)), f1 = fracOf(to, land);
  return { region, to, land, dur: Math.max(700, Math.min(2000, 1800 * path.len / FULL)),
    pose(k) { const e = k * k * (3 - 2 * k); cam = k >= 1 ? to : path.at(e); applyCam(cam); const p = worldAt(cam, [f0[0] + (f1[0] - f0[0]) * e, f0[1] + (f1[1] - f0[1]) * e]), ll = geo.toLonLat(p[0], p[1]); S.lon = ll[0]; S.lat = ll[1]; placePin(); } };
}
function land(trip) { flight = null; mapBox.classList.remove('is-flying'); cam = trip.to; S.region = trip.region; applyCam(cam); paintWhere(); const p = geo.toLonLat(trip.land[0], trip.land[1]); setPin(p[0], p[1], true); }
// No travel (reduced motion, or the corridor picture could not be loaded): the two maps crossfade where they are.
// The camera moves at once; the picture being left is held in its old place on the screen while it fades.
function swapInPlace(trip) {
  const from = S.region, dx = trip.to.x - cam.x, dy = trip.to.y - cam.y, out = regionEls[from], inn = regionEls[trip.region];
  land(trip);
  if (from === trip.region || !out.animate) return;
  out.style.transform = 'translate(' + (dx / REG[from].w * 100).toFixed(4) + '%,' + (dy / REG[from].h * 100).toFixed(4) + '%)';
  const a = out.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 220, easing: FLAT, fill: 'forwards' });      // held at 0 until it has been put back, so it cannot flash
  a.onfinish = () => { out.style.transform = ''; a.cancel(); }; a.oncancel = () => { out.style.transform = ''; };
  inn.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 220, easing: FLAT });
}
let waiting = null;
function flyTo(region, lon, lat, chip) {
  stopGlide(); if (pinHold) pinHold.stop(); cancelAnimationFrame(hitRaf); hitRaf = 0;
  if (REDUCE.matches || !corridor) { if (flight) cancelAnimationFrame(flight.raf); return swapInPlace(makeTrip(region, lon, lat)); }
  if (!corridor.done) {                               // pressed before the corridor picture is ready: the pill shows it is working, then the trip starts
    if (waiting && waiting.chip) { waiting.chip.classList.remove('is-working'); waiting.chip.removeAttribute('aria-busy'); }
    const mine = waiting = { chip }; if (chip) { chip.classList.add('is-working'); chip.setAttribute('aria-busy', 'true'); }
    corridor.ready.then(() => { if (waiting !== mine) return; waiting = null; if (chip) { chip.classList.remove('is-working'); chip.removeAttribute('aria-busy'); } flyTo(region, lon, lat); });
    return;
  }
  if (flight) cancelAnimationFrame(flight.raf);
  const trip = makeTrip(region, lon, lat);
  if (!corridor.ok) return swapInPlace(trip);          // never fly over bare ground
  const t0 = performance.now(); flight = { trip, raf: 0 }; mapBox.classList.add('is-flying');
  const step = now => { const k = Math.max(0, Math.min(1, (now - t0) / trip.dur)); if (k >= 1) return land(trip); trip.pose(k); flight.raf = requestAnimationFrame(step); };
  trip.pose(0); flight.raf = requestAnimationFrame(step);
}
function endFlight() { if (flight) { cancelAnimationFrame(flight.raf); land(flight.trip); } }          // land at once (the view was hidden)
// A place chip: glide inside the region on screen, fly when the place is in the other one.
function goTo(id) { const p = geo.pins[id], region = geo.regionOf(p[0], p[1]); if (flight || waiting || region !== S.region) flyTo(region, p[0], p[1], chipEls[id]); else glideTo(p[0], p[1]); }
// Put the pin anywhere at once, in either region (tests, the address bar).
function jumpTo(lon, lat) {
  stopGlide(); if (pinHold) pinHold.stop(); if (flight) { cancelAnimationFrame(flight.raf); flight = null; mapBox.classList.remove('is-flying'); }
  const region = geo.regionOf(lon, lat); if (region !== S.region || cam.z !== 1) { S.region = region; cam = homeCam(region); applyCam(cam); paintWhere(); }
  setPin(lon, lat, true);
}
function lonLatAt(cx, cy) { const r = mapBox.getBoundingClientRect(), p = worldAt(cam, [(cx - r.left) / r.width, (cy - r.top) / r.height]); return geo.toLonLat(p[0], p[1]); }
function toClient(lon, lat) { const r = mapBox.getBoundingClientRect(), f = fracOf(cam, geo.toXY(lon, lat)); return [r.left + f[0] * r.width, r.top + f[1] * r.height]; }
function wireMap() {
  // Press anywhere: the pin slides to the pointer (about 160 ms), then sticks to it for the rest of the hold. Press on
  // the pin itself and it is simply held. Each frame of the slide goes through setPin, so the town, the lit area and
  // the panel follow the pin where it is drawn. While the map is flying between regions a press does nothing.
  pinHold = pinDrag(mapBox, {
    where: () => { const r = pinEl.getBoundingClientRect(); return [r.left, r.top]; },
    move: (x, y, phase) => { const p = lonLatAt(x, y); setPin(p[0], p[1], phase !== 'drag'); },
    start: () => { if (flight || waiting) return false; stopGlide(); mapBox.focus({ preventScroll: true }); pinEl.classList.add('is-held'); },
    end: () => pinEl.classList.remove('is-held'),
    reduced: () => REDUCE.matches,
  });
  mapBox.addEventListener('keydown', e => {
    const k = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key]; if (!k || flight || waiting) return;
    e.preventDefault(); stopGlide(); pinHold.stop(); const step = (e.shiftKey ? 32 : 8) * (BW / (boxW || BW)), xy = geo.toXY(S.lon, S.lat), p = geo.toLonLat(xy[0] + k[0] * step, xy[1] + k[1] * step); setPin(p[0], p[1], true);
  });
  const measure = () => { if (!mapBox.clientWidth) return; boxW = mapBox.clientWidth; boxH = mapBox.clientHeight; placePin(); };
  if (window.ResizeObserver) new ResizeObserver(measure).observe(mapBox); else window.addEventListener('resize', measure);
  measure();
}

// ------------------------------------------------------------------ codes panel
const card = $('#codesCard'), stateRows = $('#stateRows'), localRows = $('#localRows'), detail = $('#detail');
let selectBar, EV = null, detailSig = '', detailSlot = 0;
const evaluate = () => codes.evaluate({ photo: S.photo, place: S.place, distance: S.distance, scope: S.scope, zone: S.zone, hazardLabel: S.hazardLabel });
const quietCite = r => r.quiet || (/§/.test(r.sec) ? r.sec : r.cite);          // the section number, quiet

function makeRow(r) {
  const li = h('li', 'code-row'); li.tabIndex = 0; li.setAttribute('role', 'button');
  const mark = h('span', 'verdict-mark'), what = h('span', 'row-what'), label = makeSwap(h('span', 'row-label'), r.label, false, true), cite = makeSwap(h('span', 'row-cite'), quietCite(r), false, true); what.append(label);
  let num = null;
  if (r.value != null && r.phrase) {                   // the value belongs to the name: "Ladder fuels · within 30 ft"
    const ph = h('span', 'row-phrase'); num = h('span', 'row-num shell-num'); ph.append(' · ' + r.phrase[0], num, r.phrase[1]); what.append(ph);
  }
  li.append(mark, what, cite);
  li.__p = { mark, num, label, cite }; li.__row = {};
  li.addEventListener('click', () => select(r.key)); li.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); select(r.key); } });
  patchRow(li, r, true); return li;
}
function patchRow(li, r, fresh) {                    // touch only what is different: an unchanged row gets no write at all
  const p = li.__p, o = li.__row;
  if (o.verdict !== r.verdict) { p.mark.dataset.verdict = r.verdict; li.dataset.verdict = r.verdict; }
  if (p.num && o.value !== r.value) { if (fresh || o.value == null) setNumber(p.num, r.value); else countTo(p.num, r.value); }
  const aria = r.word + '. ' + r.title + (r.value != null ? ' ' + r.value + ' ' + r.unit : '') + '. ' + r.why;
  if (o.aria !== aria) li.setAttribute('aria-label', aria);
  // the same rule can sit in another section, or carry another name, in another place: those words crossfade
  const quiet = quietCite(r);
  if (!fresh && o.quiet !== quiet) setSwap(p.cite, quiet);
  if (!fresh && o.label !== r.label) setSwap(p.label, r.label);
  li.__row = { verdict: r.verdict, value: r.value, aria, quiet, label: r.label };
}

// Statewide: rendered when the photograph changes. Never when the pin moves.
function renderState(ev, animate) { reconcile(stateRows, ev.state, makeRow, patchRow, animate); }
// Here: the place's name, one quiet line, and its rules, patched in place.
function placeLine(P) {
  if (!P.carried) return (P.agencyShort || P.agency) + ' · not covered here';
  return [P.agencyShort || P.agency, P.fireCode.value.replace('California ', ''), P.wuiCode.value.replace('California ', '')].join(' · ');
}
// `say`: the one sentence about what changed (null = leave it as it is). It has a line of its own under the name, so it
// is set inside the rows' measured window and they glide to make room for it.
function renderLocal(ev, animate, say) {
  const P = ev.placeInfo;
  reconcile(localRows, ev.local, makeRow, patchRow, animate, () => { setSwap($('#hereName'), P.short); setSwap($('#hereLine'), placeLine(P)); if (say != null) setSwap($('#diffLine'), say); });
}
// A change of place can add or drop rules. The card's height travels to its new size and the chosen rule's text follows.
function applyLocal(ev, animate, say) {
  if (!animate) return renderLocal(ev, false, say);
  resizeWith(card, () => { follow(detail, () => renderLocal(ev, true, say)); renderDetail(ev); });      // the chosen rule's text changes inside the same move
}
let tallyEls = null;
function renderVerdict(ev, instant) {
  const o = ev.overall, mark = $('#verdictMark');
  if (mark.dataset.verdict !== o.verdict) mark.dataset.verdict = o.verdict;
  setSwap($('#verdictWord'), o.word + ' here'); setSwap($('#verdictLine'), o.line);
  ['red', 'yellow', 'green'].forEach(v => { const n = tallyEls[v]; if (n.__shown !== o.tally[v]) { if (instant) setNumber(n, o.tally[v]); else countTo(n, o.tally[v]); } });
}
// The chosen rule's own text: why this verdict here, then the citation and the ordinance's words.
function detailContent(row) {
  const f = document.createDocumentFragment(); if (!row) return f;
  const why = h('p', 'detail-why'), mark = h('span', 'verdict-mark'); mark.dataset.verdict = row.verdict;
  why.append(mark, h('b', '', row.word + '.'), h('span', 'detail-reason', row.why));
  f.append(why, h('p', 'detail-cite', row.citeShort || row.cite), emphasis.fill(h('p', 'detail-quote', ''), row.brief || row.requires));
  return f;
}
function chosenRow(ev) {
  const all = ev.local.concat(ev.state); let r = S.picked ? all.find(x => x.key === S.selected) : null;
  if (!r) r = all.find(x => x.key === ev.overall.decidedBy) || all[0];
  return r || null;
}
function renderDetail(ev) {
  const row = chosenRow(ev); S.selected = row ? row.key : null;
  const sig = [ev.photo, ev.place, row ? row.key : '-', row && row.verdict, row && row.cite, row && (row.brief || row.requires)].join('|');
  const sheets = detail.children;
  if (sig !== detailSig) {
    detailSig = sig; const next = sheets[1 - detailSlot], cur = sheets[detailSlot];
    next.replaceChildren(detailContent(row)); next.classList.add('on'); next.removeAttribute('aria-hidden'); cur.classList.remove('on'); cur.setAttribute('aria-hidden', 'true'); detailSlot = 1 - detailSlot;
  } else if (row) {                                   // the same rule and verdict, only a number moved under the hand: write it, no fade
    const reason = sheets[detailSlot].querySelector('.detail-reason'); if (reason && reason.textContent !== row.why) reason.textContent = row.why;
  }
  placeSelect(row ? row.key : null);
}
// The blue highlight under the chosen row is one element that glides. It lives outside the statewide block, so
// choosing a row never writes inside that block.
function rowNode(key) { return [...stateRows.children, ...localRows.children].find(n => n.dataset.key === key && !n.__leaving) || null; }
function placeSelect(key, instant) {
  const n = key ? rowNode(key) : null;
  if (!n) { selectBar.style.opacity = '0'; return; }
  let top = 0, node = n; while (node && node !== card) { top += node.offsetTop; node = node.offsetParent; }
  if (instant || selectBar.style.opacity !== '1') { selectBar.style.transition = 'opacity 180ms ' + FLAT; requestAnimationFrame(() => { selectBar.style.transition = ''; }); }
  selectBar.style.transform = 'translate3d(0,' + top + 'px,0)'; selectBar.style.height = n.offsetHeight + 'px'; selectBar.style.opacity = '1';
}
function select(key) { S.selected = key; S.picked = true; resizeWith(card, () => renderDetail(EV)); }

// ------------------------------------------------------------------ where the pin is
function locate() {
  const a = geo.at(S.lon, S.lat);
  if (a.place === S.place && a.scope === S.scope && a.label === S.hazardLabel && a.zoneName === S.zoneName) return false;
  const prev = { place: S.place, scope: S.scope };
  S.place = a.place; S.scope = a.scope; S.classes = a.classes; S.hazardLabel = a.label; S.zone = a.zone; S.zoneName = a.zoneName;
  paintMap();
  if (prev.place === null) return true;
  EV = evaluate();
  applyLocal(EV, true, prev.place !== S.place ? codes.diff({ photo: S.photo, from: prev, to: { place: S.place, scope: S.scope } }) : null);     // one short sentence, only when the place changed
  renderVerdict(EV);
  return true;
}

// ------------------------------------------------------------------ distance (a number with a stepper; it can also be dragged)
const distNum = $('#distNum'), scrub = $('#scrub');
function setDistance(v, live) {
  const d = Math.max(codes.DISTANCE.min, Math.min(codes.DISTANCE.max, Math.round(v)));
  scrub.setAttribute('aria-valuenow', String(d)); scrub.setAttribute('aria-valuetext', d + ' feet');
  if (d === S.distance && distNum.__shown === d) return;
  S.distance = d; if (live) setNumber(distNum, d); else countTo(distNum, d);
  if (!EV) return;
  EV = evaluate(); applyLocal(EV, true); renderVerdict(EV);
}
function wireDistance() {
  setNumber(distNum, S.distance); scrub.setAttribute('aria-valuenow', String(S.distance)); scrub.setAttribute('aria-valuetext', S.distance + ' feet');
  let drag = null;
  scrub.addEventListener('pointerdown', e => { if (e.button) return; e.preventDefault(); scrub.focus({ preventScroll: true }); drag = { id: e.pointerId, x: e.clientX, v: S.distance }; scrub.setPointerCapture(e.pointerId); scrub.style.transition = 'none'; });
  scrub.addEventListener('pointermove', e => {
    if (!drag || e.pointerId !== drag.id) return;
    const raw = drag.v + (e.clientX - drag.x) / 2.2, v = Math.max(0, Math.min(150, raw)), over = raw - v;
    setDistance(v, true);                             // direct: the value follows the hand
    scrub.style.transform = over ? 'translateX(' + (Math.sign(over) * Math.min(9, Math.pow(Math.abs(over), 0.6) * 1.5)).toFixed(1) + 'px)' : '';   // past the limit it follows with resistance
  });
  const up = e => { if (!drag || e.pointerId !== drag.id) return; drag = null; try { scrub.releasePointerCapture(e.pointerId); } catch (_) {} scrub.style.transition = 'transform 220ms ' + FLAT; scrub.style.transform = ''; };
  scrub.addEventListener('pointerup', up); scrub.addEventListener('pointercancel', up);
  scrub.addEventListener('keydown', e => {
    const big = e.shiftKey ? 10 : 1; let v = null;
    if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') v = S.distance - big; else if (e.key === 'ArrowRight' || e.key === 'ArrowUp') v = S.distance + big;
    else if (e.key === 'PageDown') v = S.distance - 10; else if (e.key === 'PageUp') v = S.distance + 10; else if (e.key === 'Home') v = 0; else if (e.key === 'End') v = 150;
    if (v == null) return; e.preventDefault(); setDistance(v, Math.abs(v - S.distance) <= 1);
  });
  $('#distDown').addEventListener('click', e => setDistance(S.distance - (e.shiftKey ? 10 : 1), !e.shiftKey));
  $('#distUp').addEventListener('click', e => setDistance(S.distance + (e.shiftKey ? 10 : 1), !e.shiftKey));
}
function paintMeasure() { const on = photoInfo(S.photo).usesDistance; $('#measure').classList.toggle('is-off', !on); scrub.tabIndex = on ? 0 : -1; $('#distDown').tabIndex = $('#distUp').tabIndex = on ? 0 : -1; if (on) $('#measure').removeAttribute('inert'); else $('#measure').setAttribute('inert', ''); }

// ------------------------------------------------------------------ photograph and corrections
const stageBox = $('#stageBox'), stageLayers = [...stageBox.children], dots = [], TOOLS = 0, changeSwitch = $('#changeSwitch');      // the switch row is outside the box now
function paintSwitch() { changeSwitch.setAttribute('aria-pressed', String(S.showChange)); }
let stageSlot = 0, BA = null, baPos = Q.has('pos') ? +Q.get('pos') : 0.42;      // a little more of the "after" side, so its tag has room
function currentSolution() { return solutions.get(S.photo, S.sol[S.photo]) || solutions.list(S.photo)[0]; }
function paintFix() {
  const list = solutions.list(S.photo), sol = currentSolution();
  dots.forEach((d, i) => { const s = list[i], off = !s || list.length < 2; d.classList.toggle('is-off', off); d.tabIndex = off ? -1 : 0; if (s) { d.setAttribute('aria-label', 'Correction ' + (i + 1) + ' of ' + list.length + ': ' + s.title); d.setAttribute('aria-pressed', String(s.id === sol.id)); } });
  setSwap($('#fixTitle'), sol.title);
}
function setSolution(id) { if (!solutions.get(S.photo, id) || S.sol[S.photo] === id) return; S.sol[S.photo] = id; paintFix(); BA.update({ solution: currentSolution() }); }
// The picture takes the photograph's own shape. The box under it is exactly that tall, so the card is as tall as
// its content, and when the photograph changes the height travels to the new value (CSS transition on .stage-box).
function stageSize() {
  const info = photoInfo(S.photo), bw = stageBox.clientWidth, tallest = Math.max(220, Math.min(window.innerHeight * (window.innerHeight < 780 ? 0.455 : 0.56), 560)), w = Math.min(bw, Math.floor(tallest * info.aspect));
  return { w, h: Math.round(w / info.aspect) + TOOLS };
}
function fitStage(instant) {
  const size = stageSize(), holder = stageLayers[stageSlot].firstElementChild; if (holder) holder.style.width = size.w + 'px';
  if (instant) { stageBox.classList.add('is-instant'); stageBox.style.height = size.h + 'px'; void stageBox.offsetHeight; stageBox.classList.remove('is-instant'); } else stageBox.style.height = size.h + 'px';
}
function showStage(first) {
  const next = stageLayers[first ? stageSlot : 1 - stageSlot], cur = stageLayers[stageSlot], old = BA, holder = h('div');
  if (old) baPos = old.get();
  next.replaceChildren(holder);
  if (!first) { next.classList.add('on'); cur.classList.remove('on'); stageSlot = 1 - stageSlot; setTimeout(() => { if (old) old.destroy(); if (!cur.classList.contains('on')) cur.replaceChildren(); }, 420); }
  holder.style.width = stageSize().w + 'px';
  BA = beforeAfter(holder, { solution: currentSolution(), position: baPos, caption: false, tags: { before: 'Before', after: 'After · illustrative' }, outline: 'toggle', switch: false, shown: S.showChange });
  paintSwitch();
  fitStage(first);
}
function setPhoto(id) {
  if (id === S.photo || !photoInfo(id)) return; S.photo = id; S.picked = false;
  setSwap($('#findingName'), photoInfo(id).title);
  showStage(false); paintFix(); paintMeasure();
  EV = evaluate();
  resizeWith(card, () => { renderState(EV, true); renderLocal(EV, true, ''); renderDetail(EV); });
  renderVerdict(EV);
}

// ------------------------------------------------------------------ Sources and notes (a bottom sheet)
// Where everything went that is not the verdict, a rule or its text: sources, what a rule said before, how the map
// was made, and what kind of demonstration this is.
const STATUS = { read: 'read on 22 Nov 2026', blocked: 'this site would not open', repo: 'from the project notes, not re-read at the source', secondary: 'a summary by others, not an official source' };
const sheet = $('#notesSheet'), veil = $('#notesVeil'); let notesOpener = null;
function notesBlock(title, build) { const s = h('section', 'notes-block'); s.append(h('h3', '', title)); build(s); return s; }
function kv(dl, k, v) { const dd = h('dd'); if (typeof v === 'string') dd.textContent = v; else dd.append(v); dl.append(h('dt', '', k), dd); return dd; }
function sourceNode(s) { const w = document.createDocumentFragment(); if (s.url) { const a = h('a', '', s.label); a.href = s.url; a.target = '_blank'; a.rel = 'noopener'; w.append(a); } else w.append(s.label); w.append(h('small', '', STATUS[s.status] || '')); return w; }
function buildNotes() {
  const body = $('#notesBody'), ev = EV, P = ev.placeInfo, row = chosenRow(ev); body.replaceChildren();
  if (row) body.append(notesBlock(row.title + (row.value != null ? ' ' + row.value + ' ' + row.unit : ''), s => {
    const dl = h('dl', 'notes-kv');
    kv(dl, 'Citation', row.cite); kv(dl, 'What it says', emphasis.fill(h('span'), row.requires)); kv(dl, 'For this photo', row.applies);
    if (row.open) kv(dl, 'Still to confirm', row.open);
    if (row.was) kv(dl, 'Before 2026', row.was.value + ' ' + row.was.unit + ' until ' + row.was.until + '. ' + row.was.cite + '.');
    if (row.source) kv(dl, 'Text from', sourceNode(row.source));
    s.append(dl);
  }));
  body.append(notesBlock(P.name, s => {
    const dl = h('dl', 'notes-kv');
    kv(dl, 'Fire agency', P.agency + (P.agencyCite && P.carried ? ' · ' + P.agencyCite : '')); if (P.agencyNote) kv(dl, '', P.agencyNote);
    if (P.carried) {
      const fc = kv(dl, 'Fire code', P.fireCode.value + ' · ' + P.fireCode.cite); if (P.fireCode.was) fc.append(h('small', '', 'Until ' + P.fireCode.was.until + ': ' + P.fireCode.was.value + ' · ' + P.fireCode.was.cite));
      kv(dl, 'WUI code', P.wuiCode.value + ' · ' + P.wuiCode.cite);
    } else kv(dl, 'Not covered', P.why || '');
    (P.sources || []).forEach((src, i) => kv(dl, i ? '' : 'Documents', sourceNode(src)));
    if (P.pending) { const dd = kv(dl, 'Not verified', P.pending.text); if (P.pending.source) dd.append(h('small', '', STATUS[P.pending.source.status] || '')); }
    s.append(dl);
  }));
  const there = S.region === 'berkeley';
  if (ev.photo === 'ladder') body.append(notesBlock('Statewide rules', s => { s.append(h('p', '', (there ? 'The 30 ft ladder-fuel rule is local text here too: Berkeley writes it into § 604.3.1 of its own WUI Code.' : 'The 30 ft ladder-fuel rule is local text: each Ross Valley ordinance adds it as § 604.6 to the 2025 California WUI Code.') + ' The state chapter itself could not be opened at codes.iccsafe.org, so no state distance is shown.')); }));
  else body.append(notesBlock('Statewide rules', s => { s.append(h('p', '', 'The duty to replace a painted sprinkler is state law. What changes with the place is the adopting ordinance and whether the local rule made this a required system. The state code site (codes.iccsafe.org) would not open, so the three statewide rows use the wording in the inspector’s analysis.')); }));
  body.append(notesBlock('The map', s => {
    const p = h('p'), a = h('a', '', there ? 'City of Berkeley fire map' : 'Ross Valley Fire Department map'); a.target = '_blank'; a.rel = 'noopener';
    if (there) {
      a.href = geo.berkeleySource.map;
      p.append('Dotted areas are the Very High fire hazard severity zone on the ', a, '. The darker areas inside it are the Grizzly Peak and Panoramic mitigation areas, where Zone 0 applies. The plain tint is the High zone. All are simplified. Read the parcel on that map before citing. The city limit is © OpenStreetMap contributors, and the picture under it was drawn for this page from OpenStreetMap data, to match the Ross Valley one.'); s.append(p);
      const t = geo.trip(geo.areas.find(x => x.id === 'ross').labelAt, geo.pins.berkeley);
      s.append(h('p', '', 'Berkeley is ' + t[0].toFixed(1) + ' km east-southeast of Ross, across the Bay. The land between the two maps is not drawn and none of it is covered here.'));
    } else { a.href = geo.hazardSource.page; p.append('Dotted areas are the fire hazard zones and WUI areas on the ', a, ', simplified. Read the parcel on that map before citing. Town limits and the base map are © OpenStreetMap contributors.'); s.append(p); }
  }));
  body.append(notesBlock('About this demonstration', s => {
    s.append(h('p', '', codes.disclosure));
    s.append(h('p', '', 'The distance to the building is assumed. The inspector put it inside 30 ft, and the photograph cannot give it. The "after" pictures are illustrations.'));
    const p = h('p'); const a = h('a', '', 'Full notes on every source'); a.href = 'NOTES.md'; a.target = '_blank'; a.rel = 'noopener'; p.append(a, '.'); s.append(p);
  }));
}
function openNotes(from) { notesOpener = from || document.activeElement; buildNotes(); $('#notesBody').scrollTop = 0; sheet.removeAttribute('inert'); sheet.classList.add('on'); veil.classList.add('on'); sheet.focus({ preventScroll: true }); }
function closeNotes() { if (!sheet.classList.contains('on')) return; sheet.classList.remove('on'); veil.classList.remove('on'); sheet.setAttribute('inert', ''); if (notesOpener && notesOpener.focus) notesOpener.focus({ preventScroll: true }); notesOpener = null; }

// ------------------------------------------------------------------ start
function start() {
  buildMap();
  // the codes card
  makeSwap($('#verdictWord'), ''); makeSwap($('#verdictLine'), '', true); makeSwap($('#diffLine'), '', true, true);
  makeSwap($('#hereName'), ''); makeSwap($('#hereLine'), '', true);
  const tally = $('#verdictTally'); tallyEls = {};
  ['red', 'yellow', 'green'].forEach(v => { const it = h('span', 'tally-item'), m = h('span', 'verdict-mark'), n = h('b', 'shell-num', '0'); m.dataset.verdict = v; it.title = codes.VERDICT[v].word; it.setAttribute('aria-label', codes.VERDICT[v].word); it.append(m, n); tally.append(it); tallyEls[v] = n; n.__shown = 0; });
  selectBar = h('div', 'row-select'); selectBar.style.opacity = '0'; card.prepend(selectBar);
  // the photo card
  makeSwap($('#findingName'), photoInfo(S.photo).title, true); makeSwap($('#fixTitle'), '', true);
  for (let i = 0; i < 3; i++) { const d = h('button', 'fix-dot is-off'); d.type = 'button'; d.addEventListener('click', () => { const s = solutions.list(S.photo)[i]; if (s) setSolution(s.id); }); $('#fixDots').append(d); dots.push(d); }
  const tabsEl = $('#photoTabs'); tabsEl.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.value === S.photo));
  const tabs = window.Shell.tabs(tabsEl, setPhoto); window.Shell.watch(tabsEl);
  paintMeasure();

  wireMap(); wireDistance();
  S.place = null; setPin(S.lon, S.lat, true);         // clamps the pin into the map, then sets place, zone and the map highlight
  EV = evaluate(); renderState(EV, false); renderLocal(EV, false); renderVerdict(EV, true); renderDetail(EV);
  paintFix(); showStage(true);
  placeSelect(S.selected, true);

  // every scroll area fades out softly where there is more to scroll
  window.Shell.softScroll($('#notesBody')); window.Shell.softScroll($('.shell-view[data-view="technology"]'));
  changeSwitch.addEventListener('click', () => { S.showChange = !S.showChange; paintSwitch(); if (BA) BA.outline(S.showChange); });
  // Sources and notes
  [$('#notesLink'), $('#notesLinkFoot')].forEach(b => { if (b) b.addEventListener('click', () => openNotes(b)); });
  $('#notesClose').addEventListener('click', closeNotes); veil.addEventListener('click', closeNotes);
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeNotes(); });

  const settle = () => { fitStage(true); window.Shell.seg(tabsEl); placeSelect(S.selected, true); };
  window.addEventListener('resize', settle); if (document.fonts && document.fonts.ready) document.fonts.ready.then(settle);
  // This view is one of two kept alive in the same document. While it is hidden nothing here runs.
  window.addEventListener('shell:view', e => { if (e.detail.view === 'technology') settle(); else { stopGlide(); endFlight(); closeNotes(); } paintWhere(); });
  document.body.dataset.ready = '1';
  if (Q.get('notes') === '1') openNotes();

  // for test.js, shot.js and the console
  const pose = {};
  window.APP = {
    state: S, evaluate: () => EV, setPin: jumpTo, glideTo, goto: goTo, camera: () => ({ x: cam.x, y: cam.y, z: cam.z, flying: !!flight, waiting: !!waiting }),
    // for looking at a trip one frame at a time: draw the trip from where things are now to a place, at time k in 0..1
    pose: (id, k) => { if (!pose.trip || pose.id !== id || k === 0) { pose.id = id; pose.trip = makeTrip(geo.regionOf(geo.pins[id][0], geo.pins[id][1]), geo.pins[id][0], geo.pins[id][1]); } if (k >= 1) { land(pose.trip); pose.trip = null; } else { mapBox.classList.add('is-flying'); pose.trip.pose(k); } },
    corridor: () => (corridor ? { done: corridor.done, ok: corridor.ok, ready: corridor.ready } : null),
    setDistance: v => setDistance(v, false), setPhoto: id => tabs.set(id), setSolution, select, divider: () => BA, notes: { open: openNotes, close: closeNotes },
    toClient,
  };
}
start();
})();
