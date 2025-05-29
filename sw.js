// Service Worker (sw.js)
const CACHE_NAME = 'hydration-app-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  'https://unpkg.com/react@18/umd/react.development.js',
  'https://unpkg.com/react-dom@18/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone/babel.min.js',
  'https://cdn.tailwindcss.com'
];

// Service Worker インストール
self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('キャッシュ失敗:', error);
      })
  );
});

// キャッシュからリソースを取得
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにあれば返す、なければネットワークから取得
        if (response) {
          return response;
        }
        return fetch(event.request);
      }
    )
  );
});

// バックグラウンド同期（実験的機能）
self.addEventListener('sync', function(event) {
  if (event.tag === 'hydration-reminder') {
    event.waitUntil(doHydrationReminder());
  }
});

// 定期的な通知チェック（実験的）
function doHydrationReminder() {
  return new Promise(function(resolve) {
    // LocalStorageは Service Worker では使用できないため、
    // IndexedDB や Cache API を使用する必要があります
    
    // 簡易的な通知送信
    self.registration.showNotification('💧 水分補給の時間です！', {
      body: '100mlの水を飲みましょう',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: 'hydration-reminder',
      requireInteraction: true,
      vibrate: [200, 100, 200],
      actions: [
        {
          action: 'drink',
          title: '飲んだ！',
          icon: '/icon.svg'
        },
        {
          action: 'snooze',
          title: '10分後に再通知',
          icon: '/icon.svg'
        }
      ]
    });
    
    resolve();
  });
}

// 通知クリック処理
self.addEventListener('notificationclick', function(event) {
  event.notification.close();

  if (event.action === 'drink') {
    // 「飲んだ！」アクション
    event.waitUntil(
      clients.openWindow('/')
    );
  } else if (event.action === 'snooze') {
    // 「10分後に再通知」アクション
    setTimeout(() => {
      self.registration.showNotification('💧 水分補給リマインダー', {
        body: 'もう一度、100mlの水を飲みましょう',
        icon: '/icon.svg',
        tag: 'hydration-snooze'
      });
    }, 10 * 60 * 1000); // 10分後
  } else {
    // 通知をクリックした場合、アプリを開く
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// プッシュ通知（将来的な拡張用）
self.addEventListener('push', function(event) {
  const options = {
    body: '100mlの水を飲みましょう',
    icon: '/icon.svg',
    badge: '/icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: '2'
    }
  };

  event.waitUntil(
    self.registration.showNotification('💧 水分補給の時間です！', options)
  );
});
