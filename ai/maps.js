// Google Maps Platform — the two things this app asks of it.
//
//   street view  A photograph of the front of a property, for the preview that
//                opens when a pin is tapped. It comes through here rather than
//                straight from the page for two reasons. The key stays on the
//                server. And the camera can be aimed: the Static API, handed
//                only a house coordinate, returns whatever the nearest
//                panorama happens to be looking at — usually straight down the
//                road. Which way the house is from the camera cannot be known
//                without knowing where the camera is standing, so the free
//                metadata endpoint is asked first and the heading is the
//                bearing from that panorama to the address.
//   the map key  The Maps JavaScript API runs in the browser and there is no
//                proxying that — the key has to reach the page. It is served
//                from here, from its own variable, so it can be a different
//                and referrer-restricted key from the one the Gemini calls
//                use. See .env.
//
// Both are billed per request, so a frame already fetched this process is kept
// and handed back without a second round trip. The browser and the service
// worker cache on top of that, so a property looked at twice costs once.
require('./env')();

const D2R = Math.PI / 180;
const META = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const IMG = 'https://maps.googleapis.com/maps/api/streetview';

// The server-side key, for the Street View proxy. Falls back to the Gemini key
// because on a single-project setup it is the same key — it only has to carry
// the Street View Static API in its restrictions.
const serverKey = () => process.env.GOOGLE_MAPS_API_KEY || process.env.GEMINI_API_KEY || '';
// The key the page is given for the Maps JavaScript API. No fallback to the
// Gemini key: that one is never deliberately handed to a browser.
const browserKey = () => process.env.GOOGLE_MAPS_BROWSER_KEY || process.env.GOOGLE_MAPS_API_KEY || '';

// Initial bearing from one coordinate to another, in degrees clockwise from
// north — which is exactly what the Static API means by `heading`.
function bearing(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * D2R, p2 = lat2 * D2R, dl = (lon2 - lon1) * D2R;
  const y = Math.sin(dl) * Math.cos(p2);
  const x = Math.cos(p1) * Math.sin(p2) - Math.sin(p1) * Math.cos(p2) * Math.cos(dl);
  return (Math.atan2(y, x) / D2R + 360) % 360;
}

// Great-circle metres. Only ever used over a street's width, so the spherical
// form is far more precision than the question needs.
function metres(lat1, lon1, lat2, lon2) {
  const p1 = lat1 * D2R, p2 = lat2 * D2R, dp = p2 - p1, dl = (lon2 - lon1) * D2R;
  const a = Math.sin(dp / 2) ** 2 + Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.min(1, Math.sqrt(a)));
}

const num = (v, dflt) => { const n = Number(v); return isFinite(n) ? n : dflt; };
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

// ---------------------------------------------------------------- caching
// Keyed by the request, not by the address: two sizes of the same house are
// two billable frames. Bounded, because the frames are the only thing in this
// process that grows — 60 of them is a few megabytes and more properties than
// a day's inspecting touches. Oldest out first.
const FRAMES = new Map();
const METAS = new Map();
const MAX_FRAMES = 60, MAX_METAS = 400;
function keep(map, k, v, max) {
  map.set(k, v);
  while (map.size > max) map.delete(map.keys().next().value);
  return v;
}

/** What the page needs to boot the Maps JavaScript API. */
function config() {
  const key = browserKey();
  return {
    status: 200,
    body: {
      key,
      enabled: !!key,
      // Said plainly so the page can report the reason rather than show an
      // empty box, and so `npm run ai:check`-style probes can read it.
      reason: key ? null : 'No GOOGLE_MAPS_BROWSER_KEY or GOOGLE_MAPS_API_KEY is set.',
      streetview: !!serverKey(),
    },
  };
}

// The panorama nearest a coordinate, and where its camera stands. Free, and
// the only way to aim the frame that follows.
async function metadata(lat, lon, key, radius) {
  const url = `${META}?location=${lat},${lon}&radius=${radius}&source=outdoor&key=${encodeURIComponent(key)}`;
  const ck = `${lat},${lon},${radius}`;
  if (METAS.has(ck)) return METAS.get(ck);
  const r = await fetch(url);
  // A non-200 here is the transport failing, not "no imagery" — the service
  // answers 200 with a status field for both of those.
  if (!r.ok) throw Object.assign(new Error(`street view metadata: HTTP ${r.status}`), { code: 'upstream' });
  const j = await r.json();
  return keep(METAS, ck, j, MAX_METAS);
}

/**
 * A still of the front of a property, aimed at it.
 *
 * @param {object} q  lat, lon (required); w, h, fov, pitch, radius (optional)
 * @returns {Promise<{status:number, type?:string, buffer?:Buffer, headers?:object, body?:object}>}
 *   A frame, or a JSON error carrying a `code` the page can branch on:
 *   `no_key`, `bad_request`, `no_imagery`, `denied`, `quota`, `upstream`.
 */
async function streetview(q) {
  q = q || {};
  const key = serverKey();
  if (!key) return { status: 503, body: { error: 'No Google Maps key is configured.', code: 'no_key' } };

  const lat = num(q.lat, NaN), lon = num(q.lon, NaN);
  if (!isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return { status: 400, body: { error: 'lat and lon are required, as numbers', code: 'bad_request' } };
  }
  // The Static API tops out at 640 on a side and has no scale parameter, so
  // that is the ceiling rather than a choice.
  const w = Math.round(clamp(num(q.w, 640), 16, 640));
  const h = Math.round(clamp(num(q.h, 400), 16, 640));
  const fov = Math.round(clamp(num(q.fov, 78), 10, 120));
  const pitch = Math.round(clamp(num(q.pitch, 0), -90, 90));
  // How far from the address a panorama may stand and still be this house's.
  // 60 m covers a long driveway; much more and the frame starts belonging to
  // the neighbour, which is the one thing a citation photograph must not do.
  const radius = Math.round(clamp(num(q.radius, 60), 5, 200));

  const ck = `${lat.toFixed(6)},${lon.toFixed(6)},${w}x${h},${fov},${pitch},${radius}`;
  const hit = FRAMES.get(ck);
  if (hit) return { status: 200, type: hit.type, buffer: hit.buffer, headers: hit.headers };

  let meta;
  try { meta = await metadata(lat, lon, key, radius); }
  catch (e) { return { status: 502, body: { error: e.message, code: e.code || 'upstream' } }; }

  if (meta.status !== 'OK') {
    const code = meta.status === 'ZERO_RESULTS' || meta.status === 'NOT_FOUND' ? 'no_imagery'
      : meta.status === 'OVER_QUERY_LIMIT' ? 'quota'
        : meta.status === 'REQUEST_DENIED' ? 'denied' : 'upstream';
    // 404 for "there is no Street View here", which is an ordinary fact about
    // a rural parcel and not a fault; anything else is the service refusing.
    return {
      status: code === 'no_imagery' ? 404 : code === 'denied' ? 502 : 502,
      body: {
        error: meta.error_message || `Street View returned ${meta.status}.`,
        code, status: meta.status,
      },
    };
  }

  // Aim it. The panorama's own coordinate is where the camera stands, so the
  // bearing from there to the address is the direction the house is in.
  const at = meta.location || {};
  const away = isFinite(at.lat) && isFinite(at.lng) ? metres(at.lat, at.lng, lat, lon) : 0;
  const head = away >= 4 ? bearing(at.lat, at.lng, lat, lon) : null;

  const p = new URLSearchParams({ size: `${w}x${h}`, fov: String(fov), pitch: String(pitch), return_error_code: 'true', key });
  // Requested by panorama id, so the frame is the one the heading was computed
  // from — handing `location` back could snap to a different pano and leave
  // the camera pointing at nothing. Below 4 m the bearing is noise (the
  // camera is effectively on top of the house), and there `location` is
  // better: the service then aims at the point itself.
  if (meta.pano_id && head != null) { p.set('pano', meta.pano_id); p.set('heading', head.toFixed(1)); }
  else p.set('location', `${lat},${lon}`);

  const r = await fetch(`${IMG}?${p}`);
  if (!r.ok) {
    const text = await r.text().catch(() => '');
    return { status: 502, body: { error: text.trim() || `street view image: HTTP ${r.status}`, code: r.status === 403 ? 'denied' : 'upstream' } };
  }
  const buffer = Buffer.from(await r.arrayBuffer());
  const type = r.headers.get('content-type') || 'image/jpeg';
  const headers = {
    // A panorama of a street does not change between two taps on a pin, and
    // every re-fetch is billed. A day is long enough to cover an inspection
    // and short enough that a re-shot street is picked up next morning.
    'Cache-Control': 'public, max-age=86400',
    'X-Pano-Heading': head == null ? 'auto' : head.toFixed(1),
    'X-Pano-Metres': away.toFixed(1),
  };
  if (meta.date) headers['X-Pano-Date'] = String(meta.date);
  if (meta.copyright) headers['X-Pano-Credit'] = String(meta.copyright).replace(/[^\x20-\x7E]/g, '');

  keep(FRAMES, ck, { type, buffer, headers }, MAX_FRAMES);
  return { status: 200, type, buffer, headers };
}

module.exports = { config, streetview, bearing, metres, serverKey, browserKey, _caches: { FRAMES, METAS } };
