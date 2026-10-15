-- Migration 004: Support receivable tracking type on items and activity details

ALTER TABLE items ADD COLUMN IF NOT EXISTS target_amount NUMERIC(12, 2);
ALTER TABLE items ADD COLUMN IF NOT EXISTS currency VARCHAR(10) DEFAULT '₹';
ALTER TABLE activity_details ADD COLUMN IF NOT EXISTS payment_mode VARCHAR(50);
