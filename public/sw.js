// Tile cache: every map tile and satellite thumbnail is stored on first sight and served
// from Cache Storage after that, so nothing seen once is ever downloaded again.
//
// The Street View stills go in here too, and for a second reason: the tiles are
// free and those are billed per request, so a property looked at twice must
// cost once. They are same-origin (/api/streetview, which proxies Google and
// keeps the key off the page) and keyed by the whole URL, so a different size
// or a different address is a different entry. Only successful frames are
// stored — a 404 means there is no imagery there yet, and that can change.
const CACHE = 'tiles-v1', MAX = 6000;
const TILE_HOSTS = ['tile.openstreetmap.org', 'services.arcgisonline.com', 'server.arcgisonline.com', 'basemap.nationalmap.gov'];
const STREETVIEW = '/api/streetview';
let puts = 0;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  const mine = TILE_HOSTS.includes(u.hostname) ||
    (u.origin === self.location.origin && u.pathname === STREETVIEW);
  if (e.request.method !== 'GET' || !mine) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const hit = await cache.match(e.request, { ignoreVary: true });
    if (hit) return hit;
    const res = await fetch(e.request);
    if (res && (res.ok || res.type === 'opaque')) {
      cache.put(e.request, res.clone()).then(() => { if (++puts % 100 === 0) trim(cache); }).catch(() => {});
    }
    return res;
  })());
});
async function trim(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX) return;
  for (const k of keys.slice(0, keys.length - MAX)) await cache.delete(k);   // oldest first
}
