import webpush from 'web-push';
import { query } from '../../config/db.js';
import { env } from '../../config/env.js';

// Initialize web-push with VAPID details
webpush.setVapidDetails(
  env.VAPID_SUBJECT,
  env.VAPID_PUBLIC_KEY,
  env.VAPID_PRIVATE_KEY
);

export class PushService {
  static getPublicKey() {
    return env.VAPID_PUBLIC_KEY;
  }

  /**
   * Save or update a push subscription for a user
   */
  static async saveSubscription(userId, { endpoint, keys, userAgent = '' }) {
    if (!endpoint || !keys || !keys.p256dh || !keys.auth) {
      throw new Error('Invalid push subscription payload');
    }

    const { rows } = await query(
      `INSERT INTO push_subscriptions (user_id, endpoint, p256dh, auth, user_agent, updated_at)
       VALUES ($1, $2, $3, $4, $5, CURRENT_TIMESTAMP)
       ON CONFLICT (endpoint)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         p256dh = EXCLUDED.p256dh,
         auth = EXCLUDED.auth,
         user_agent = EXCLUDED.user_agent,
         updated_at = CURRENT_TIMESTAMP
       RETURNING id, user_id, endpoint, created_at`,
      [userId, endpoint, keys.p256dh, keys.auth, userAgent]
    );

    return rows[0];
  }

  /**
   * Remove a push subscription by endpoint
   */
  static async removeSubscription(userId, endpoint) {
    await query(
      `DELETE FROM push_subscriptions
       WHERE user_id = $1 AND endpoint = $2`,
      [userId, endpoint]
    );
  }

  /**
   * Check if user has active push subscriptions
   */
  static async getSubscriptionStatus(userId) {
    const { rows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM push_subscriptions
       WHERE user_id = $1`,
      [userId]
    );
    return { isSubscribed: rows[0].count > 0, count: rows[0].count };
  }

  /**
   * Send push notification to a specific subscription
   */
  static async sendNotification(subscription, payload) {
    const pushSub = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth,
      },
    };

    const stringifiedPayload = typeof payload === 'string' ? payload : JSON.stringify(payload);

    try {
      await webpush.sendNotification(pushSub, stringifiedPayload);
      return { success: true };
    } catch (err) {
      // If subscription is expired (404/410), delete it automatically
      if (err.statusCode === 404 || err.statusCode === 410) {
        console.warn(`[PushService] Subscription expired (${err.statusCode}), deleting: ${subscription.endpoint}`);
        await query(`DELETE FROM push_subscriptions WHERE endpoint = $1`, [subscription.endpoint]);
      } else {
        console.error('[PushService] Error sending push notification:', err.message);
      }
      return { success: false, error: err.message, statusCode: err.statusCode };
    }
  }

  /**
   * Send push notification to all active subscriptions of a user
   */
  static async sendToUser(userId, payload) {
    const { rows } = await query(
      `SELECT endpoint, p256dh, auth
       FROM push_subscriptions
       WHERE user_id = $1`,
      [userId]
    );

    if (rows.length === 0) {
      return { sent: 0, failed: 0 };
    }

    let sent = 0;
    let failed = 0;

    await Promise.allSettled(
      rows.map(async (sub) => {
        const res = await this.sendNotification(sub, payload);
        if (res.success) sent++;
        else failed++;
      })
    );

    return { sent, failed };
  }

  /**
   * Check all due reminders in database and send web push notifications to users
   */
  static async checkAndDispatchDueReminders() {
    try {
      // Find reminders that are due now, have alarms enabled, and haven't been pushed in the last 15 minutes
      const { rows: dueReminders } = await query(
        `SELECT r.id, r.user_id, r.title, r.type, r.amount, r.currency,
                r.due_datetime, r.notes, r.snoozed_until, r.last_pushed_at
         FROM reminders r
         WHERE r.alarm_enabled = true
           AND r.status NOT IN ('completed', 'dismissed')
           AND (
             (r.snoozed_until IS NOT NULL AND r.snoozed_until <= CURRENT_TIMESTAMP)
             OR (
               r.snoozed_until IS NULL
               AND (r.due_datetime - (COALESCE(r.remind_before_days, 0) || ' days')::INTERVAL) <= CURRENT_TIMESTAMP
             )
           )
           AND (
             r.last_pushed_at IS NULL
             OR r.last_pushed_at < (CURRENT_TIMESTAMP - INTERVAL '15 minutes')
           )
         ORDER BY r.due_datetime ASC`
      );

      if (dueReminders.length === 0) return 0;

      for (const reminder of dueReminders) {
        const amountText = reminder.amount
          ? `Amount: ${reminder.currency || '₹'}${Number(reminder.amount).toLocaleString()} • Due Now`
          : (reminder.notes ? reminder.notes.slice(0, 80) : 'Your scheduled reminder is due now!');

        const pushPayload = {
          title: `⏰ Reminder Alarm: ${reminder.title}`,
          body: amountText,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          data: {
            url: '/reminders',
            reminderId: reminder.id,
            type: reminder.type,
            amount: reminder.amount,
          },
        };

        const result = await this.sendToUser(reminder.user_id, pushPayload);

        // Update last_pushed_at
        await query(
          `UPDATE reminders
           SET last_pushed_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [reminder.id]
        );

        if (result.sent > 0) {
          console.log(`[PushService] Dispatched push for reminder "${reminder.title}" to ${result.sent} device(s)`);
        }
      }

      return dueReminders.length;
    } catch (err) {
      console.error('[PushService] checkAndDispatchDueReminders error:', err);
      return 0;
    }
  }
}
