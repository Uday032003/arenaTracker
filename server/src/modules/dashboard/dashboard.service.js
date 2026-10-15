import { query } from '../../config/db.js';
import { calculateLastOccurrence } from '../../utils/dateUtils.js';

export class DashboardService {
  static async getSummary(userId, userTimezone = 'UTC') {
    // 1. Total items count
    const itemsRes = await query('SELECT COUNT(id)::int as count FROM items WHERE user_id = $1 AND is_archived = false', [userId]);
    const totalItems = itemsRes.rows[0]?.count || 0;

    // 2. Active sessions
    const activeSessionsRes = await query(
      `SELECT 
        s.id,
        s.item_id,
        i.name as item_name,
        i.icon as item_icon,
        i.color as item_color,
        i.tracking_type,
        s.started_at,
        s.notes,
        ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.started_at)))::int as elapsed_seconds
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.started_at DESC`,
      [userId]
    );

    // 3. Pinned items
    const pinnedRes = await query(
      `SELECT 
        i.id,
        i.name,
        i.description,
        i.tracking_type,
        i.icon,
        i.color,
        i.category_id,
        c.name as category_name,
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

    const pinnedItems = pinnedRes.rows.map((item) => ({
      ...item,
      is_pinned: true,
      last_occurrence: calculateLastOccurrence(item.last_occurred_at, userTimezone),
    }));

    // 4. Logs today and this week
    const now = new Date();
    // Start of today in UTC approximation for query
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const statsRes = await query(
      `SELECT 
        COUNT(id) FILTER (WHERE occurred_at >= $2)::int as logs_today,
        COUNT(id) FILTER (WHERE occurred_at >= $3)::int as logs_this_week,
        COUNT(id)::int as total_activities
       FROM activities 
       WHERE user_id = $1`,
      [userId, todayStart, weekStart]
    );

    const stats = statsRes.rows[0] || { logs_today: 0, logs_this_week: 0, total_activities: 0 };

    return {
      stats: {
        totalItems,
        pinnedCount: pinnedItems.length,
        logsToday: stats.logs_today,
        logsThisWeek: stats.logs_this_week,
        totalActivities: stats.total_activities,
        activeSessionsCount: activeSessionsRes.rows.length,
      },
      pinnedItems,
      activeSessions: activeSessionsRes.rows,
    };
  }

  static async getRecentActivities(userId, userTimezone = 'UTC', limit = 10) {
    const { rows } = await query(
      `SELECT 
        a.id,
        a.item_id,
        i.name as item_name,
        i.icon as item_icon,
        i.color as item_color,
        i.tracking_type,
        c.name as category_name,
        a.variant_id,
        v.name as variant_name,
        a.occurred_at,
        a.notes,
        ad.quantity,
        ad.price,
        ad.call_participant,
        ad.call_contact_label,
        ad.call_type,
        ad.call_duration_seconds,
        sess.duration_seconds as session_duration_seconds
      FROM activities a
      JOIN items i ON a.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN item_variants v ON a.variant_id = v.id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      LEFT JOIN activity_sessions sess ON a.id = sess.activity_id
      WHERE a.user_id = $1
      ORDER BY a.occurred_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    return rows.map((r) => ({
      ...r,
      relative_date: calculateLastOccurrence(r.occurred_at, userTimezone),
    }));
  }
}
