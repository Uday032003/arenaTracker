import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class PlacesService {
  static async getPlacesBySessionId(userId, sessionId) {
    // Check session ownership
    const sessionCheck = await query('SELECT id FROM activity_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionCheck.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const { rows } = await query(
      `SELECT id, session_id, name, address, latitude, longitude, visited_at, notes, created_at
       FROM session_places
       WHERE session_id = $1 AND user_id = $2
       ORDER BY visited_at ASC`,
      [sessionId, userId]
    );

    return rows;
  }

  static async addPlace(userId, sessionId, { name, address = '', latitude = null, longitude = null, visitedAt = null, notes = '' }) {
    // Check session ownership
    const sessionCheck = await query('SELECT id FROM activity_sessions WHERE id = $1 AND user_id = $2', [sessionId, userId]);
    if (sessionCheck.rows.length === 0) {
      throw new AppError('Session not found', 404);
    }

    const timestamp = visitedAt ? new Date(visitedAt).toISOString() : new Date().toISOString();

    const { rows } = await query(
      `INSERT INTO session_places (user_id, session_id, name, address, latitude, longitude, visited_at, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        userId,
        sessionId,
        name.trim(),
        address ? address.trim() : '',
        latitude !== null ? latitude : null,
        longitude !== null ? longitude : null,
        timestamp,
        notes ? notes.trim() : '',
      ]
    );

    return rows[0];
  }

  static async updatePlace(userId, placeId, { name, address, latitude, longitude, visitedAt, notes }) {
    const check = await query('SELECT id FROM session_places WHERE id = $1 AND user_id = $2', [placeId, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Place not found', 404);
    }

    const updates = [];
    const params = [placeId, userId];

    if (name !== undefined) {
      params.push(name.trim());
      updates.push(`name = $${params.length}`);
    }
    if (address !== undefined) {
      params.push(address.trim());
      updates.push(`address = $${params.length}`);
    }
    if (latitude !== undefined) {
      params.push(latitude);
      updates.push(`latitude = $${params.length}`);
    }
    if (longitude !== undefined) {
      params.push(longitude);
      updates.push(`longitude = $${params.length}`);
    }
    if (visitedAt !== undefined) {
      params.push(new Date(visitedAt).toISOString());
      updates.push(`visited_at = $${params.length}`);
    }
    if (notes !== undefined) {
      params.push(notes ? notes.trim() : '');
      updates.push(`notes = $${params.length}`);
    }

    const { rows } = await query(
      `UPDATE session_places SET ${updates.join(', ')} WHERE id = $1 AND user_id = $2 RETURNING *`,
      params
    );

    return rows[0];
  }

  static async deletePlace(userId, placeId) {
    const { rows } = await query(
      `DELETE FROM session_places WHERE id = $1 AND user_id = $2 RETURNING id`,
      [placeId, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Place not found', 404);
    }

    return rows[0];
  }
}
