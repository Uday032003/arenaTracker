/**
 * Browser Notification Helper
 * Requests permission and displays desktop notifications for due reminders
 */

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn('[Notifications] Browser does not support desktop notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
}

export function sendBrowserNotification(title, options = {}) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }

  try {
    const notification = new Notification(title, {
      icon: '/vite.svg',
      badge: '/vite.svg',
      vibrate: [200, 100, 200],
      requireInteraction: true, // keeps notification active until user clicks or dismisses
      ...options,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    return notification;
  } catch (err) {
    console.error('[Notifications] Failed to display notification:', err);
    return null;
  }
}
