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

  // URLs already seen this session. A re-render then paints them without
  // replaying the fade, which matters because the app rebuilds whole screens.
  const loaded = new Set();

  // A satellite tile, ready to drop into any markup.
  //   span / zoom  how much ground to cover      dead  HTML shown if every
  //   px           requested pixels (clamped)          provider fails
  function tile(lat, lon, opts) {
    opts = opts || {};
    if (!isFinite(lat) || !isFinite(lon)) return `<div class="satimg dead">${opts.dead || ''}</div>`;
    const span = opts.span || spanOf(opts.zoom);
    const v = view(lat, lon, span, opts.px);
    const src = urlFor(PROVIDERS[0], v, 1);
    return `<div class="satimg${loaded.has(src) ? ' on' : ''}${opts.cls ? ' ' + opts.cls : ''}">${opts.dead || ''}` +
      `<img alt="" decoding="async" loading="${opts.eager ? 'eager' : 'lazy'}" src="${src}"` +
      ` data-at="${lat},${lon},${span},${v.px}" data-step="0"` +
      ` onload="SAT.ok(this)" onerror="SAT.next(this)"></div>`;
  }

  const parse = el => { const a = el.dataset.at.split(',').map(Number); return view(a[0], a[1], a[2], a[3]); };

  function ok(el) {
    loaded.add(el.getAttribute('src'));
    const box = el.parentElement; if (!box) return;
    box.classList.add('on'); box.classList.remove('dead');
    // Attribution is a condition of use, and which service answered can change
    // per tile, so the credit is written when the image actually arrives.
    const c = box.parentElement && box.parentElement.querySelector('[data-cred]');
    if (c) c.textContent = LADDER[+el.dataset.step || 0].p.credit;
  }

  // One rung down the ladder; out of rungs means the fallback behind shows.
  function next(el) {
    const step = (+el.dataset.step || 0) + 1, rung = LADDER[step];
    if (!rung) { const box = el.parentElement; if (box) { box.classList.add('dead'); box.classList.remove('on'); } el.remove(); return; }
    el.dataset.step = step;
    el.setAttribute('src', urlFor(rung.p, parse(el), rung.scale));
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

  return { view, tile, ok, next, scaleBar, zones, ZOOMS, spanOf, TILES, credit: PROVIDERS[0].credit, creditShort: PROVIDERS[0].short, MPP };
})();
