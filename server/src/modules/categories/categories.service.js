import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class CategoriesService {
  static async getCategories(userId) {
    const { rows } = await query(
      `SELECT c.id, c.name, c.icon, c.color, c.created_at, COUNT(i.id)::int as items_count
       FROM categories c
       LEFT JOIN items i ON c.id = i.category_id AND i.is_archived = false
       WHERE c.user_id = $1
       GROUP BY c.id
       ORDER BY c.name ASC`,
      [userId]
    );
    return rows;
  }

  static async createCategory(userId, { name, icon = 'Folder', color = '#22c55e' }) {
    const existing = await query('SELECT id FROM categories WHERE user_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))', [userId, name]);
    if (existing.rows.length > 0) {
      throw new AppError('A category with this name already exists', 409);
    }

    const { rows } = await query(
      `INSERT INTO categories (user_id, name, icon, color)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, name.trim(), icon || 'Folder', color || '#22c55e']
    );
    return rows[0];
  }

  static async updateCategory(userId, categoryId, { name, icon, color }) {
    const check = await query('SELECT id FROM categories WHERE id = $1 AND user_id = $2', [categoryId, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Category not found', 404);
    }

    const updates = [];
    const params = [categoryId, userId];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (icon !== undefined) {
      params.push(icon);
      updates.push(`icon = $${params.length}`);
    }
    if (color !== undefined) {
      params.push(color);
      updates.push(`color = $${params.length}`);
    }

    const { rows } = await query(
      `UPDATE categories SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );
    return rows[0];
  }

  static async deleteCategory(userId, categoryId) {
    const { rows } = await query(
      `DELETE FROM categories WHERE id = $1 AND user_id = $2 RETURNING id, name`,
      [categoryId, userId]
    );
    if (rows.length === 0) {
      throw new AppError('Category not found', 404);
    }
    return rows[0];
  }
}
