const CACHE_NAME = 'ai-site-cache-v2';
const urlsToCache = [
  '/',
  '/index.html',
  '/filter_search.html',
  // 실제 경로로 수정
  '/assets/css/tailwind.min.css',
  '/assets/css/optimized.css',
  // 아이콘 실제 경로
  '/icon/icon-192.png',
  '/icon/icon-512.png'
];

// 설치 단계: 캐시 초기화
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      console.log('Opened cache');
      return cache.addAll(urlsToCache);
    })
  );
});

// 요청 가로채기: 캐시에서 응답
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        return response || fetch(event.request);
      })
  );
});
