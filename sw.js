// Service Worker：オフラインでもアプリが開けるようにするための仕組み。
// 「まずネットから最新を取りに行き、取れなければキャッシュ（保存済み）を使う」方式にして、
// 電波があるときは常に最新版が表示されるようにする。
const CACHE_NAME = "menu-app-v6";
const FILES_TO_CACHE = [
  "./",
  "./index.html",
  "./pantry.html",
  "./dislikes.html",
  "./menus.html",
  "./css/style.css",
  "./js/app.js",
  "./js/pantry.js",
  "./js/dislikes.js",
  "./js/menus.js",
  "./manifest.json",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  self.skipWaiting(); // 新しいバージョンをすぐ有効にする
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(FILES_TO_CACHE))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(), // 開いているページをすぐ新しいバージョンに切り替える
    ])
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
