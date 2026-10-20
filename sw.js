/* Rotina — service worker: guarda o app no aparelho para abrir sem internet.
   Ao publicar uma versão nova do app, troque o número da VERSAO abaixo. */
const VERSAO = 'rotina-v5';
const ARQUIVOS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSAO).then(c => c.addAll(ARQUIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(nomes => Promise.all(nomes.filter(n => n !== VERSAO).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Abrir o app: tenta a internet (pega versão nova), senão usa a cópia guardada.
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then(r => { const copia = r.clone(); caches.open(VERSAO).then(c => c.put('./index.html', copia)); return r; })
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Fonte (Google Fonts): guarda na primeira vez e depois usa offline.
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    e.respondWith(
      caches.match(req).then(salvo => salvo || fetch(req).then(r => {
        const copia = r.clone(); caches.open(VERSAO).then(c => c.put(req, copia)); return r;
      }).catch(() => salvo))
    );
    return;
  }

  // Demais arquivos do app: usa a cópia guardada, senão busca.
  if (url.origin === location.origin) {
    e.respondWith(caches.match(req).then(salvo => salvo || fetch(req)));
  }
});
