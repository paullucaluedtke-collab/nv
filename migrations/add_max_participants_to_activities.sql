-- Migration: Add max_participants field to activities table
-- This allows activities to have a maximum number of participants

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS max_participants INTEGER DEFAULT NULL;

-- Add comment
COMMENT ON COLUMN activities.max_participants IS 'Maximum number of participants allowed. NULL means no limit.';

