import { pushApi } from '../services/api.js';

/**
 * Convert a base64 string to a Uint8Array for PushManager
 */
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

/**
 * Check if the browser supports Service Worker and Web Push
 */
export function isPushSupported() {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  );
}

/**
 * Register the Service Worker
 */
export async function registerServiceWorker() {
  if (!isPushSupported()) return null;

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    return registration;
  } catch (err) {
    console.error('[WebPush] Service Worker registration failed:', err);
    return null;
  }
}

/**
 * Get current push subscription if active
 */
export async function getExistingPushSubscription() {
  if (!isPushSupported()) return null;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();
    return subscription;
  } catch (err) {
    console.warn('[WebPush] Error getting push subscription:', err);
    return null;
  }
}

/**
 * Subscribe the user's browser device to background push notifications
 */
export async function subscribeToPushNotifications() {
  if (!isPushSupported()) {
    throw new Error('Push notifications are not supported in this browser.');
  }

  // 1. Request notification permission
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted by browser.');
  }

  // 2. Ensure Service Worker is ready
  await registerServiceWorker();
  const reg = await navigator.serviceWorker.ready;

  // 3. Fetch public VAPID key from backend
  const keyRes = await pushApi.getPublicKey();
  const vapidPublicKey = keyRes?.data?.publicKey;
  if (!vapidPublicKey) {
    throw new Error('Could not retrieve VAPID public key from server.');
  }

  // 4. Subscribe with PushManager
  const convertedVapidKey = urlBase64ToUint8Array(vapidPublicKey);
  let subscription = await reg.pushManager.getSubscription();

  if (!subscription) {
    subscription = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey,
    });
  }

  // 5. Save subscription to backend database
  const subJson = subscription.toJSON();
  await pushApi.subscribe({
    endpoint: subscription.endpoint,
    keys: {
      p256dh: subJson.keys?.p256dh,
      auth: subJson.keys?.auth,
    },
  });

  return subscription;
}

/**
 * Unsubscribe user from push notifications
 */
export async function unsubscribeFromPushNotifications() {
  if (!isPushSupported()) return;

  try {
    const reg = await navigator.serviceWorker.ready;
    const subscription = await reg.pushManager.getSubscription();

    if (subscription) {
      const endpoint = subscription.endpoint;
      await subscription.unsubscribe();
      await pushApi.unsubscribe({ endpoint });
    }
  } catch (err) {
    console.error('[WebPush] Unsubscribe error:', err);
    throw err;
  }
}
