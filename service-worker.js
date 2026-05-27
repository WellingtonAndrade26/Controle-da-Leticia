const CACHE_NAME = "controle-da-leticia-v6";

const ARQUIVOS = [
  "/Controle-da-Leticia/",
  "/Controle-da-Leticia/index.html",
  "/Controle-da-Leticia/style.css",
  "/Controle-da-Leticia/script.js",
  "/Controle-da-Leticia/manifest.json",
  "/Controle-da-Leticia/service-worker.js",
  "/Controle-da-Leticia/images/Logo-leticia.png",
  "/Controle-da-Leticia/images/icon-192.png",
  "/Controle-da-Leticia/images/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) {
      return cache.addAll(ARQUIVOS);
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (nomesCaches) {
      return Promise.all(
        nomesCaches.map(function (nomeCache) {
          if (nomeCache !== CACHE_NAME) {
            return caches.delete(nomeCache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (resposta) {
      return resposta || fetch(event.request);
    })
  );
});