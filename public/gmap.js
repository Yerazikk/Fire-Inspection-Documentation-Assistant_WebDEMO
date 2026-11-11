// Google Maps in the page: the interactive satellite view of a lot, and the
// address of the Street View proxy.
//
//   the key     comes from /api/maps/config rather than being written into the
//               page, so it lives in the environment with the others and a
//               deployment can rotate it without a rebuild. Asked for once.
//   one map     The app rebuilds whole screens by rewriting innerHTML, and a
//               google.maps.Map is far too expensive to construct per render —
//               so there is exactly one, in a detached element that is moved
//               into whichever host is on screen. This is the same trick
//               app.js plays with the Leaflet canvas on the route map.
//   zoom + pan  Left to Google: gestureHandling 'greedy' so a single finger
//               pans the lot (which is what the hand-rolled drag used to do),
//               and the zoom control is the only chrome kept. Keyboard
//               shortcuts are off — the arrow keys belong to the app.
//   failure     A missing key, a refused key, a blocked script: all of them
//               end here as a rejected promise, and the caller leaves the
//               keyless Esri frame that was already behind the map showing.
//               Nothing in the lot view depends on Google being reachable.
window.GMAP = (() => {
  const ZOOM = 19;              // ~80 m across the hero box: a parcel and its frontage
  const SCRIPT = 'https://maps.googleapis.com/maps/api/js';

  let cfgP = null, loadP = null, denied = false;
  let el = null, map = null, atKey = '';
  let drawn = false, tilesHook = false;

  const config = () => (cfgP = cfgP || fetch('/api/maps/config')
    .then(r => r.json())
    .catch(() => ({ enabled: false, reason: 'the key endpoint could not be reached' })));

  /**
   * The address of a Street View still of a property, aimed at the house by
   * api/streetview.js. An <img> src and nothing more — the browser and the
   * service worker cache it, and a failure arrives as the img's own onerror.
   */
  function street(lat, lon, w, h, opts) {
    if (!isFinite(lat) || !isFinite(lon)) return '';
    opts = opts || {};
    // Rounded to six places (~0.1 m) so two renders of the same address are
    // the same URL, and so one cache entry serves both.
    return `/api/streetview?lat=${(+lat).toFixed(6)}&lon=${(+lon).toFixed(6)}` +
      `&w=${Math.round(Math.min(640, w))}&h=${Math.round(Math.min(640, h))}` +
      (opts.fov ? `&fov=${Math.round(opts.fov)}` : '');
  }

  /** Load the Maps JavaScript API once. Resolves with google.maps. */
  function load() {
    if (loadP) return loadP;
    loadP = config().then(cfg => {
      if (!cfg.enabled || !cfg.key) throw new Error(cfg.reason || 'no Google Maps key');
      if (window.google && window.google.maps) return window.google.maps;
      return new Promise((resolve, reject) => {
        // Google reports a bad or unauthorised key here rather than on the
        // script tag — the script itself loads fine and then refuses to draw.
        window.gm_authFailure = () => { denied = true; reject(new Error('Google refused the Maps key')); };
        const s = document.createElement('script');
        s.async = true;
        s.src = SCRIPT + '?key=' + encodeURIComponent(cfg.key) + '&loading=async&v=weekly&callback=__gmapReady';
        window.__gmapReady = () => resolve(window.google.maps);
        s.onerror = () => reject(new Error('the Maps script could not be loaded'));
        document.head.appendChild(s);
      });
    });
    return loadP;
  }

  /**
   * Put the satellite map in `host`, centred on a coordinate.
   *
   * `key` identifies the property: while it is unchanged the map is left
   * exactly where the inspector dragged and zoomed it, and only a move to a
   * different property recentres.
   *
   * @returns {Promise<boolean>} true once the map is on screen; rejects if
   *   Google is unavailable, in which case the caller's own fallback stands.
   */
  function mount(host, lat, lon, opts) {
    opts = opts || {};
    if (!host || !isFinite(lat) || !isFinite(lon)) return Promise.reject(new Error('nothing to mount'));
    if (denied) return Promise.reject(new Error('Google refused the Maps key'));
    return load().then(gm => {
      if (!el) { el = document.createElement('div'); el.className = 'gmapel'; }
      if (el.parentElement !== host) host.appendChild(el);
      const at = { lat: +lat, lng: +lon };
      if (!map) {
        drawn = false;
        map = new gm.Map(el, {
          center: at, zoom: ZOOM,
          mapTypeId: 'satellite',
          tilt: 0,                      // straight down; a tilted lot cannot be read against a code
          disableDefaultUI: true,
          zoomControl: true,
          gestureHandling: 'greedy',    // one finger pans, as the old drag did
          keyboardShortcuts: false,
          clickableIcons: false,
          isFractionalZoomEnabled: true,
          maxZoom: 21,
        });
      }
      if (!tilesHook && gm.event && gm.event.addListener) { tilesHook = true; gm.event.addListener(map, 'tilesloaded', () => { drawn = true; }); }
      if (opts.key !== atKey) { atKey = opts.key || ''; map.setCenter(at); map.setZoom(ZOOM); }
      // The element was moved in the DOM, which older builds do not notice.
      gm.event.trigger(map, 'resize');
      // A map that was built in a box with no size (or whose box has since
      // changed) has no centre to draw from; give it one again now that it
      // has pixels, or the lot view stays dark.
      const r = el.getBoundingClientRect ? el.getBoundingClientRect() : { width: 0, height: 0 };
      if (r.width > 0 && r.height > 0 && map.getCenter) { const c = map.getCenter(); if (!c || !isFinite(c.lat()) || !isFinite(c.lng())) map.setCenter(at); requestAnimationFrame(() => { gm.event.trigger(map, 'resize'); const c2 = map.getCenter(); if (c2) map.setCenter(c2); }); }
      return true;
    });
  }

  /**
   * Where the map is looking now, or null if it has never been built. The
   * element is detached between screens but the map object is not, so this
   * still answers after the lot view has been left — which is what lets an
   * entry made two screens later be placed where the inspector left the frame.
   */
  /**
   * Resolves once the map has actually painted tiles in its current box, so a
   * caller can hide its fallback imagery only behind a real picture. Rejects
   * if nothing has painted in a few seconds — the fallback stays up then.
   */
  function whenDrawn(ms) {
    if (!map) return Promise.reject(new Error('no map'));
    if (drawn) return Promise.resolve(true);
    return new Promise((resolve, reject) => {
      const gm = window.google && window.google.maps; if (!gm) return reject(new Error('no maps api'));
      // A build of the API without events (the test stub) is taken as drawn.
      if (!gm.event || !gm.event.addListenerOnce) { drawn = true; return resolve(true); }
      const t = setTimeout(() => reject(new Error('the lot view did not paint')), ms || 7000);
      gm.event.addListenerOnce(map, 'tilesloaded', () => { clearTimeout(t); drawn = true; resolve(true); });
    });
  }

  function centre() {
    if (!map) return null;
    const c = map.getCenter(); if (!c) return null;
    return { lat: c.lat(), lon: c.lng() };
  }

  // Entry pins, drawn as our own DOM on an OverlayView rather than as map
  // markers. The app already has a visual language for an entry — a numbered
  // disc in the colour of its kind — and matching it matters more here than
  // a teardrop would; AdvancedMarkerElement needs a cloud-configured mapId,
  // and the classic Marker is deprecated. An OverlayView is the supported way
  // to put your own element on the map and have it stay on the same patch of
  // ground through every pan and zoom.
  const TONE = { violation: '#ff5c6c', compliance: '#4ade80', note: '#ffb648' };
  let pinOverlay = null, pinLayer = null, pinList = [], pinPick = null;

  function paintPins() {
    if (!pinLayer) return;
    pinLayer.innerHTML = pinList.map(p =>
      `<button class="gmpin" data-pin="${String(p.id == null ? '' : p.id).replace(/"/g, '&quot;')}" style="--c:${TONE[p.kind] || TONE.note}"><i></i><span>${p.n}</span></button>`).join('');
    placePins();
  }
  function placePins() {
    if (!pinLayer || !pinOverlay) return;
    const proj = pinOverlay.getProjection(); if (!proj) return;
    const kids = pinLayer.children;
    for (let i = 0; i < kids.length; i++) {
      const p = pinList[i]; if (!p) continue;
      const xy = proj.fromLatLngToDivPixel(new google.maps.LatLng(p.lat, p.lon));
      kids[i].style.transform = `translate(${Math.round(xy.x)}px,${Math.round(xy.y)}px)`;
    }
  }

  /**
   * Show one pin per entry: `{ id, n, kind, lat, lon }`. Called with an empty
   * list to clear. `onPick` receives the id of a pin that is tapped.
   */
  function marks(list, onPick) {
    pinPick = onPick || null;
    pinList = (list || []).filter(p => isFinite(p.lat) && isFinite(p.lon));
    if (!map || !window.google || !google.maps) return;
    if (pinOverlay) return paintPins();
    pinOverlay = new google.maps.OverlayView();
    pinOverlay.onAdd = function () {
      pinLayer = document.createElement('div');
      pinLayer.className = 'gmpins';
      pinLayer.onclick = e => { const b = e.target.closest('.gmpin'); if (b && pinPick) pinPick(b.dataset.pin); };
      this.getPanes().overlayMouseTarget.appendChild(pinLayer);
      paintPins();
    };
    pinOverlay.onRemove = function () { if (pinLayer && pinLayer.parentElement) pinLayer.parentElement.removeChild(pinLayer); pinLayer = null; };
    pinOverlay.draw = placePins;
    pinOverlay.setMap(map);
  }

  /** Take the map off screen without destroying it. */
  function unmount() { if (el && el.parentElement) el.parentElement.removeChild(el); }

  return { load, mount, unmount, marks, centre, whenDrawn, street, config, get live() { return !!map && !denied; } };
})();
