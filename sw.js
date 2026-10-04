const CACHE_NAME = 'coremax-ai-v3';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Syne:wght@700;800&family=JetBrains+Mono:wght@500;700&display=swap'
];

// Установка Service Worker и кэширование базовых ресурсов
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch((err) => {
        console.warn('Не удалось предварительно закэшировать часть ресурсов:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Активация и удаление устаревших версий кэша
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Обработка запросов (Network First с падением в кэш для HTML, Cache First для ассетов)
self.addEventListener('fetch', (event) => {
  // Пропускаем не-GET запросы и расширения браузера
  if (event.request.method !== 'GET' || !event.request.url.startsWith('http')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Возвращаем из кэша и фоново обновляем (Stale-While-Revalidate)
        fetch(event.request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => cache.put(event.request, responseClone));
            }
          })
          .catch(() => {/* Офлайн */});
        return cachedResponse;
      }

      // Если в кэше нет — запрашиваем сеть и сохраняем
      return fetch(event.request)
        .then((networkResponse) => {
          if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
            return networkResponse;
          }
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
          return networkResponse;
        })
        .catch(() => {
          // Если сеть недоступна и это запрос страницы — возвращаем index.html из кэша
          if (event.request.mode === 'navigate') {
            return caches.match('./index.html') || caches.match('/');
          }
        });
    })
  );
});
