import { query } from '../../config/db.js';
import { calculateLastOccurrence } from '../../utils/dateUtils.js';

export class InsightsService {
  static async getInsights(userId, userTimezone = 'UTC', { startDate, endDate } = {}) {
    let dateFilter = '';
    const params = [userId];

    if (startDate) {
      params.push(startDate);
      dateFilter += ` AND a.occurred_at >= $${params.length}`;
    }
    if (endDate) {
      params.push(endDate);
      dateFilter += ` AND a.occurred_at <= $${params.length}`;
    }

    // 1. Total occurrences per item
    const itemOccurrencesRes = await query(
      `SELECT 
        i.id as item_id,
        i.name as item_name,
        i.color as item_color,
        i.tracking_type,
        COUNT(a.id)::int as occurrences
      FROM items i
      LEFT JOIN activities a ON i.id = a.item_id ${dateFilter}
      WHERE i.user_id = $1 AND i.is_archived = false
      GROUP BY i.id
      HAVING COUNT(a.id) > 0
      ORDER BY occurrences DESC`,
      params
    );

    // 2. Frequency by tracking type
    const trackingTypeRes = await query(
      `SELECT 
        i.tracking_type,
        COUNT(a.id)::int as count
      FROM activities a
      JOIN items i ON a.item_id = i.id
      WHERE a.user_id = $1 ${dateFilter}
      GROUP BY i.tracking_type
      ORDER BY count DESC`,
      params
    );

    // 3. Weekly / monthly trend (last 30 days)
    const trendRes = await query(
      `SELECT 
        TO_CHAR(DATE_TRUNC('day', a.occurred_at), 'YYYY-MM-DD') as day,
        COUNT(a.id)::int as count
      FROM activities a
      WHERE a.user_id = $1 AND a.occurred_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', a.occurred_at)
      ORDER BY day ASC`,
      [userId]
    );

    // 4. Timed activity stats
    const timedStatsRes = await query(
      `SELECT 
        COUNT(s.id)::int as total_sessions,
        COALESCE(SUM(s.duration_seconds), 0)::int as total_duration_seconds,
        COALESCE(AVG(s.duration_seconds), 0)::int as avg_duration_seconds
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      WHERE s.user_id = $1 AND s.status = 'completed'`,
      [userId]
    );

    // 5. Walking vs Riding breakdown
    const activityTypeBreakdownRes = await query(
      `SELECT 
        i.name,
        i.tracking_type,
        COALESCE(SUM(s.duration_seconds), 0)::int as duration_seconds,
        COUNT(s.id)::int as sessions_count
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      WHERE s.user_id = $1 AND s.status = 'completed'
      GROUP BY i.name, i.tracking_type
      ORDER BY duration_seconds DESC`,
      [userId]
    );

    // 6. Frequently visited places
    const placesRes = await query(
      `SELECT 
        p.name,
        p.address,
        COUNT(p.id)::int as visit_count,
        MAX(p.visited_at) as last_visited_at
      FROM session_places p
      WHERE p.user_id = $1
      GROUP BY p.name, p.address
      ORDER BY visit_count DESC
      LIMIT 10`,
      [userId]
    );

    // 7. Call stats
    const callStatsRes = await query(
      `SELECT 
        COUNT(ad.id)::int as total_calls,
        COUNT(ad.id) FILTER (WHERE ad.call_type = 'incoming')::int as incoming_calls,
        COUNT(ad.id) FILTER (WHERE ad.call_type = 'outgoing')::int as outgoing_calls,
        COALESCE(SUM(ad.call_duration_seconds), 0)::int as total_call_duration_seconds,
        COALESCE(AVG(ad.call_duration_seconds), 0)::int as avg_call_duration_seconds
      FROM activity_details ad
      JOIN activities a ON ad.activity_id = a.id
      WHERE a.user_id = $1 AND ad.call_participant IS NOT NULL`,
      [userId]
    );

    // 8. Items not logged recently (> 7 days or never logged)
    const neglectedRes = await query(
      `SELECT 
        i.id,
        i.name,
        i.tracking_type,
        i.color,
        i.icon,
        MAX(a.occurred_at) as last_occurred_at
      FROM items i
      LEFT JOIN activities a ON i.id = a.item_id
      WHERE i.user_id = $1 AND i.is_archived = false
      GROUP BY i.id
      ORDER BY last_occurred_at ASC NULLS FIRST`,
      [userId]
    );

    const itemsNotLoggedRecently = neglectedRes.rows
      .map((item) => ({
        ...item,
        last_occurrence: calculateLastOccurrence(item.last_occurred_at, userTimezone),
      }))
      .filter((item) => item.last_occurrence.status === 'never' || (item.last_occurrence.daysAgo && item.last_occurrence.daysAgo >= 7));

    return {
      occurrencesByItem: itemOccurrencesRes.rows,
      occurrencesByType: trackingTypeRes.rows,
      activityTrend: trendRes.rows,
      timedStats: timedStatsRes.rows[0] || { total_sessions: 0, total_duration_seconds: 0, avg_duration_seconds: 0 },
      activityTypeBreakdown: activityTypeBreakdownRes.rows,
      frequentPlaces: placesRes.rows,
      callStats: callStatsRes.rows[0] || { total_calls: 0, incoming_calls: 0, outgoing_calls: 0, total_call_duration_seconds: 0, avg_call_duration_seconds: 0 },
      itemsNotLoggedRecently,
    };
  }
}
