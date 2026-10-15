import { ActivitiesService } from './activities.service.js';

export class ActivitiesController {
  static async getActivities(req, res, next) {
    try {
      const data = await ActivitiesService.getActivities(req.user.id, req.user.timezone, req.query);
      res.status(200).json({
        success: true,
        data: data.activities,
        pagination: data.pagination,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getActivityById(req, res, next) {
    try {
      const activity = await ActivitiesService.getActivityById(req.user.id, req.params.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: activity,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createActivity(req, res, next) {
    try {
      const activity = await ActivitiesService.createActivity(req.user.id, req.body);
      const fullActivity = await ActivitiesService.getActivityById(req.user.id, activity.id, req.user.timezone);
      res.status(201).json({
        success: true,
        data: fullActivity,
        message: 'Activity logged successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateActivity(req, res, next) {
    try {
      const updated = await ActivitiesService.updateActivity(req.user.id, req.params.id, req.body);
      const fullActivity = await ActivitiesService.getActivityById(req.user.id, updated.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: fullActivity,
        message: 'Activity updated successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteActivity(req, res, next) {
    try {
      const deleted = await ActivitiesService.deleteActivity(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: deleted,
        message: 'Activity deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
