import { RemindersService } from './reminders.service.js';

export class RemindersController {
  static async getReminders(req, res, next) {
    try {
      const data = await RemindersService.getReminders(req.user.id, req.query);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async getDueReminders(req, res, next) {
    try {
      const data = await RemindersService.getDueReminders(req.user.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createReminder(req, res, next) {
    try {
      const data = await RemindersService.createReminder(req.user.id, req.body);
      res.status(201).json({ success: true, data, message: 'Reminder created successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async updateReminder(req, res, next) {
    try {
      const data = await RemindersService.updateReminder(req.user.id, req.params.id, req.body);
      res.status(200).json({ success: true, data, message: 'Reminder updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async dismissReminder(req, res, next) {
    try {
      const data = await RemindersService.dismissReminder(req.user.id, req.params.id);
      res.status(200).json({ success: true, data, message: 'Alarm stopped and dismissed' });
    } catch (err) {
      next(err);
    }
  }

  static async snoozeReminder(req, res, next) {
    try {
      const minutes = parseInt(req.body.minutes || '10', 10);
      const data = await RemindersService.snoozeReminder(req.user.id, req.params.id, minutes);
      res.status(200).json({ success: true, data, message: `Alarm snoozed for ${minutes} minutes` });
    } catch (err) {
      next(err);
    }
  }

  static async completeReminder(req, res, next) {
    try {
      const data = await RemindersService.completeReminder(req.user.id, req.params.id);
      res.status(200).json({ success: true, data, message: 'Reminder marked as completed' });
    } catch (err) {
      next(err);
    }
  }

  static async deleteReminder(req, res, next) {
    try {
      const data = await RemindersService.deleteReminder(req.user.id, req.params.id);
      res.status(200).json({ success: true, data, message: 'Reminder deleted' });
    } catch (err) {
      next(err);
    }
  }
}
