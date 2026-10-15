import { DashboardService } from './dashboard.service.js';

export class DashboardController {
  static async getSummary(req, res, next) {
    try {
      const summary = await DashboardService.getSummary(req.user.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getRecentActivities(req, res, next) {
    try {
      const limit = parseInt(req.query.limit, 10) || 10;
      const recent = await DashboardService.getRecentActivities(req.user.id, req.user.timezone, limit);
      res.status(200).json({
        success: true,
        data: recent,
      });
    } catch (err) {
      next(err);
    }
  }
}
