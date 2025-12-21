-- Add time columns to rentals table for time-based rentals
-- Run this SQL in your Supabase SQL Editor

ALTER TABLE rentals 
ADD COLUMN IF NOT EXISTS rent_time TIME DEFAULT NULL,
ADD COLUMN IF NOT EXISTS return_time TIME DEFAULT NULL;

-- Add comments for documentation
COMMENT ON COLUMN rentals.rent_time IS 'Start time for time-based rentals (24-hour format, e.g., 09:00). NULL = all-day rental';
COMMENT ON COLUMN rentals.return_time IS 'End time for time-based rentals (24-hour format, e.g., 16:00). NULL = all-day rental';

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'rentals' 
  AND column_name IN ('rent_time', 'return_time');
