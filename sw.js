// FACT TOK service worker (app install + basic offline)
// Jab app.html ya ft.social.js badlein to VERSION barha dein (v2, v3...) taake naya code load ho.
const VERSION = 'v1';
const CACHE = 'facttok-' + VERSION;
const SHELL = [
  './app.html',
  './ft.social.js',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(CACHE).then(function (c) {
      // har file alag add hoti hai, koi file na mile to baaki phir bhi cache ho jayein
      return Promise.all(SHELL.map(function (u) { return c.add(u).catch(function () {}); }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return;          // fonts, CDN, videos wagera ko na chherein
  if (req.headers.has('range')) return;                // video streaming
  if (/^\/(api|socket\.io)\b/.test(url.pathname)) return; // server API cache nahi hoti

  // pehle network (taake hamesha naya code mile), na chale to cache
  e.respondWith(
    fetch(req).then(function (res) {
      if (res && res.status === 200) {
        var copy = res.clone();
        caches.open(CACHE).then(function (c) { c.put(req, copy); });
      }
      return res;
    }).catch(function () {
      return caches.match(req).then(function (r) { return r || caches.match('./app.html'); });
    })
  );
});
