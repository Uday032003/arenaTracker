import { PushService } from './push.service.js';

export class PushController {
  static async getPublicKey(req, res, next) {
    try {
      res.json({
        success: true,
        data: {
          publicKey: PushService.getPublicKey(),
        },
      });
    } catch (err) {
      next(err);
    }
  }

  static async getStatus(req, res, next) {
    try {
      const status = await PushService.getSubscriptionStatus(req.user.id);
      res.json({
        success: true,
        data: status,
      });
    } catch (err) {
      next(err);
    }
  }

  static async subscribe(req, res, next) {
    try {
      const { endpoint, keys } = req.body;
      const userAgent = req.headers['user-agent'] || '';

      const subscription = await PushService.saveSubscription(req.user.id, {
        endpoint,
        keys,
        userAgent,
      });

      res.status(201).json({
        success: true,
        message: 'Push subscription registered successfully',
        data: subscription,
      });
    } catch (err) {
      next(err);
    }
  }

  static async unsubscribe(req, res, next) {
    try {
      const { endpoint } = req.body;
      if (endpoint) {
        await PushService.removeSubscription(req.user.id, endpoint);
      }
      res.json({
        success: true,
        message: 'Push subscription removed successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async sendTestPush(req, res, next) {
    try {
      const testPayload = {
        title: '🔔 Test Alarm Notification',
        body: 'Background Web Push is working perfectly! You will receive alarms even when closed.',
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        data: {
          url: '/reminders',
          type: 'test',
        },
      };

      const result = await PushService.sendToUser(req.user.id, testPayload);

      res.json({
        success: true,
        message: result.sent > 0
          ? `Test notification sent to ${result.sent} device(s)!`
          : 'No active device subscriptions found for this account.',
        data: result,
      });
    } catch (err) {
      next(err);
    }
  }
}
