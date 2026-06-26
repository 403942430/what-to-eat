// 缓存策略：首次访问时缓存所有资源，之后离线可用
const CACHE_NAME = 'what-to-eat-v2';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      // 缓存命中 → 直接返回
      if (cached) return cached;
      // 未命中 → 网络请求，成功则缓存
      return fetch(event.request).then((response) => {
        if (response.ok) {
          const cloned = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, cloned));
        }
        return response;
      });
    })
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)))
    )
  );
});
