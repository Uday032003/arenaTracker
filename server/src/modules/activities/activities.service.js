import { query, getClient } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';
import { calculateLastOccurrence } from '../../utils/dateUtils.js';

export class ActivitiesService {
  static async getActivities(userId, userTimezone = 'UTC', { itemId, categoryId, trackingType, startDate, endDate, search, limit = 50, offset = 0, sort = 'desc' } = {}) {
    let sql = `
      SELECT 
        a.id,
        a.user_id,
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
        a.created_at,
        a.updated_at,
        ad.quantity,
        ad.price,
        ad.payment_mode,
        ad.call_participant,
        ad.call_contact_label,
        ad.call_type,
        ad.call_duration_seconds,
        ad.custom_data,
        sess.id as session_id,
        sess.duration_seconds as session_duration_seconds,
        sess.started_at as session_started_at,
        sess.ended_at as session_ended_at
      FROM activities a
      JOIN items i ON a.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN item_variants v ON a.variant_id = v.id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      LEFT JOIN activity_sessions sess ON a.id = sess.activity_id
      WHERE a.user_id = $1
    `;
    const params = [userId];

    if (itemId) {
      params.push(itemId);
      sql += ` AND a.item_id = $${params.length}`;
    }

    if (categoryId) {
      params.push(categoryId);
      sql += ` AND i.category_id = $${params.length}`;
    }

    if (trackingType) {
      params.push(trackingType);
      sql += ` AND i.tracking_type = $${params.length}`;
    }

    if (startDate) {
      params.push(startDate);
      sql += ` AND a.occurred_at >= $${params.length}`;
    }

    if (endDate) {
      params.push(endDate);
      sql += ` AND a.occurred_at <= $${params.length}`;
    }

    if (search && search.trim()) {
      params.push(`%${search.trim()}%`);
      sql += ` AND (i.name ILIKE $${params.length} OR COALESCE(v.name, '') ILIKE $${params.length} OR COALESCE(a.notes, '') ILIKE $${params.length} OR COALESCE(ad.call_participant, '') ILIKE $${params.length})`;
    }

    sql += ` ORDER BY a.occurred_at ${sort.toLowerCase() === 'asc' ? 'ASC' : 'DESC'}`;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);

    params.push(parsedLimit, parsedOffset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await query(sql, params);

    // Count total matching for pagination
    let countSql = `
      SELECT COUNT(a.id)::int as total
      FROM activities a
      JOIN items i ON a.item_id = i.id
      LEFT JOIN item_variants v ON a.variant_id = v.id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      WHERE a.user_id = $1
    `;
    const countParams = [userId];
    if (itemId) {
      countParams.push(itemId);
      countSql += ` AND a.item_id = $${countParams.length}`;
    }
    if (categoryId) {
      countParams.push(categoryId);
      countSql += ` AND i.category_id = $${countParams.length}`;
    }
    if (trackingType) {
      countParams.push(trackingType);
      countSql += ` AND i.tracking_type = $${countParams.length}`;
    }
    if (startDate) {
      countParams.push(startDate);
      countSql += ` AND a.occurred_at >= $${countParams.length}`;
    }
    if (endDate) {
      countParams.push(endDate);
      countSql += ` AND a.occurred_at <= $${countParams.length}`;
    }
    if (search && search.trim()) {
      countParams.push(`%${search.trim()}%`);
      countSql += ` AND (i.name ILIKE $${countParams.length} OR COALESCE(v.name, '') ILIKE $${countParams.length} OR COALESCE(a.notes, '') ILIKE $${countParams.length} OR COALESCE(ad.call_participant, '') ILIKE $${countParams.length})`;
    }

    const { rows: countRows } = await query(countSql, countParams);
    const totalCount = countRows[0]?.total || 0;

    const formattedRows = rows.map((r) => ({
      ...r,
      relative_date: calculateLastOccurrence(r.occurred_at, userTimezone),
    }));

    return {
      activities: formattedRows,
      pagination: {
        total: totalCount,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < totalCount,
      },
    };
  }

  static async getActivityById(userId, activityId, userTimezone = 'UTC') {
    const { rows } = await query(
      `SELECT 
        a.id,
        a.user_id,
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
        a.created_at,
        a.updated_at,
        ad.quantity,
        ad.price,
        ad.payment_mode,
        ad.call_participant,
        ad.call_contact_label,
        ad.call_type,
        ad.call_duration_seconds,
        ad.custom_data,
        sess.id as session_id,
        sess.duration_seconds as session_duration_seconds,
        sess.started_at as session_started_at,
        sess.ended_at as session_ended_at
      FROM activities a
      JOIN items i ON a.item_id = i.id
      LEFT JOIN categories c ON i.category_id = c.id
      LEFT JOIN item_variants v ON a.variant_id = v.id
      LEFT JOIN activity_details ad ON a.id = ad.activity_id
      LEFT JOIN activity_sessions sess ON a.id = sess.activity_id
      WHERE a.id = $1 AND a.user_id = $2`,
      [activityId, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Activity not found', 404);
    }

    const activity = rows[0];

    // If there is an associated session, fetch any places visited
    let places = [];
    if (activity.session_id) {
      const placesResult = await query(
        `SELECT id, name, address, latitude, longitude, visited_at, notes
         FROM session_places 
         WHERE session_id = $1 AND user_id = $2
         ORDER BY visited_at ASC`,
        [activity.session_id, userId]
      );
      places = placesResult.rows;
    }

    return {
      ...activity,
      places,
      relative_date: calculateLastOccurrence(activity.occurred_at, userTimezone),
    };
  }

  static async createActivity(userId, data) {
    const {
      itemId,
      variantId = null,
      occurredAt = new Date().toISOString(),
      notes = '',
      // Type-specific details:
      quantity = null,
      price = null,
      paymentMode = null,
      callParticipant = null,
      callContactLabel = null,
      callType = null,
      callDurationSeconds = null,
      customData = {},
      // Session linking
      sessionId = null,
      sessionDurationSeconds = null,
    } = data;

    // Verify item ownership
    const itemCheck = await query('SELECT id, tracking_type FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found or does not belong to you', 404);
    }

    // If variant provided, verify variant belongs to item and user
    if (variantId) {
      const variantCheck = await query(
        'SELECT id FROM item_variants WHERE id = $1 AND item_id = $2 AND user_id = $3',
        [variantId, itemId, userId]
      );
      if (variantCheck.rows.length === 0) {
        throw new AppError('Invalid variant for this item', 400);
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      // 1. Insert activity
      const activityRes = await client.query(
        `INSERT INTO activities (user_id, item_id, variant_id, occurred_at, notes)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [userId, itemId, variantId || null, occurredAt, notes ? notes.trim() : '']
      );
      const activity = activityRes.rows[0];

      // 2. Insert activity details if any specialized data provided
      const hasDetails = quantity !== null || price !== null || paymentMode || callParticipant || callDurationSeconds !== null || Object.keys(customData || {}).length > 0;
      if (hasDetails) {
        await client.query(
          `INSERT INTO activity_details 
           (activity_id, user_id, quantity, price, payment_mode, call_participant, call_contact_label, call_type, call_duration_seconds, custom_data)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            activity.id,
            userId,
            quantity !== null ? quantity : null,
            price !== null ? price : null,
            paymentMode || null,
            callParticipant ? callParticipant.trim() : null,
            callContactLabel ? callContactLabel.trim() : null,
            callType || null,
            callDurationSeconds !== null ? parseInt(callDurationSeconds, 10) : null,
            JSON.stringify(customData || {}),
          ]
        );
      }

      // 3. Link session if provided, or create completed session if manual duration provided for timed activity
      if (sessionId) {
        await client.query(
          `UPDATE activity_sessions 
           SET activity_id = $1, status = 'completed', updated_at = CURRENT_TIMESTAMP
           WHERE id = $2 AND user_id = $3`,
          [activity.id, sessionId, userId]
        );
      } else if (sessionDurationSeconds !== null && itemCheck.rows[0].tracking_type === 'timed') {
        const ended = new Date(occurredAt);
        const started = new Date(ended.getTime() - parseInt(sessionDurationSeconds, 10) * 1000);
        await client.query(
          `INSERT INTO activity_sessions (user_id, item_id, activity_id, started_at, ended_at, duration_seconds, status, notes)
           VALUES ($1, $2, $3, $4, $5, $6, 'completed', $7)`,
          [userId, itemId, activity.id, started.toISOString(), ended.toISOString(), parseInt(sessionDurationSeconds, 10), notes ? notes.trim() : '']
        );
      }

      await client.query('COMMIT');
      return activity;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async updateActivity(userId, activityId, data) {
    const { variantId, occurredAt, notes, quantity, price, paymentMode, callParticipant, callContactLabel, callType, callDurationSeconds } = data;

    // Verify activity ownership
    const check = await query('SELECT id, item_id FROM activities WHERE id = $1 AND user_id = $2', [activityId, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Activity not found', 404);
    }
    const currentActivity = check.rows[0];

    // If variant changed, verify variant belongs to item and user
    if (variantId) {
      const variantCheck = await query(
        'SELECT id FROM item_variants WHERE id = $1 AND item_id = $2 AND user_id = $3',
        [variantId, currentActivity.item_id, userId]
      );
      if (variantCheck.rows.length === 0) {
        throw new AppError('Invalid variant for this item', 400);
      }
    }

    const client = await getClient();
    try {
      await client.query('BEGIN');

      const updates = [];
      const params = [activityId, userId];

      if (variantId !== undefined) {
        params.push(variantId || null);
        updates.push(`variant_id = $${params.length}`);
      }
      if (occurredAt !== undefined) {
        params.push(occurredAt);
        updates.push(`occurred_at = $${params.length}`);
      }
      if (notes !== undefined) {
        params.push(notes ? notes.trim() : '');
        updates.push(`notes = $${params.length}`);
      }

      updates.push(`updated_at = CURRENT_TIMESTAMP`);

      const res = await client.query(
        `UPDATE activities SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
        params
      );
      const updatedActivity = res.rows[0];

      // Update details if passed
      const hasDetailUpdates = quantity !== undefined || price !== undefined || paymentMode !== undefined || callParticipant !== undefined || callDurationSeconds !== undefined || callType !== undefined || callContactLabel !== undefined;
      if (hasDetailUpdates) {
        const detailCheck = await client.query('SELECT id FROM activity_details WHERE activity_id = $1', [activityId]);
        if (detailCheck.rows.length > 0) {
          await client.query(
            `UPDATE activity_details 
             SET quantity = COALESCE($1, quantity),
                 price = COALESCE($2, price),
                 payment_mode = COALESCE($3, payment_mode),
                 call_participant = COALESCE($4, call_participant),
                 call_contact_label = COALESCE($5, call_contact_label),
                 call_type = COALESCE($6, call_type),
                 call_duration_seconds = COALESCE($7, call_duration_seconds)
             WHERE activity_id = $8 AND user_id = $9`,
            [
              quantity !== undefined ? quantity : null,
              price !== undefined ? price : null,
              paymentMode !== undefined ? paymentMode : null,
              callParticipant !== undefined ? callParticipant : null,
              callContactLabel !== undefined ? callContactLabel : null,
              callType !== undefined ? callType : null,
              callDurationSeconds !== undefined ? callDurationSeconds : null,
              activityId,
              userId,
            ]
          );
        } else {
          await client.query(
            `INSERT INTO activity_details 
             (activity_id, user_id, quantity, price, call_participant, call_contact_label, call_type, call_duration_seconds)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
            [
              activityId,
              userId,
              quantity || null,
              price || null,
              callParticipant || null,
              callContactLabel || null,
              callType || null,
              callDurationSeconds || null,
            ]
          );
        }
      }

      await client.query('COMMIT');
      return updatedActivity;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async deleteActivity(userId, activityId) {
    const res = await query(
      `DELETE FROM activities WHERE id = $1 AND user_id = $2 RETURNING id, item_id`,
      [activityId, userId]
    );

    if (res.rows.length === 0) {
      throw new AppError('Activity not found', 404);
    }

    return res.rows[0];
  }
}
