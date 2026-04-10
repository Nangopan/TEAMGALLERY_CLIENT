// public/sw.js
self.addEventListener('push', function(event) {
  if (!event.data) return;

  const data = event.data.json();

  const options = {
    body: data.message,
    icon: '/icon-192x192.png', // Small icon (app logo)
    image: data.image,         // 🟢 THE PREVIEW IMAGE
    badge: '/badge.png',       // Status bar icon (Android)
    data: {
      url: data.url || '/user/gallery'
    },
    vibrate: [100, 50, 100],
    actions: [
      { action: 'open', title: 'View in Gallery' }
    ]
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the gallery page when clicked
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});