import { query } from '../../config/db.js';
import { AppError } from '../../middleware/errorHandler.js';

export class RemindersService {
  /**
   * Get all reminders for a user with optional filtering
   */
  static async getReminders(userId, { status, type } = {}) {
    let sql = `
      SELECT id, user_id, title, type, amount, currency, due_datetime,
             recurrence, alarm_enabled, notes, status, snoozed_until,
             remind_before_days, last_triggered_at, created_at, updated_at
      FROM reminders
      WHERE user_id = $1
    `;
    const params = [userId];

    if (status && status !== 'all') {
      params.push(status);
      sql += ` AND status = $${params.length}`;
    }

    if (type && type !== 'all') {
      params.push(type);
      sql += ` AND type = $${params.length}`;
    }

    sql += ` ORDER BY due_datetime ASC`;

    const { rows } = await query(sql, params);
    return rows;
  }

  /**
   * Get reminders that are currently due and need an active alarm
   * Takes remind_before_days into account so alarm triggers N days before due_datetime
   */
  static async getDueReminders(userId) {
    const { rows } = await query(
      `SELECT * FROM reminders
       WHERE user_id = $1
         AND alarm_enabled = true
         AND status != 'completed'
         AND (
           (snoozed_until IS NOT NULL AND snoozed_until <= CURRENT_TIMESTAMP)
           OR (
             snoozed_until IS NULL
             AND (due_datetime - (COALESCE(remind_before_days, 0) || ' days')::INTERVAL) <= CURRENT_TIMESTAMP
           )
         )
       ORDER BY due_datetime ASC`,
      [userId]
    );
    return rows;
  }

  /**
   * Create a new reminder
   */
  static async createReminder(userId, data) {
    const {
      title,
      type = 'custom',
      amount = null,
      currency = '₹',
      due_datetime,
      recurrence = 'none',
      alarm_enabled = true,
      remind_before_days = 0,
      notes = '',
    } = data;

    const { rows } = await query(
      `INSERT INTO reminders (
        user_id, title, type, amount, currency, due_datetime,
        recurrence, alarm_enabled, remind_before_days, notes, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'pending')
      RETURNING *`,
      [
        userId,
        title.trim(),
        type,
        amount ? parseFloat(amount) : null,
        currency || '₹',
        due_datetime,
        recurrence,
        Boolean(alarm_enabled),
        parseInt(remind_before_days || '0', 10),
        notes ? notes.trim() : null,
      ]
    );

    return rows[0];
  }

  /**
   * Update an existing reminder
   */
  static async updateReminder(userId, id, data) {
    const check = await query('SELECT id FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Reminder not found', 404);
    }

    const updates = [];
    const params = [id, userId];

    const fields = [
      'title', 'type', 'amount', 'currency', 'due_datetime',
      'recurrence', 'alarm_enabled', 'remind_before_days', 'notes', 'status'
    ];

    fields.forEach((field) => {
      if (data[field] !== undefined) {
        params.push(data[field]);
        updates.push(`${field} = $${params.length}`);
      }
    });

    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    const { rows } = await query(
      `UPDATE reminders SET ${updates.join(', ')}
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      params
    );

    return rows[0];
  }

  /**
   * Dismiss an active alarm: stops alarm, and if recurring moves due date to next period
   */
  static async dismissReminder(userId, id) {
    const check = await query('SELECT * FROM reminders WHERE id = $1 AND user_id = $2', [id, userId]);
    if (check.rows.length === 0) {
      throw new AppError('Reminder not found', 404);
    }

    const reminder = check.rows[0];
    let nextDueDate = null;

    if (reminder.recurrence && reminder.recurrence !== 'none') {
      const currentDue = new Date(reminder.due_datetime);
      switch (reminder.recurrence) {
        case 'daily':
          currentDue.setDate(currentDue.getDate() + 1);
          break;
        case 'weekly':
          currentDue.setDate(currentDue.getDate() + 7);
          break;
        case 'monthly':
          currentDue.setMonth(currentDue.getMonth() + 1);
          break;
        case 'yearly':
          currentDue.setFullYear(currentDue.getFullYear() + 1);
          break;
      }
      nextDueDate = currentDue.toISOString();
    }

    const { rows } = await query(
      `UPDATE reminders
       SET status = $3,
           due_datetime = COALESCE($4, due_datetime),
           snoozed_until = NULL,
           last_triggered_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [
        id,
        userId,
        reminder.recurrence !== 'none' ? 'pending' : 'dismissed',
        nextDueDate,
      ]
    );

    return rows[0];
  }

  /**
   * Snooze alarm for given minutes (default 10 mins)
   */
  static async snoozeReminder(userId, id, minutes = 10) {
    const snoozeDate = new Date(Date.now() + minutes * 60 * 1000).toISOString();

    const { rows } = await query(
      `UPDATE reminders
       SET snoozed_until = $3,
           status = 'snoozed',
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId, snoozeDate]
    );

    if (rows.length === 0) {
      throw new AppError('Reminder not found', 404);
    }

    return rows[0];
  }

  /**
   * Mark reminder as completed
   */
  static async completeReminder(userId, id) {
    const { rows } = await query(
      `UPDATE reminders
       SET status = 'completed',
           snoozed_until = NULL,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [id, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Reminder not found', 404);
    }

    return rows[0];
  }

  /**
   * Delete reminder
   */
  static async deleteReminder(userId, id) {
    const { rows } = await query(
      `DELETE FROM reminders WHERE id = $1 AND user_id = $2 RETURNING id`,
      [id, userId]
    );

    if (rows.length === 0) {
      throw new AppError('Reminder not found', 404);
    }

    return rows[0];
  }
}
