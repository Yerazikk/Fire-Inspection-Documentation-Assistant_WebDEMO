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
      const centre = { lat: +lat, lng: +lon };
      if (!map) {
        map = new gm.Map(el, {
          center: centre, zoom: ZOOM,
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
      if (opts.key !== atKey) { atKey = opts.key || ''; map.setCenter(centre); map.setZoom(ZOOM); }
      // The element was moved in the DOM, which older builds do not notice.
      gm.event.trigger(map, 'resize');
      return true;
    });
  }

  /** Take the map off screen without destroying it. */
  function unmount() { if (el && el.parentElement) el.parentElement.removeChild(el); }

  return { load, mount, unmount, street, config, get live() { return !!map && !denied; } };
})();
