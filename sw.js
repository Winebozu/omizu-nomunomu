// Service Worker (sw.js) - エラー修正版
'use strict';

const CACHE_NAME = 'hydration-app-v1';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './icon.svg'
];

// Service Worker インストール
self.addEventListener('install', function(event) {
  console.log('Service Worker: インストール中');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(function(cache) {
        console.log('Service Worker: キャッシュを開きました');
        return cache.addAll(urlsToCache);
      })
      .catch(function(error) {
        console.log('Service Worker: キャッシュエラー', error);
      })
  );
});

// Service Worker アクティベート
self.addEventListener('activate', function(event) {
  console.log('Service Worker: アクティベート中');
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(cacheName) {
          if (cacheName !== CACHE_NAME) {
            console.log('Service Worker: 古いキャッシュを削除', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// リクエストの処理
self.addEventListener('fetch', function(event) {
  event.respondWith(
    caches.match(event.request)
      .then(function(response) {
        // キャッシュにあれば返す
        if (response) {
          return response;
        }
        
        // ネットワークから取得
        return fetch(event.request).catch(function() {
          // ネットワークエラーの場合はオフラインページ
          if (event.request.destination === 'document') {
            return caches.match('./index.html');
          }
        });
      })
  );
});

// 通知クリック処理
self.addEventListener('notificationclick', function(event) {
  console.log('Service Worker: 通知がクリックされました');
  event.notification.close();

  event.waitUntil(
    clients.matchAll({
      type: 'window'
    }).then(function(clientList) {
      // 既にアプリが開いている場合はフォーカス
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // アプリが開いていない場合は新しいウィンドウを開く
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// プッシュ通知処理（将来的な拡張用）
self.addEventListener('push', function(event) {
  console.log('Service Worker: プッシュ通知を受信');
  
  var options = {
    body: '100mlの水を飲みましょう',
    icon: './icon.svg',
    badge: './icon.svg',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 'hydration'
    },
    actions: [
      {
        action: 'drink',
        title: '飲んだ！',
        icon: './icon.svg'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: './icon.svg'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('💧 水分補給の時間です！', options)
  );
});

// メッセージ処理
self.addEventListener('message', function(event) {
  console.log('Service Worker: メッセージを受信', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// エラーハンドリング
self.addEventListener('error', function(event) {
  console.error('Service Worker: エラーが発生しました', event.error);
});

// 未処理のPromiseリジェクションをキャッチ
self.addEventListener('unhandledrejection', function(event) {
  console.error('Service Worker: 未処理のPromiseリジェクション', event.reason);
  event.preventDefault();
});
