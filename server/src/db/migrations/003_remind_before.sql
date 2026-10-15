-- Migration 003: Add remind_before_days to reminders table

ALTER TABLE reminders ADD COLUMN IF NOT EXISTS remind_before_days INTEGER DEFAULT 0;
