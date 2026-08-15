const CACHE_NAME = 'bidulgy-games-v20260813-1';
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
          const response = await fetch(url, { cache: 'reload' });
          if (response && response.ok) await cache.put(url, response.clone());
        } catch (_) {
          // 설치 시 일부 파일을 못 받아도 서비스 워커 자체는 활성화한다.
        }
      }
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(
      keys
        .filter(key => key !== CACHE_NAME && /bidulgy|pigeon|tower|game/i.test(key))
        .map(key => caches.delete(key))
    );
    await self.clients.claim();
  })());
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);

  try {
    const response = await fetch(request, { cache: 'no-store' });

    if (response && response.ok && request.method === 'GET') {
      await cache.put(request, response.clone());
    }

    return response;
  } catch (error) {
    const cached = await cache.match(request, {
      ignoreSearch: false
    });

    if (cached) return cached;

    if (request.mode === 'navigate') {
      const fallback = await cache.match('./index.html');

      if (fallback) return fallback;
    }

    throw error;
  }
}

self.addEventListener('fetch', event => {
  const request = event.request;

  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin !== self.location.origin) return;

  // HTML / JS / CSS / manifest / 아이콘 모두
  // 인터넷 연결 시 서버의 최신 파일을 먼저 가져옵니다.
  event.respondWith(networkFirst(request));
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});