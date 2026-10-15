import { PushService } from './push.service.js';

let schedulerInterval = null;

export function startPushScheduler(intervalMs = 30000) {
  if (schedulerInterval) return;

  console.log(`[PushScheduler] Started background reminder alarm push scheduler (every ${intervalMs / 1000}s)`);

  // Run initial check after 5s startup delay
  setTimeout(async () => {
    try {
      await PushService.checkAndDispatchDueReminders();
    } catch (err) {
      console.error('[PushScheduler] Initial check error:', err);
    }
  }, 5000);

  // Periodic interval
  schedulerInterval = setInterval(async () => {
    try {
      await PushService.checkAndDispatchDueReminders();
    } catch (err) {
      console.error('[PushScheduler] Periodic check error:', err);
    }
  }, intervalMs);
}

export function stopPushScheduler() {
  if (schedulerInterval) {
    clearInterval(schedulerInterval);
    schedulerInterval = null;
    console.log('[PushScheduler] Stopped background push scheduler');
  }
}
