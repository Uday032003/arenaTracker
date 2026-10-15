import { FavoritesService } from './favorites.service.js';

export class FavoritesController {
  static async getFavorites(req, res, next) {
    try {
      const favorites = await FavoritesService.getFavorites(req.user.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: favorites,
      });
    } catch (err) {
      next(err);
    }
  }

  static async pinItem(req, res, next) {
    try {
      const itemId = req.body.itemId;
      const result = await FavoritesService.pinItem(req.user.id, itemId);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Item pinned to Home',
      });
    } catch (err) {
      next(err);
    }
  }

  static async unpinItem(req, res, next) {
    try {
      const itemId = req.params.itemId;
      const result = await FavoritesService.unpinItem(req.user.id, itemId);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Item unpinned from Home',
      });
    } catch (err) {
      next(err);
    }
  }
}
