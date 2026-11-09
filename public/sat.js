// Rough satellite imagery of a property, from its coordinate alone.
//
//   provider   Esri World Imagery first — sub-metre, global, no key. USGS
//              National Map (NAIP) second, for when Esri is down or blank.
//              Both are ArcGIS REST image services, so one `export` call
//              returns exactly the box we ask for, already stitched.
//   framing    The box is computed in Web Mercator, so we know to the metre
//              what ground each pixel covers. That is what lets the defensible
//              -space rings and the scale bar be true to scale instead of
//              decorative — and it is the hook a real GPS fix drops into, via
//              view.xy(lat, lon).
//   squares    Every request is square and displayed with object-fit:cover.
//              An SVG overlay with viewBox 0 0 100 100 and xMidYMid slice
//              crops identically, so a circle on the ground is a circle on
//              screen whatever shape the element ends up.
//   limits     The tile pyramid bottoms out near 0.15 m/px, and `export`
//              answers HTTP 500 rather than upsampling past it. Requests are
//              clamped to that, and an image that still fails walks a ladder:
//              coarser, then the other provider, then whatever the caller
//              put behind it.
//   caching    Esri answers `Cache-Control: max-age=0, must-revalidate`, so
//              the browser re-asks for every frame each time a screen is
//              rebuilt - and this app rebuilds whole screens. Each frame is
//              therefore fetched once by hand, kept as an object URL for the
//              life of the page, and handed straight to every later <img>
//              asking for the same ground. Coming back to a property is then
//              instant and silent instead of a fresh round trip.
//   waiting    Until a frame arrives the box holds a skeleton: dark blocks
//              pulsing in a diagonal wave. The stylised sketch no longer
//              fills the wait, because a drawing of a lot nobody has seen
//              reads as imagery and cannot be told apart from the real thing.
//              It now shows only once every provider has actually failed.
window.SAT = (function () {
  const R = 6378137, D2R = Math.PI / 180;
  const mx = lon => R * lon * D2R;
  const my = lat => R * Math.log(Math.tan(Math.PI / 4 + lat * D2R / 2));

  const PROVIDERS = [
    { id: 'esri', url: 'https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer', credit: 'Imagery © Esri · Maxar · Earthstar Geographics', short: 'Imagery © Esri' },
    { id: 'usgs', url: 'https://basemap.nationalmap.gov/arcgis/rest/services/USGSImageryOnly/MapServer', credit: 'Imagery · USGS National Map (NAIP)', short: 'Imagery · USGS' },
  ];
  // Tiles for the Leaflet basemap. ArcGIS orders the path {z}/{y}/{x}.
  const TILES = PROVIDERS[0].url + '/tile/{z}/{y}/{x}';
  const MPP = 0.15;          // finest ground sample the service will export
  const MAXPX = 1024;

  // What the inspector is looking at, in metres across the frame. Named for
  // what each one shows rather than for a zoom number.
  const ZOOMS = [
    { id: 'parcel', label: 'Parcel', span: 70 },
    { id: 'zone', label: '100 ft zone', span: 150 },
    { id: 'block', label: 'Block', span: 380 },
  ];
  const spanOf = z => (ZOOMS.find(x => x.id === z) || ZOOMS[1]).span;

  // One square view of the ground, centred on a coordinate.
  function view(lat, lon, span, px) {
    px = Math.max(96, Math.min(MAXPX, Math.round(Math.min(px || 420, span / MPP))));
    const k = 1 / Math.cos(lat * D2R);                  // mercator metres per ground metre
    const cx = mx(lon), cy = my(lat), h = span * k / 2;
    return {
      lat, lon, span, px, mpp: span / px,
      bbox: [cx - h, cy - h, cx + h, cy + h],
      // ground metres from the centre → radius as a percent of the frame
      pct: m => m / span * 100,
      // a real coordinate → its place in the 0–100 overlay space
      xy: (la, lo) => ({ x: (mx(lo) - (cx - h)) / (2 * h) * 100, y: (cy + h - my(la)) / (2 * h) * 100 }),
    };
  }

  const urlFor = (p, v, scale) => {
    const px = Math.max(96, Math.round(v.px * (scale || 1)));
    return p.url + '/export?bbox=' + v.bbox.map(n => n.toFixed(2)).join(',') +
      '&bboxSR=3857&imageSR=3857&size=' + px + ',' + px + '&format=jpg&transparent=false&f=image';
  };
  // Try each provider at full size, then at half, before giving up.
  const LADDER = [];
  PROVIDERS.forEach(p => LADDER.push({ p, scale: 1 }));
  PROVIDERS.forEach(p => LADDER.push({ p, scale: 0.5 }));

  // ------------------------------------------------------------------ caching
  // Frames already fetched this session, as object URLs. Nothing is evicted: a
  // frame is ~40 KB, a day's inspecting touches a few dozen, and revoking a URL
  // some rendered screen still points at would blank it.
  const blobs = new Map();        // request URL -> object URL
  const inflight = new Map();     // request URL -> promise, so two tiles of the
                                  // same ground share one request
  function grab(url) {
    const have = blobs.get(url);
    if (have) return Promise.resolve(have);
    if (inflight.has(url)) return inflight.get(url);
    const p = fetch(url, { mode: 'cors', cache: 'force-cache' })
      .then(r => { if (!r.ok) throw new Error('HTTP ' + r.status); return r.blob(); })
      .then(b => { const u = URL.createObjectURL(b); blobs.set(url, u); inflight.delete(url); return u; })
      .catch(e => { inflight.delete(url); throw e; });
    inflight.set(url, p); return p;
  }

  // The wait state: a 4x4 grid of dark blocks pulsing in a diagonal wave, so
  // the box reads as loading rather than as broken or as a very dark aerial.
  const SKEL = (() => { let b = '';
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) b += `<i style="animation-delay:${(r + c) * 90}ms"></i>`;
    return `<div class="satskel" aria-hidden="true">${b}</div>`; })();

  // Tiles are written as HTML strings by whatever is drawing the screen, so
  // there is no insertion hook to start the fetch from. One sweep, scheduled on
  // the turn the string is built, finds every <img> just written - whichever
  // screen wrote it, and whether it went in through render() or straight into a
  // panel.
  //
  // Offscreen frames wait for the viewport, which is what loading="lazy" used
  // to do and still matters on the previous-inspections list. The observer is
  // rebuilt each sweep, so rows belonging to a screen that has since been
  // replaced are dropped rather than held.
  let sweepT = null;
  const io = typeof IntersectionObserver === 'function'
    ? new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.unobserve(e.target); load(e.target); } }), { rootMargin: '240px' })
    : null;
  function sweep() {
    sweepT = null;
    if (io) io.disconnect();
    document.querySelectorAll('img[data-get]').forEach(img => { if (io && !img.dataset.eager) io.observe(img); else load(img); });
  }
  const scheduleSweep = () => { if (sweepT == null) sweepT = setTimeout(sweep, 0); };
  function load(img) {
    const url = img.dataset.get; if (!url) return;
    delete img.dataset.get;
    grab(url).then(u => { if (img.isConnected) img.src = u; }).catch(() => next(img));
  }

  // A satellite tile, ready to drop into any markup.
  //   span / zoom  how much ground to cover      dead  HTML shown if every
  //   px           requested pixels (clamped)          provider fails
  const attr = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  function tile(lat, lon, opts) {
    opts = opts || {};
    if (!isFinite(lat) || !isFinite(lon)) return `<div class="satimg dead">${opts.dead || ''}</div>`;
    const span = opts.span || spanOf(opts.zoom);
    const v = view(lat, lon, span, opts.px);
    const src = urlFor(PROVIDERS[0], v, 1);
    // Ground already fetched goes in with its src set and the box already
    // marked `on`, so a re-render paints it in the same frame - no request, no
    // skeleton, no fade.
    const have = blobs.get(src);
    if (!have) scheduleSweep();
    return `<div class="satimg${have ? ' on' : ''}${opts.cls ? ' ' + opts.cls : ''}">${opts.dead || ''}${have ? '' : SKEL}` +
      `<img alt="" decoding="async" draggable="false" ${have ? 'src' : 'data-get'}="${attr(have || src)}"` +
      ` data-at="${lat},${lon},${span},${v.px}" data-step="0"${opts.eager ? ' data-eager="1"' : ''}` +
      ` onload="SAT.ok(this)" onerror="SAT.next(this)"></div>`;
  }

  // Put a frame in the cache without drawing it. A view about to be re-rendered
  // around a new centre can then hold the frame it already has on screen until
  // the new one is ready, instead of blinking back through the skeleton.
  function prefetch(lat, lon, opts) {
    opts = opts || {};
    if (!isFinite(lat) || !isFinite(lon)) return Promise.reject(new Error('no coordinate'));
    return grab(urlFor(PROVIDERS[0], view(lat, lon, opts.span || spanOf(opts.zoom), opts.px), 1));
  }

  const parse = el => { const a = el.dataset.at.split(',').map(Number); return view(a[0], a[1], a[2], a[3]); };

  function ok(el) {
    const box = el.parentElement; if (!box) return;
    box.classList.add('on'); box.classList.remove('dead');
    // Attribution is a condition of use, and which service answered can change
    // per tile, so the credit is written when the image actually arrives.
    const c = box.parentElement && box.parentElement.querySelector('[data-cred]');
    if (c) c.textContent = LADDER[+el.dataset.step || 0].p.credit;
  }

  // One rung down the ladder; out of rungs means the fallback behind shows -
  // the stylised sketch, and only here, where every provider really has failed.
  function next(el) {
    const step = (+el.dataset.step || 0) + 1, rung = LADDER[step];
    if (!rung) { const box = el.parentElement; if (box) { box.classList.add('dead'); box.classList.remove('on'); } el.remove(); return; }
    el.dataset.step = step;
    el.removeAttribute('src');
    el.dataset.get = urlFor(rung.p, parse(el), rung.scale);
    scheduleSweep();
  }

  // A round distance that fits comfortably inside the frame, in feet, with the
  // fraction of the frame width it spans.
  const STEPS = [10, 20, 25, 50, 100, 150, 200, 300, 500, 1000, 2000];
  function scaleBar(span) {
    const ft = span / 0.3048;
    let pick = STEPS[0];
    STEPS.forEach(s => { if (s <= ft * 0.4) pick = s; });
    return { ft: pick, pct: pick / ft * 100, label: pick >= 1000 ? (pick / 5280).toFixed(2) + ' mi' : pick + ' ft' };
  }

  // The three defensible-space zones of PRC §4291, drawn to true scale on the
  // imagery. Rings too small to read at this span are left out rather than
  // drawn as a dot.
  const RINGS = [
    { ft: 5, label: 'Zone 0 · 5 ft', cls: 'z0' },
    { ft: 30, label: 'Zone 1 · 30 ft', cls: 'z1' },
    { ft: 100, label: 'Zone 2 · 100 ft', cls: 'z2' },
  ];
  function zones(v, at) {
    const c = at || { x: 50, y: 50 };
    return RINGS.map(r => {
      const rad = v.pct(r.ft * 0.3048);
      if (rad < 1.8 || rad > 160) return '';
      return `<circle class="zr ${r.cls}" cx="${c.x.toFixed(2)}" cy="${c.y.toFixed(2)}" r="${rad.toFixed(2)}"/>` +
        (rad > 5.5 ? `<text class="zt" x="${c.x.toFixed(2)}" y="${(c.y - rad + 2.6).toFixed(2)}" text-anchor="middle">${r.label}</text>` : '');
    }).join('');
  }

  return { view, tile, prefetch, ok, next, scaleBar, zones, ZOOMS, spanOf, TILES, credit: PROVIDERS[0].credit, creditShort: PROVIDERS[0].short, MPP };
})();
