import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateLastOccurrence } from '../../utils/dateUtils.js';

export class ItemsService {
  static async getItems(userId, userTimezone = 'UTC', { search, categoryId, trackingType, archived = 'false', sort = 'last_occurrence_desc' } = {}) {
    let sql = `
      SELECT 
        i.id,
        i.user_id,
        i.category_id,
        c.name as category_name,
        c.color as category_color,
        i.name,
        i.description,
        i.tracking_type,
        i.target_amount,
        i.currency,
        i.icon,
        i.color,
        i.is_archived,
        i.created_at,
        i.updated_at,
        (fav.user_id IS NOT NULL) as is_pinned,
        COUNT(DISTINCT a.id)::int as total_occurrences,
        MAX(a.occurred_at) as last_occurred_at,
        COALESCE(SUM(ad.price), 0)::numeric as total_collected
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN item_favorites fav ON i.id = fav.item_id AND fav.user_id = i.user_id
      LEFT JOIN activities a ON i.id = a.item_id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      WHERE i.user_id = $1
    `;
    const params = [userId];

    if (archived === 'true') {
      sql += ` AND i.is_archived = true`;
    } else if (archived === 'all') {
      // both
    } else {
      sql += ` AND i.is_archived = false`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (i.name ILIKE $${params.length} OR i.description ILIKE $${params.length})`;
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND i.category_id = $${params.length}`;
    }

    if (trackingType) {
      params.push(trackingType);
      sql += ` AND i.tracking_type = $${params.length}`;
    }

    sql += ` GROUP BY i.id, c.name, c.color, fav.user_id`;

    // Sorting
    switch (sort) {
      case 'name_asc':
        sql += ` ORDER BY i.name ASC`;
        break;
      case 'name_desc':
        sql += ` ORDER BY i.name DESC`;
        break;
      case 'created_asc':
        sql += ` ORDER BY i.created_at ASC`;
        break;
      case 'created_desc':
        sql += ` ORDER BY i.created_at DESC`;
        break;
      case 'last_occurrence_asc':
        sql += ` ORDER BY last_occurred_at ASC NULLS LAST`;
        break;
      case 'occurrences_desc':
        sql += ` ORDER BY total_occurrences DESC, i.name ASC`;
        break;
      case 'last_occurrence_desc':
      default:
        sql += ` ORDER BY last_occurred_at DESC NULLS LAST, i.created_at DESC`;
        break;
    }

    const { rows } = await query(sql, params);

    return rows.map((item) => ({
      ...item,
      last_occurrence: calculateLastOccurrence(item.last_occurred_at, userTimezone),
    }));
  }

  static async getItemById(userId, itemId, userTimezone = 'UTC') {
    const itemResult = await query(
      `SELECT 
        i.id,
        i.user_id,
        i.category_id,
        c.name as category_name,
        c.color as category_color,
        i.name,
        i.description,
        i.tracking_type,
        i.target_amount,
        i.currency,
        i.icon,
        i.color,
        i.is_archived,
        i.created_at,
        i.updated_at,
        (fav.user_id IS NOT NULL) as is_pinned,
        COUNT(DISTINCT a.id)::int as total_occurrences,
        MAX(a.occurred_at) as last_occurred_at,
        COALESCE(SUM(ad.price), 0)::numeric as total_collected
      FROM items i
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN item_favorites fav ON i.id = fav.item_id AND fav.user_id = i.user_id
      LEFT JOIN activities a ON i.id = a.item_id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      WHERE i.id = $1 AND i.user_id = $2
      GROUP BY i.id, c.name, c.color, fav.user_id`,
      [itemId, userId]
    );

    if (itemResult.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    const item = itemResult.rows[0];

    // Fetch active session if any
    const activeSessionResult = await query(
      `SELECT id, started_at, notes FROM activity_sessions 
       WHERE item_id = $1 AND user_id = $2 AND status = 'active'
       ORDER BY started_at DESC LIMIT 1`,
      [itemId, userId]
    );

    // Fetch item variants
    const variantsResult = await query(
      `SELECT id, name, description, is_archived, created_at 
       FROM item_variants 
       WHERE item_id = $1 AND user_id = $2 AND is_archived = false
       ORDER BY name ASC`,
      [itemId, userId]
    );

    return {
      ...item,
      last_occurrence: calculateLastOccurrence(item.last_occurred_at, userTimezone),
      active_session: activeSessionResult.rows[0] || null,
      variants: variantsResult.rows,
    };
  }

  static async checkDuplicateName(userId, name, excludeItemId = null) {
    let sql = `SELECT id, name FROM items WHERE user_id = $1 AND LOWER(TRIM(name)) = LOWER(TRIM($2))`;
    const params = [userId, name];
    if (excludeItemId) {
      sql += ` AND id != $3`;
      params.push(excludeItemId);
    }
    const { rows } = await query(sql, params);
    return rows.length > 0;
  }

  static async createItem(userId, { name, categoryId = null, description = '', trackingType = 'general', targetAmount = null, currency = '₹', icon = 'Activity', color = '#22c55e' }) {
    const isDuplicate = await this.checkDuplicateName(userId, name);

    const result = await query(
      `INSERT INTO items (user_id, category_id, name, description, tracking_type, target_amount, currency, icon, color)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        userId,
        categoryId || null,
        name.trim(),
        description ? description.trim() : '',
        trackingType,
        targetAmount ? parseFloat(targetAmount) : null,
        currency || '₹',
        icon || 'Activity',
        color || '#22c55e',
      ]
    );

    return {
      item: result.rows[0],
      duplicateWarning: isDuplicate,
    };
  }

  static async updateItem(userId, itemId, { name, categoryId, description, trackingType, targetAmount, currency, icon, color, isArchived }) {
    // Check ownership
    const current = await query('SELECT id, name FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (current.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    let isDuplicate = false;
    if (name) {
      isDuplicate = await this.checkDuplicateName(userId, name, itemId);
    }

    const updates = [];
    const params = [itemId, userId];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (categoryId !== undefined) {
      params.push(categoryId || null);
      updates.push(`category_id = $${params.length}`);
    }
    if (description !== undefined) {
      params.push(description.trim());
      updates.push(`description = $${params.length}`);
    }
    if (trackingType !== undefined) {
      params.push(trackingType);
      updates.push(`tracking_type = $${params.length}`);
    }
    if (targetAmount !== undefined) {
      params.push(targetAmount ? parseFloat(targetAmount) : null);
      updates.push(`target_amount = $${params.length}`);
    }
    if (currency !== undefined) {
      params.push(currency || '₹');
      updates.push(`currency = $${params.length}`);
    }
    if (icon !== undefined) {
      params.push(icon);
      updates.push(`icon = $${params.length}`);
    }
    if (color !== undefined) {
      params.push(color);
      updates.push(`color = $${params.length}`);
    }
    if (isArchived !== undefined) {
      params.push(Boolean(isArchived));
      updates.push(`is_archived = $${params.length}`);
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const result = await query(
      `UPDATE items SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );

    return {
      item: result.rows[0],
      duplicateWarning: isDuplicate,
    };
  }

  static async archiveItem(userId, itemId, isArchived = true) {
    const result = await query(
      `UPDATE items SET is_archived = $1, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 AND user_id = $3 RETURNING *`,
      [Boolean(isArchived), itemId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    return result.rows[0];
  }

  static async deleteItem(userId, itemId) {
    const result = await query(
      `DELETE FROM items WHERE id = $1 AND user_id = $2 RETURNING id, name`,
      [itemId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    return result.rows[0];
  }

  static async getItemStats(userId, itemId, userTimezone = 'UTC') {
    // Verify item ownership
    const itemCheck = await query('SELECT id, name, tracking_type FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }
    const item = itemCheck.rows[0];

    // Fetch occurrences ordered chronologically
    const { rows: activities } = await query(
      `SELECT occurred_at FROM activities 
       WHERE item_id = $1 AND user_id = $2 
       ORDER BY occurred_at ASC`,
      [itemId, userId]
    );

    const totalOccurrences = activities.length;
    let avgDaysBetween = 0;
    let maxDaysBetween = 0;

    if (totalOccurrences > 1) {
      const gaps = [];
      for (let i = 1; i < totalOccurrences; i++) {
        const prev = new Date(activities[i - 1].occurred_at).getTime();
        const curr = new Date(activities[i].occurred_at).getTime();
        const gapDays = (curr - prev) / (1000 * 60 * 60 * 24);
        gaps.push(gapDays);
      }
      const sumGaps = gaps.reduce((a, b) => a + b, 0);
      avgDaysBetween = +(sumGaps / gaps.length).toFixed(1);
      maxDaysBetween = +Math.max(...gaps).toFixed(1);
    }

    // Timed activity statistics
    let totalDurationSeconds = 0;
    let averageDurationSeconds = 0;
    const sessionRes = await query(
      `SELECT duration_seconds FROM activity_sessions 
       WHERE item_id = $1 AND user_id = $2 AND status = 'completed'`,
      [itemId, userId]
    );
    if (sessionRes.rows.length > 0) {
      totalDurationSeconds = sessionRes.rows.reduce((sum, r) => sum + (r.duration_seconds || 0), 0);
      averageDurationSeconds = Math.round(totalDurationSeconds / sessionRes.rows.length);
    }

    return {
      itemId,
      totalOccurrences,
      avgDaysBetween,
      maxDaysBetween,
      totalDurationSeconds,
      averageDurationSeconds,
      lastOccurrence: calculateLastOccurrence(activities[activities.length - 1]?.occurred_at, userTimezone),
    };
  }
}
