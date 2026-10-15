import { SettingsService } from './settings.service.js';

export class SettingsController {
  static async getSettings(req, res, next) {
    try {
      const data = await SettingsService.getSettings(req.user.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async updateSettings(req, res, next) {
    try {
      const data = await SettingsService.updateSettings(req.user.id, req.body);
      res.status(200).json({ success: true, data, message: 'Settings updated successfully' });
    } catch (err) {
      next(err);
    }
  }

  static async exportData(req, res, next) {
    try {
      const exportData = await SettingsService.exportUserData(req.user.id);
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=activity-tracker-export-${Date.now()}.json`);
      res.status(200).json(exportData);
    } catch (err) {
      next(err);
    }
  }

  static async deleteAccount(req, res, next) {
    try {
      const { password } = req.body;
      await SettingsService.deleteAccount(req.user.id, password);
      res.clearCookie('session_id');
      res.status(200).json({ success: true, message: 'Account permanently deleted' });
    } catch (err) {
      next(err);
    }
  }
}
