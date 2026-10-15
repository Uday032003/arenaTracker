import { SessionsService } from './sessions.service.js';

export class SessionsController {
  static async getActiveSessions(req, res, next) {
    try {
      const active = await SessionsService.getActiveSessions(req.user.id);
      res.status(200).json({
        success: true,
        data: active,
      });
    } catch (err) {
      next(err);
    }
  }

  static async startSession(req, res, next) {
    try {
      const session = await SessionsService.startSession(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: session,
        message: 'Session started',
      });
    } catch (err) {
      next(err);
    }
  }

  static async stopSession(req, res, next) {
    try {
      const session = await SessionsService.stopSession(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: session,
        message: 'Session completed successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSessions(req, res, next) {
    try {
      const sessions = await SessionsService.getSessions(req.user.id, req.query);
      res.status(200).json({
        success: true,
        data: sessions,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getSessionById(req, res, next) {
    try {
      const session = await SessionsService.getSessionById(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: session,
      });
    } catch (err) {
      next(err);
    }
  }
}
