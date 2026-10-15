import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class VariantsService {
  static async getVariantsByItemId(userId, itemId) {
    // Check item ownership
    const itemCheck = await query('SELECT id FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    const { rows } = await query(
      `SELECT id, item_id, name, description, is_archived, created_at, updated_at
       FROM item_variants
       WHERE item_id = $1 AND user_id = $2
       ORDER BY name ASC`,
      [itemId, userId]
    );

    return rows;
  }

  static async createVariant(userId, itemId, { name, description = '' }) {
    // Verify item ownership
    const itemCheck = await query('SELECT id FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    const { rows } = await query(
      `INSERT INTO item_variants (user_id, item_id, name, description)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [userId, itemId, name.trim(), description ? description.trim() : '']
    );

    return rows[0];
  }

  static async updateVariant(userId, variantId, { name, description, isArchived }) {
    const check = await query('SELECT id, user_id FROM item_variants WHERE id = $1 AND user_id = $2', [variantId, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Variant not found', 404);
    }

    const updates = [];
    const params = [variantId, userId];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (isArchived !== undefined) {
      params.push(Boolean(isArchived));
      updates.push(`is_archived = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const { rows } = await query(
      `UPDATE item_variants SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );

    return rows[0];
  }

  static async deleteVariant(userId, variantId) {
    const { rows } = await query(
      `DELETE FROM item_variants WHERE id = $1 AND user_id = $2 RETURNING id, name`,
      [variantId, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Variant not found', 404);
    }

    return rows[0];
  }
}
