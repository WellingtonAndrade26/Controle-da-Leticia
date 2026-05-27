const CACHE_NAME = "controle-da-leticia-v4";

const ARQUIVOS = [
  "./",
  "./index.html",
  "./style.css",
  "./script.js",
  "./manifest.json",
  "./imagens/banner-topo.png",
  "./imagens/icon-192.png",
  "./imagens/icon-512.png"
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