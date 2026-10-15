import { CategoriesService } from './categories.service.js';

export class CategoriesController {
  static async getCategories(req, res, next) {
    try {
      const data = await CategoriesService.getCategories(req.user.id);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async createCategory(req, res, next) {
    try {
      const data = await CategoriesService.createCategory(req.user.id, req.body);
      res.status(201).json({ success: true, data, message: 'Category created' });
    } catch (err) {
      next(err);
    }
  }

  static async updateCategory(req, res, next) {
    try {
      const data = await CategoriesService.updateCategory(req.user.id, req.params.id, req.body);
      res.status(200).json({ success: true, data });
    } catch (err) {
      next(err);
    }
  }

  static async deleteCategory(req, res, next) {
    try {
      const data = await CategoriesService.deleteCategory(req.user.id, req.params.id);
      res.status(200).json({ success: true, data, message: 'Category deleted' });
    } catch (err) {
      next(err);
    }
  }
}
