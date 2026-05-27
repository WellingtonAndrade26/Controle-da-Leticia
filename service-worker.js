const CACHE_NAME = "controle-leticia-v1";

const arquivosParaCache = [
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
      return cache.addAll(arquivosParaCache);
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    caches.match(event.request).then(function (resposta) {
      return resposta || fetch(event.request);
    })
  );
});