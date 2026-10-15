import { ItemsService } from './items.service.js';

export class ItemsController {
  static async getItems(req, res, next) {
    try {
      const items = await ItemsService.getItems(req.user.id, req.user.timezone, req.query);
      res.status(200).json({
        success: true,
        data: items,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getItemById(req, res, next) {
    try {
      const item = await ItemsService.getItemById(req.user.id, req.params.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createItem(req, res, next) {
    try {
      const result = await ItemsService.createItem(req.user.id, req.body);
      res.status(201).json({
        success: true,
        data: result.item,
        duplicateWarning: result.duplicateWarning,
        message: result.duplicateWarning
          ? 'Warning: An item with this name already exists in your library.'
          : 'Item created successfully.',
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateItem(req, res, next) {
    try {
      const result = await ItemsService.updateItem(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: result.item,
        duplicateWarning: result.duplicateWarning,
      });
    } catch (err) {
      next(err);
    }
  }

  static async archiveItem(req, res, next) {
    try {
      const isArchived = req.body.isArchived !== undefined ? req.body.isArchived : true;
      const item = await ItemsService.archiveItem(req.user.id, req.params.id, isArchived);
      res.status(200).json({
        success: true,
        data: item,
        message: isArchived ? 'Item archived' : 'Item restored',
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteItem(req, res, next) {
    try {
      const item = await ItemsService.deleteItem(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        message: 'Item and its associated data were deleted successfully',
        data: item,
      });
    } catch (err) {
      next(err);
    }
  }

  static async getItemStats(req, res, next) {
    try {
      const stats = await ItemsService.getItemStats(req.user.id, req.params.id, req.user.timezone);
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (err) {
      next(err);
    }
  }
}
