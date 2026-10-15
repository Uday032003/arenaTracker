import { VariantsService } from './variants.service.js';

export class VariantsController {
  static async getVariantsByItemId(req, res, next) {
    try {
      const variants = await VariantsService.getVariantsByItemId(req.user.id, req.params.itemId);
      res.status(200).json({
        success: true,
        data: variants,
      });
    } catch (err) {
      next(err);
    }
  }

  static async createVariant(req, res, next) {
    try {
      const itemId = req.params.itemId || req.body.itemId;
      const variant = await VariantsService.createVariant(req.user.id, itemId, req.body);
      res.status(201).json({
        success: true,
        data: variant,
        message: 'Variant created successfully',
      });
    } catch (err) {
      next(err);
    }
  }

  static async updateVariant(req, res, next) {
    try {
      const variant = await VariantsService.updateVariant(req.user.id, req.params.id, req.body);
      res.status(200).json({
        success: true,
        data: variant,
      });
    } catch (err) {
      next(err);
    }
  }

  static async deleteVariant(req, res, next) {
    try {
      const deleted = await VariantsService.deleteVariant(req.user.id, req.params.id);
      res.status(200).json({
        success: true,
        data: deleted,
        message: 'Variant deleted successfully',
      });
    } catch (err) {
      next(err);
    }
  }
}
