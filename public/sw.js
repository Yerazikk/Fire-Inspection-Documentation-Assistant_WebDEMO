// Tile cache: every map tile and satellite thumbnail is stored on first sight and served
// from Cache Storage after that, so nothing seen once is ever downloaded again.
const CACHE = 'tiles-v1', MAX = 6000;
const TILE_HOSTS = ['tile.openstreetmap.org', 'services.arcgisonline.com', 'server.arcgisonline.com', 'basemap.nationalmap.gov'];
let puts = 0;
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', e => e.waitUntil(self.clients.claim()));
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET' || !TILE_HOSTS.includes(u.hostname)) return;
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
