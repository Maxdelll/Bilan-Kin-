// Mise en cache pour un fonctionnement hors ligne.
// Après une mise à jour de index.html, changez VERSION pour que l'iPad récupère la nouvelle version.
const VERSION = 'bilan-kine-v2';
const FILES = ['./', 'index.html', 'manifest.webmanifest', 'icon-180.png', 'icon-192.png', 'icon-512.png', 'html2pdf.bundle.min.js'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  // Polices Google : depuis le cache d'abord, mises en cache au premier passage.
  if (url.hostname.endsWith('googleapis.com') || url.hostname.endsWith('gstatic.com')) {
    e.respondWith(caches.open(VERSION).then(c => c.match(e.request).then(hit => hit ||
      fetch(e.request).then(r => { c.put(e.request, r.clone()); return r; }))));
    return;
  }
  if (url.origin !== location.origin) return;
  // Fichiers de l'appli : réseau d'abord (pour les mises à jour), cache si hors ligne.
  e.respondWith(fetch(e.request)
    .then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); return r; })
    .catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('index.html'))));
});
