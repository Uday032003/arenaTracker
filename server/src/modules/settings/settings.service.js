import bcrypt from 'bcryptjs';
import { query, getClient } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class SettingsService {
  static async getSettings(userId) {
    const userRes = await query('SELECT id, name, email, timezone, created_at FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    const user = userRes.rows[0];

    const settingsRes = await query('SELECT theme, timezone, preferences, updated_at FROM user_settings WHERE user_id = $1', [userId]);
    const settings = settingsRes.rows[0] || { theme: 'dark', timezone: user.timezone || 'UTC', preferences: {} };

    return {
      user,
      settings,
    };
  }

  static async updateSettings(userId, { name, timezone, theme, preferences }) {
    const client = await getClient();
    try {
      await client.query('BEGIN');

      if (name !== undefined || timezone !== undefined) {
        const uUpdates = [];
        const uParams = [userId];
        if (name !== undefined) {
          uParams.push(name.trim());
          uUpdates.push(`name = $${uParams.length}`);
        }
        if (timezone !== undefined) {
          uParams.push(timezone);
          uUpdates.push(`timezone = $${uParams.length}`);
        }
        uUpdates.push('updated_at = CURRENT_TIMESTAMP');
        await client.query(`UPDATE users SET ${uUpdates.join(', ')} WHERE id = $1`, uParams);
      }

      if (theme !== undefined || timezone !== undefined || preferences !== undefined) {
        await client.query(
          `INSERT INTO user_settings (user_id, theme, timezone, preferences, updated_at)
           VALUES ($1, COALESCE($2, 'dark'), COALESCE($3, 'UTC'), COALESCE($4, '{}'::jsonb), CURRENT_TIMESTAMP)
           ON CONFLICT (user_id) DO UPDATE SET
             theme = COALESCE($2, user_settings.theme),
             timezone = COALESCE($3, user_settings.timezone),
             preferences = COALESCE($4, user_settings.preferences),
             updated_at = CURRENT_TIMESTAMP`,
          [
            userId,
            theme || null,
            timezone || null,
            preferences ? JSON.stringify(preferences) : null,
          ]
        );
      }

      await client.query('COMMIT');
      return this.getSettings(userId);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  static async exportUserData(userId) {
    const userRes = await query('SELECT id, name, email, timezone, created_at FROM users WHERE id = $1', [userId]);
    const itemsRes = await query('SELECT * FROM items WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const variantsRes = await query('SELECT * FROM item_variants WHERE user_id = $1 ORDER BY created_at ASC', [userId]);
    const activitiesRes = await query(
      `SELECT a.*, ad.quantity, ad.price, ad.call_participant, ad.call_contact_label, ad.call_type, ad.call_duration_seconds
       FROM activities a
       LEFT JOIN activity_details ad ON a.id = ad.activity_id
       WHERE a.user_id = $1 ORDER BY a.occurred_at ASC`,
      [userId]
    );
    const sessionsRes = await query('SELECT * FROM activity_sessions WHERE user_id = $1 ORDER BY started_at ASC', [userId]);
    const placesRes = await query('SELECT * FROM session_places WHERE user_id = $1 ORDER BY visited_at ASC', [userId]);
    const categoriesRes = await query('SELECT * FROM categories WHERE user_id = $1 ORDER BY created_at ASC', [userId]);

    return {
      exported_at: new Date().toISOString(),
      user: userRes.rows[0],
      categories: categoriesRes.rows,
      items: itemsRes.rows,
      variants: variantsRes.rows,
      activities: activitiesRes.rows,
      sessions: sessionsRes.rows,
      places: placesRes.rows,
    };
  }

  static async deleteAccount(userId, password) {
    const userRes = await query('SELECT id, password_hash FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    const user = userRes.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      throw new AppError('Incorrect password. Account deletion aborted.', 401);
    }

    // Cascade deletes all user data per foreign keys
    await query('DELETE FROM users WHERE id = $1', [userId]);
    return true;
  }
}
