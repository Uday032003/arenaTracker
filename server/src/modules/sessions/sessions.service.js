import { query, getClient } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class SessionsService {
  static async getActiveSessions(userId) {
    const { rows } = await query(
      `SELECT 
        s.id,
        s.user_id,
        s.item_id,
        i.name as item_name,
        i.tracking_type,
        i.icon as item_icon,
        i.color as item_color,
        s.started_at,
        s.status,
        s.notes,
        s.created_at,
        ROUND(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - s.started_at)))::int as elapsed_seconds
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      WHERE s.user_id = $1 AND s.status = 'active'
      ORDER BY s.started_at DESC`,
      [userId]
    );

    return rows;
  }

  static async startSession(userId, { itemId, notes = '', startedAt = null }) {
    // Verify item ownership
    const itemCheck = await query('SELECT id, name, tracking_type FROM items WHERE id = $1 AND user_id = $2', [itemId, userId]);
    if (itemCheck.rows.length === 0) {
      throw new AppError('Item not found', 404);
    }

    // Check if an active session already exists for this item
    const activeCheck = await query(
      `SELECT id, started_at FROM activity_sessions 
       WHERE item_id = $1 AND user_id = $2 AND status = 'active'`,
      [itemId, userId]
    );

    if (activeCheck.rows.length > 0) {
      throw new AppError('An active session already exists for this item. Stop it before starting a new one.', 409);
    }

    const startTimestamp = startedAt ? new Date(startedAt).toISOString() : new Date().toISOString();

    const { rows } = await query(
      `INSERT INTO activity_sessions (user_id, item_id, started_at, status, notes)
       VALUES ($1, $2, $3, 'active', $4)
       RETURNING *`,
      [userId, itemId, startTimestamp, notes ? notes.trim() : '']
    );

    return rows[0];
  }

  static async stopSession(userId, sessionId, { endedAt = null, notes = null, createActivityLog = true } = {}) {
    const sessionCheck = await query(
      `SELECT s.id, s.item_id, s.started_at, s.status, s.notes, i.name as item_name
       FROM activity_sessions s
       JOIN items i ON s.item_id = i.id
       WHERE s.id = $1 AND s.user_id = $2`,
      [sessionId, userId]
    );

    if (sessionCheck.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = sessionCheck.rows[0];
    if (session.status !== 'active') {
      throw new AppError(`Session is already ${session.status}`, 400);
    }

    const endTimestamp = endedAt ? new Date(endedAt) : new Date();
    const startTimestamp = new Date(session.started_at);
    const durationSeconds = Math.max(0, Math.round((endTimestamp.getTime() - startTimestamp.getTime()) / 1000));
    const finalNotes = notes !== null ? notes.trim() : (session.notes || '');

    const client = await getClient();
    try {
      await client.query('BEGIN');

      let activityId = null;

      if (createActivityLog) {
        // Create corresponding activity record
        const actRes = await client.query(
          `INSERT INTO activities (user_id, item_id, occurred_at, notes)
           VALUES ($1, $2, $3, $4)
           RETURNING id`,
          [userId, session.item_id, endTimestamp.toISOString(), finalNotes]
        );
        activityId = actRes.rows[0].id;
      }

      // Update session record
      const updatedSessionRes = await client.query(
        `UPDATE activity_sessions 
         SET ended_at = $1, 
             duration_seconds = $2, 
             status = 'completed', 
             notes = $3, 
             activity_id = $4,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $5 AND user_id = $6
         RETURNING *`,
        [endTimestamp.toISOString(), durationSeconds, finalNotes, activityId, sessionId, userId]
      );

      await client.query('COMMIT');
      return updatedSessionRes.rows[0];
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async getSessions(userId, { itemId, status, limit = 50, offset = 0 } = {}) {
    let sql = `
      SELECT 
        s.id,
        s.user_id,
        s.item_id,
        i.name as item_name,
        i.icon as item_icon,
        i.color as item_color,
        i.tracking_type,
        s.activity_id,
        s.started_at,
        s.ended_at,
        s.duration_seconds,
        s.status,
        s.notes,
        s.created_at,
        COUNT(p.id)::int as places_count
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      LEFT JOIN session_places p ON s.id = p.session_id
      WHERE s.user_id = $1
    `;
    const params = [userId];

    if (itemId) {
      params.push(itemId);
      sql += ` AND s.item_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      sql += ` AND s.status = $${params.length}`;
    }

    sql += ` GROUP BY s.id, i.name, i.icon, i.color, i.tracking_type`;
    sql += ` ORDER BY s.started_at DESC`;

    const parsedLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 100);
    const parsedOffset = Math.max(parseInt(offset, 10) || 0, 0);
    params.push(parsedLimit, parsedOffset);
    sql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const { rows } = await query(sql, params);
    return rows;
  }

  static async getSessionById(userId, sessionId) {
    const { rows } = await query(
      `SELECT 
        s.id,
        s.user_id,
        s.item_id,
        i.name as item_name,
        i.icon as item_icon,
        i.color as item_color,
        i.tracking_type,
        s.activity_id,
        s.started_at,
        s.ended_at,
        s.duration_seconds,
        s.status,
        s.notes,
        s.created_at
      FROM activity_sessions s
      JOIN items i ON s.item_id = i.id
      WHERE s.id = $1 AND s.user_id = $2`,
      [sessionId, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const session = rows[0];

    // Fetch places for this session
    const placesRes = await query(
      `SELECT id, name, address, latitude, longitude, visited_at, notes
       FROM session_places 
       WHERE session_id = $1 AND user_id = $2
       ORDER BY visited_at ASC`,
      [sessionId, userId]
    );

    return {
      ...session,
      places: placesRes.rows,
    };
  }
}
