import { InsightsService } from './insights.service.js';

export class InsightsController {
  static async getInsights(req, res, next) {
    try {
      const data = await InsightsService.getInsights(req.user.id, req.user.timezone, req.query);
      res.status(200).json({
        success: true,
        data,
      });
    } catch (err) {
      next(err);
    }
  }
}
