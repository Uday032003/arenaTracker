/**
 * Service Worker for Background Web Push Notifications
 * Receives push triggers and displays system desktop notifications even when browser tab is closed
 */

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let payload;
  try {
    payload = event.data.json();
  } catch (err) {
    payload = {
      title: '⏰ Reminder Alarm',
      body: event.data.text() || 'Your scheduled reminder is due now!',
    };
  }

  const title = payload.title || '⏰ Reminder Alarm';
  const options = {
    body: payload.body || 'Your scheduled reminder is due now!',
    icon: payload.icon || '/favicon.ico',
    badge: payload.badge || '/favicon.ico',
    vibrate: [300, 100, 300, 100, 300],
    tag: payload.data?.reminderId ? `reminder-${payload.data.reminderId}` : 'reminder-alarm',
    renotify: true,
    requireInteraction: true,
    data: payload.data || { url: '/reminders' },
    actions: [
      { action: 'view', title: 'View Reminder' },
      { action: 'close', title: 'Dismiss' },
    ],
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  const targetUrl = event.notification.data?.url || '/reminders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Focus existing tab if open
      for (const client of windowClients) {
        if (client.url && 'focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // If no tab is open, open a new window
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
