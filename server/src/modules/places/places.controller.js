import { PlacesService } from './places.service.js';

export class PlacesController {
  static async getPlacesBySessionId(req, res, next) {
    try {
      const places = await PlacesService.getPlacesBySessionId(req.user.id, req.params.sessionId);
      res.status(200).json({
        success: true,
        data: places,
      });
    } catch (err) {
      next(err);
    }
  }

  static async addPlace(req, res, next) {
    try {
      const sessionId = req.params.sessionId || req.body.sessionId;
      const place = await PlacesService.addPlace(req.user.id, sessionId, req.body);
      res.status(201).json({
        success: true,
        data: place,
        message: 'Place added successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async updatePlace(req, res, next) {
    try {
      const place = await PlacesService.updatePlace(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: place,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deletePlace(req, res, next) {
    try {
      const deleted = await PlacesService.deletePlace(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: deleted,
        message: 'Place deleted',
      });
    } catch (err) {
      next(err);
    }
  }
}
