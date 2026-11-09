// node test_maps.js — the Google Maps wiring, without a browser and without a
// bill. `node test_maps.js --live` adds a real round trip to Google.
//
// What this is guarding. Two boxes in the UI used to say "photo coming": the
// preview that opens when a pin is tapped, and the lot view on the inspection
// screen. They are now a Street View still and an interactive satellite map.
// Three things about that are worth a test and none of them need a browser:
//
//   the aim      A Street View still of a house is only evidence if it is
//                pointing at the house. The heading is computed from where the
//                panorama's camera stands, and the one way that goes silently
//                wrong is a bearing that is off by a sign or a swapped
//                argument — so the heading the proxy asks Google for is
//                checked against the direction the house actually is.
//   the failures Rural parcels have no Street View, keys get refused, and
//                quotas run out. Each has to arrive at the page as its own
//                code so the UI can say which, and none may throw.
//   the money    Every still is billed. A frame asked for twice must be
//                fetched once.
//
// Google is stubbed for all of that: the test owns `fetch`, so it can answer
// as the service would and then assert what was asked of it.
const fs = require('fs'), vm = require('vm');

const LIVE = process.argv.some(a => ['--live', '--paid', '--spend'].includes(a));
const D2R = Math.PI / 180;

// .env, read now and kept: freshMaps() below clears these out of process.env
// for each stubbed case, and the live run at the end needs the real ones back.
require('./ai/env')();
const REAL = {
  GOOGLE_MAPS_API_KEY: process.env.GOOGLE_MAPS_API_KEY || '',
  GOOGLE_MAPS_BROWSER_KEY: process.env.GOOGLE_MAPS_BROWSER_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
};

// Node's own fetch, kept before the stub below replaces it — deleting the
// global would not bring it back.
const realFetch = global.fetch;

// ---- the stub ------------------------------------------------------------
// Stands in for Google. `meta` is what the metadata endpoint should answer;
// every image request comes back as four bytes so the proxy has something to
// pass on. Records every URL it was given.
function stub(meta, imageStatus = 200) {
  const calls = [];
  global.fetch = async (url) => {
    calls.push(String(url));
    if (String(url).includes('/metadata')) {
      return { ok: true, status: 200, json: async () => meta, headers: new Map() };
    }
    if (imageStatus !== 200) {
      return { ok: false, status: imageStatus, text: async () => 'The provided API key is invalid.', headers: new Map([['content-type', 'text/plain']]) };
    }
    return {
      ok: true, status: 200,
      arrayBuffer: async () => new Uint8Array([0xFF, 0xD8, 0xFF, 0xD9]).buffer,
      headers: { get: k => (k.toLowerCase() === 'content-type' ? 'image/jpeg' : null) },
    };
  };
  return calls;
}
const paramOf = (url, k) => new URL(url).searchParams.get(k);

// A fresh copy of ai/maps.js, so one test's cache cannot answer the next one's
// question and the env can be set per case.
function freshMaps(env) {
  for (const k of ['GOOGLE_MAPS_API_KEY', 'GOOGLE_MAPS_BROWSER_KEY', 'GEMINI_API_KEY']) delete process.env[k];
  Object.assign(process.env, env);
  delete require.cache[require.resolve('./ai/maps')];
  return require('./ai/maps');
}

// An independent bearing, written from the other formula — the flat-earth
// approximation, which over a street's width agrees with the spherical one to
// well under a degree.
function refBearing(lat1, lon1, lat2, lon2) {
  const k = Math.cos((lat1 + lat2) / 2 * D2R);
  const deg = Math.atan2((lon2 - lon1) * k, lat2 - lat1) / D2R;
  return (deg + 360) % 360;
}

// 29 Ridgecrest Rd, and a camera standing on the road to its south-west.
const HOUSE = { lat: 37.94179, lon: -122.55726 };
const PANO = { pano_id: 'pano-abc', location: { lat: 37.94155, lng: -122.55760 }, date: '2025-06', copyright: '© Google', status: 'OK' };

(async () => {
  let fails = 0;
  const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
  const near = (a, b, tol) => Math.abs(a - b) <= tol;

  // ---- bearing and distance ---------------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    ok(near(M.bearing(0, 0, 1, 0), 0, 1e-9), 'bearing: due north is 0°');
    ok(near(M.bearing(0, 0, 0, 1), 90, 1e-9), 'bearing: due east is 90°');
    ok(near(M.bearing(0, 1, 0, 0), 270, 1e-9), 'bearing: due west is 270°');
    ok(near(M.bearing(1, 0, 0, 0), 180, 1e-9), 'bearing: due south is 180°');
    let worst = 0;
    for (let i = 0; i < 400; i++) {
      const la = 37 + Math.random() * 2, lo = -123 + Math.random() * 2;
      const la2 = la + (Math.random() - .5) / 1000, lo2 = lo + (Math.random() - .5) / 1000;   // within ~55 m
      const d = Math.abs(((M.bearing(la, lo, la2, lo2) - refBearing(la, lo, la2, lo2) + 540) % 360) - 180);
      worst = Math.max(worst, d);
    }
    ok(worst < 0.25, `bearing: agrees with an independent formula over a street's width (worst ${worst.toFixed(3)}°)`);
    ok(near(M.metres(37.94179, -122.55726, 37.94179, -122.55726), 0, 1e-9), 'distance: a point is zero metres from itself');
    ok(near(M.metres(37.9, -122.5, 37.901, -122.5), 111.2, 1), 'distance: 0.001° of latitude is 111 m');
  }

  // ---- the aim -----------------------------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    const calls = stub(PANO);
    const out = await M.streetview({ lat: HOUSE.lat, lon: HOUSE.lon, w: 640, h: 267 });
    ok(out.status === 200 && Buffer.isBuffer(out.buffer), 'a still comes back as bytes, not as JSON');
    ok(out.type === 'image/jpeg', 'and as the content type Google sent');

    const img = calls.find(u => !u.includes('/metadata'));
    ok(!!img, 'the image endpoint was asked');
    ok(paramOf(img, 'pano') === PANO.pano_id, 'the still is requested by panorama id, so it is the one the heading was computed from');
    const want = refBearing(PANO.location.lat, PANO.location.lng, HOUSE.lat, HOUSE.lon);
    const got = Number(paramOf(img, 'heading'));
    ok(near(((got - want + 540) % 360) - 180, 0, 0.5), `the camera is turned toward the house (asked ${got.toFixed(1)}°, the house is at ${want.toFixed(1)}°)`);
    ok(got > 0 && got < 90, 'which here is north-east — the camera is south-west of the house');
    ok(paramOf(img, 'size') === '640x267', 'the size asked for is the size of the box');
    ok(!calls.some(u => u.includes('/metadata') && !u.includes('source=outdoor')), 'the panorama is required to be an outdoor one');
    ok(out.headers['X-Pano-Date'] === '2025-06', 'when the panorama was shot is passed back to the page');

    // The one case where a computed heading is worse than none.
    const M2 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    const c2 = stub({ ...PANO, location: { lat: HOUSE.lat, lng: HOUSE.lon } });
    await M2.streetview({ lat: HOUSE.lat, lon: HOUSE.lon });
    const img2 = c2.find(u => !u.includes('/metadata'));
    ok(!paramOf(img2, 'heading') && paramOf(img2, 'location') === `${HOUSE.lat},${HOUSE.lon}`,
      'a camera standing on the house gets no computed heading — the bearing would be noise');
  }

  // ---- clamping ----------------------------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    const calls = stub(PANO);
    await M.streetview({ lat: HOUSE.lat, lon: HOUSE.lon, w: 4000, h: 4000, fov: 500, pitch: -800 });
    const img = calls.find(u => !u.includes('/metadata'));
    ok(paramOf(img, 'size') === '640x640', 'a size over the API ceiling is clamped to 640, not rejected');
    ok(paramOf(img, 'fov') === '120' && paramOf(img, 'pitch') === '-90', 'field of view and pitch are clamped to what the API accepts');
  }

  // ---- the failures ------------------------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    stub({ status: 'ZERO_RESULTS' });
    const none = await M.streetview({ lat: 38.1, lon: -122.9 });
    ok(none.status === 404 && none.body.code === 'no_imagery' && !none.buffer,
      'no Street View at a rural parcel is a 404 with code no_imagery, not an error');

    const M2 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    stub({ status: 'REQUEST_DENIED', error_message: 'The provided API key is invalid. ' });
    const denied = await M2.streetview({ lat: HOUSE.lat, lon: HOUSE.lon });
    ok(denied.status === 502 && denied.body.code === 'denied' && /invalid/.test(denied.body.error),
      'a refused key is reported as denied, with what Google said');

    const M3 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    stub({ status: 'OVER_QUERY_LIMIT' });
    ok((await M3.streetview({ lat: HOUSE.lat, lon: HOUSE.lon })).body.code === 'quota', 'an exhausted quota has its own code');

    const M4 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    stub(PANO, 403);
    const imgDenied = await M4.streetview({ lat: HOUSE.lat, lon: HOUSE.lon });
    ok(imgDenied.status === 502 && imgDenied.body.code === 'denied', 'a key that passes metadata and fails the image is still reported, not thrown');

    const M5 = freshMaps({});
    stub(PANO);
    const nokey = await M5.streetview({ lat: HOUSE.lat, lon: HOUSE.lon });
    ok(nokey.status === 503 && nokey.body.code === 'no_key', 'no key configured is a 503 with code no_key');

    const M6 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    const c6 = stub(PANO);
    for (const q of [{}, { lat: 'x', lon: 'y' }, { lat: 91, lon: 0 }, { lat: 0, lon: 181 }]) {
      const bad = await M6.streetview(q);
      if (bad.status !== 400 || bad.body.code !== 'bad_request') { ok(false, `bad coordinate ${JSON.stringify(q)} is a 400`); break; }
    }
    ok(c6.length === 0, 'a bad coordinate is turned away here — Google is never asked, so nothing is billed');

    const M7 = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    global.fetch = async () => { throw new Error('getaddrinfo ENOTFOUND'); };
    const off = await M7.streetview({ lat: HOUSE.lat, lon: HOUSE.lon });
    ok(off.status === 502 && !off.buffer && /ENOTFOUND/.test(off.body.error), 'no network is a 502 carrying the reason, not an exception');
  }

  // ---- the money ---------------------------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_API_KEY: 'k' });
    const calls = stub(PANO);
    const q = { lat: HOUSE.lat, lon: HOUSE.lon, w: 640, h: 267 };
    const a = await M.streetview(q);
    const n = calls.length;
    const b = await M.streetview(q);
    ok(calls.length === n, 'the same frame asked for twice is fetched once');
    ok(b.buffer === a.buffer && b.status === 200, 'and the second caller gets the same bytes');
    await M.streetview({ ...q, w: 192, h: 144 });
    ok(calls.length > n, 'a different size is a different frame and is fetched');
    ok(M._caches.FRAMES.size === 2, 'both are held');
  }

  // ---- the key the page is given -----------------------------------------
  {
    const M = freshMaps({ GOOGLE_MAPS_BROWSER_KEY: 'browser-key', GOOGLE_MAPS_API_KEY: 'server-key' });
    const c = M.config().body;
    ok(c.key === 'browser-key' && c.enabled, 'the page is served the browser key when there is one');

    const M2 = freshMaps({ GOOGLE_MAPS_API_KEY: 'server-key' });
    ok(M2.config().body.key === 'server-key', 'and falls back to the single Maps key');

    const M3 = freshMaps({ GEMINI_API_KEY: 'gemini-key' });
    const c3 = M3.config().body;
    ok(c3.key === '' && !c3.enabled && /GOOGLE_MAPS/.test(c3.reason),
      'the Gemini key is never handed to the browser — the page is told why instead');
    ok(M3.serverKey() === 'gemini-key', 'but it is used server side, where a single-project key is the same key');
  }

  // ---- the page -----------------------------------------------------------
  // The placeholders are what this whole change is about, so their absence is
  // asserted rather than assumed, and so is the wiring that replaced them.
  {
    const html = fs.readFileSync(__dirname + '/public/index.html', 'utf8');
    const app = fs.readFileSync(__dirname + '/public/app.js', 'utf8');
    ok(!/photo coming/i.test(html + app), 'no "photo coming" placeholder is left in the page');
    ok(!/photos\/[a-z]+\.jpg/.test(app), 'and none of the photo files that were never there are referenced');
    ok(/<script src="gmap\.js">/.test(html) && html.indexOf('gmap.js') < html.indexOf('app.js'), 'gmap.js is loaded, before app.js that uses it');
    ok(/\.sat\.gmap\s*\{[^}]*touch-action:\s*auto/.test(html), '.sat.gmap resets touch-action, or Google would never see a pinch');

    // app.js leans on the browser, so it is read rather than run: what matters
    // is that the two boxes point at the two features and nothing else.
    ok(/GMAP\.street\(c\.lat, c\.lon, 640, 267\)/.test(app), 'the pin preview asks the proxy for a still of the address');
    ok(/function satThumb[\s\S]{0,320}GMAP\.street/.test(app), 'so does the list thumbnail, at list size');
    ok(/loading="lazy"/.test(app.slice(app.indexOf('function satThumb'), app.indexOf('function satThumb') + 400)), 'and lazily, so scrolling past a row costs nothing');
    ok(/function lotMapHTML[\s\S]{0,700}SAT\.tile/.test(app), 'the lot view keeps the keyless Esri frame behind the Google map');
    ok(/GMAP\.mount\(host/.test(app), 'and mounts the interactive map into it');
    ok(/hero\.classList\.contains\('gmap'\)/.test(app), 'the hand-rolled lot drag stands down when the box is the Google map');
  }

  // ---- the browser module -------------------------------------------------
  // gmap.js in a bare sandbox: enough of a DOM to see what it would have done.
  {
    const cfg = { enabled: true, key: 'browser-key' };
    const head = [];
    // Enough of Google to answer: the script tag, when its src is set, calls
    // the callback back the way the real bootstrap does. Without that, load()
    // would simply never settle and the test would end in silence.
    const maps = { Map: function (el, o) { this.el = el; this.o = o; this.setCenter = () => {}; this.setZoom = () => {}; }, event: { trigger() {} } };
    const ctx = {
      console, setTimeout, clearTimeout, encodeURIComponent, isFinite, Promise, URL,
      window: {}, fetch: async () => ({ json: async () => cfg }),
      document: {
        head: { appendChild: s => { head.push(s); setTimeout(() => { ctx.window.google = { maps }; ctx.window.__gmapReady(); }, 0); } },
        createElement: () => ({ className: '', async: false, src: '', appendChild() {} }),
      },
    };
    ctx.window = ctx;
    vm.runInNewContext(fs.readFileSync(__dirname + '/public/gmap.js', 'utf8'), ctx);
    const G = ctx.window.GMAP;
    const u = G.street(37.94179, -122.55726, 640, 267);
    ok(u.startsWith('/api/streetview?'), 'the still is fetched from this app, not from Google — the key stays on the server');
    ok(/lat=37\.941790&lon=-122\.557260/.test(u), 'the coordinate is rounded to ~0.1 m, so two renders of an address share one cache entry');
    ok(G.street(37.94179, -122.55726, 4000, 4000).includes('w=640&h=640'), 'and the size never exceeds what the API sells');
    ok(G.street(NaN, 0, 100, 100) === '', 'an address with no coordinate asks for nothing');

    const gm = await G.load().catch(e => e);
    ok(gm === maps, 'load resolves with google.maps once the bootstrap calls back');
    const src = head[0] && head[0].src;
    ok(!!src && src.includes('key=browser-key'), 'the Maps script is loaded with the key the server served');
    ok(/loading=async/.test(src) && /callback=__gmapReady/.test(src), 'asynchronously, with a callback — the shape Google asks for');
    ok(typeof ctx.window.gm_authFailure === 'function', 'and a gm_authFailure hook, which is the only way a refused key is reported');

    // Mounting twice on the same property must not build a second map, and
    // must not throw away where the inspector dragged it.
    let built = 0;
    maps.Map = function (el, o) { built++; this.el = el; this.o = o; this.setCenter = () => { this.recentred = true; }; this.setZoom = () => {}; };
    const host = { children: [], appendChild(c) { this.children.push(c); c.parentElement = this; } };
    await G.mount(host, HOUSE.lat, HOUSE.lon, { key: 'a1' });
    await G.mount(host, HOUSE.lat, HOUSE.lon, { key: 'a1' });
    ok(built === 1, 'the map is built once and moved between hosts, not rebuilt per render');
    ok(host.children.length === 1, 'and appended to the host once');

    // The same module with the key withheld.
    const ctx2 = { ...ctx, window: {}, fetch: async () => ({ json: async () => ({ enabled: false, reason: 'No GOOGLE_MAPS_BROWSER_KEY is set.' }) }) };
    ctx2.window = ctx2;
    vm.runInNewContext(fs.readFileSync(__dirname + '/public/gmap.js', 'utf8'), ctx2);
    let why = null;
    await ctx2.window.GMAP.mount({ appendChild() {} }, 37.9, -122.5, {}).catch(e => { why = e.message; });
    ok(/GOOGLE_MAPS_BROWSER_KEY/.test(why || ''), 'with no key, mounting rejects with the reason — the caller keeps its fallback');
  }

  // ---- the service worker -------------------------------------------------
  {
    const sw = fs.readFileSync(__dirname + '/public/sw.js', 'utf8');
    ok(/\/api\/streetview/.test(sw) && /self\.location\.origin/.test(sw),
      'the service worker caches the stills too, so a property looked at twice is billed once');
  }

  // ---- live ---------------------------------------------------------------
  // One real round trip, if asked for. The metadata call is free; the still is
  // about $0.007. Reported rather than asserted: whether a given key carries
  // the Maps APIs is a fact about the Cloud project, not about this code.
  if (LIVE) {
    global.fetch = realFetch;
    const M = freshMaps(REAL);
    console.log('\n--- live, against Google -------------------------------------');
    if (!M.serverKey()) { console.log('no key in .env — skipped'); }
    else {
      const out = await M.streetview({ lat: HOUSE.lat, lon: HOUSE.lon, w: 400, h: 200 });
      if (out.buffer) {
        const f = require('path').join(require('os').tmpdir(), 'streetview-live.jpg');
        fs.writeFileSync(f, out.buffer);
        console.log(`OK   ${out.buffer.length} bytes, camera at ${out.headers['X-Pano-Metres']} m turned to ${out.headers['X-Pano-Heading']}°, shot ${out.headers['X-Pano-Date'] || 'unknown'}`);
        console.log(`     written to ${f} — open it and check it is pointing at a house`);
      } else {
        console.log(`${out.body.code.toUpperCase()}  ${out.body.error}`);
        if (out.body.code === 'denied') console.log('     Enable the Street View Static API on the Cloud project and add it to the key\'s API restrictions.');
      }
    }
  } else {
    console.log('\n(--live adds one real Street View round trip, about $0.007)');
  }

  console.log(fails ? `\n${fails} failed` : '\nall passed');
  process.exit(fails ? 1 : 0);
})();
