const CACHE_NAME = 'bidulgy-games-v20260817-mobile-responsive-1';

const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest'
];

self.addEventListener('install', event => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then(async cache => {
      for (const url of APP_SHELL) {
        try {
          const response = await fetch(url, {
            cache: 'reload'
          });

          if (response && response.ok) {
            await cache.put(url, response.clone());
          }
        } catch (error) {
          // 일부 파일을 가져오지 못해도 서비스 워커 설치는 계속 진행
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    (async () => {
      const cacheKeys = await caches.keys();

      await Promise.all(
        cacheKeys
          .filter(
            key =>
              key !== CACHE_NAME &&
              /bidulgy|pigeon|tower|game/i.test(key)
          )
          .map(key => caches.delete(key))
      );

      await self.clients.claim();
    })()
  );
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, {
      cache: 'no-store'
    });

    if (
      response &&
      response.ok &&
      request.method === 'GET'
    ) {
      await cache.put(
        request,
        response.clone()
      );
    }

    return response;
  } catch (error) {
    const cachedResponse = await cache.match(request, {
      ignoreSearch: false
    });

    if (cachedResponse) {
      return cachedResponse;
    }

    if (request.mode === 'navigate') {
      const fallback = await cache.match('./index.html');

      if (fallback) {
        return fallback;
      }
    }

    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') {
    return;
  }

  const url = new URL(request.url);

  // 외부 서버 파일은 건드리지 않습니다.
  if (url.origin !== self.location.origin) {
    return;
  }

  // 온라인 상태에서는 최신 서버 파일을 먼저 사용하고,
  // 실패했을 때만 캐시를 사용합니다.
  event.respondWith(
    networkFirst(request)
  );
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }

  if (event.data === 'CLEAR_GAME_CACHE') {
    event.waitUntil(
      caches.keys().then(keys =>
        Promise.all(
          keys
            .filter(key =>
              /bidulgy|pigeon|tower|game/i.test(key)
            )
            .map(key => caches.delete(key))
        )
      )
    );
  }
});