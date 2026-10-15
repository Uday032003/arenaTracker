import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateLastOccurrence } from '../../utils/dateUtils.js';

export class FavoritesService {
  static async getFavorites(userId, userTimezone = 'UTC') {
    const { rows } = await query(
      `SELECT 
        i.id,
        i.name,
        i.description,
        i.tracking_type,
        i.icon,
        i.color,
        i.category_id,
        c.name as category_name,
        i.is_archived,
        f.created_at as pinned_at,
        COUNT(a.id)::int as total_occurrences,
        MAX(a.occurred_at) as last_occurred_at
      FROM item_favorites f
      JOIN items i ON f.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN activities a ON i.id = a.item_id
      WHERE f.user_id = $1 AND i.is_archived = false
      GROUP BY i.id, c.name, f.created_at
      ORDER BY f.created_at DESC`,
      [userId]
    );

    return rows.map((item) => ({
      ...item,
      is_pinned: true,
      last_occurrence: calculateLastOccurrence(item.last_occurred_at, userTimezone),
    }));
  }

  static async pinItem(userId, itemId) {
    // Check item ownership
    const itemCheck = await query('SELECT id, name FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    await query(
      `INSERT INTO item_favorites (user_id, item_id)
       VALUES ($1, $2)
       ON CONFLICT (user_id, item_id) DO NOTHING`,
      [userId, itemId]
    );

    return { itemId, pinned: true };
  }

  static async unpinItem(userId, itemId) {
    await query(
      `DELETE FROM item_favorites WHERE user_id = $1 AND item_id = $2`,
      [userId, itemId]
    );

    return { itemId, pinned: false };
  }
}
