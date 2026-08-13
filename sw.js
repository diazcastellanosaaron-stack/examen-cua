/* Examen CUA · Agencia DNP — service worker
   Guarda la app completa en el dispositivo para que abra sin internet. */
const CACHE = 'examen-cua-vacbe91f5';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './icon-180.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  const esDocumento = e.request.mode === 'navigate' ||
                      e.request.destination === 'document' ||
                      url.pathname.endsWith('/') ||
                      url.pathname.endsWith('index.html');

  // La página: primero internet (para recibir actualizaciones), y si no hay, la copia guardada.
  if (esDocumento) {
    e.respondWith(
      fetch(e.request)
        .then(res => {
          if (res && res.ok) {
            const copia = res.clone();
            caches.open(CACHE).then(c => c.put('./index.html', copia));
          }
          return res;
        })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }

  // Todo lo demás (íconos, manifiesto): primero la copia guardada.
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => {
      if (hit) return hit;
      return fetch(e.request).then(res => {
        if (res && res.ok && res.type === 'basic') {
          const copia = res.clone();
          caches.open(CACHE).then(c => c.put(e.request, copia));
        }
        return res;
      });
    })
  );
});
