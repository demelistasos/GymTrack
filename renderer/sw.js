// GymTrack · λειτουργία χωρίς internet (service worker)
// Πρώτα προσπαθεί από το internet (για να έχεις πάντα την τελευταία έκδοση).
// Αν δεν υπάρχει σήμα ή αργεί, ανοίγει το αντίγραφο που κρατάει το κινητό.
const CACHE = 'gymtrack-__CACHE__';
const FILES = [
  './', 'index.html', 'manifest.webmanifest', 'logo.svg', 'css/app.css', 'fonts/Commissioner.ttf',
  'icons/apple-touch-icon.png', 'icons/icon-192.png', 'icons/icon-512.png',
  'js/defaults.js', 'js/core.js', 'js/ui.js', 'js/pages/today.js', 'js/pages/workout.js', 'js/pages/food.js',
  'js/pages/progress.js', 'js/pages/shop.js', 'js/pages/settings.js', 'js/update.js', 'js/web.js', 'js/app.js'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith((async () => {
    const cache = await caches.open(CACHE);
    const fromNet = fetch(req).then(res => { if (res.ok) cache.put(req, res.clone()); return res; });
    fromNet.catch(() => {});
    // αν το internet αργεί πάνω από 2,5″ (π.χ. υπόγειο γυμναστηρίου), ανοίγει από το κινητό
    const slow = new Promise(r => setTimeout(r, 2500)).then(() => cache.match(req, { ignoreSearch: true }));
    try {
      const res = await Promise.race([fromNet, slow]);
      if (res) return res;
      return await fromNet;
    } catch {
      return (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    }
  })());
});
