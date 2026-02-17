-- Migration: Add password field to activities table
-- This allows activities to be password-protected

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create index for password-protected activities (optional, for filtering)
CREATE INDEX IF NOT EXISTS idx_activities_password ON activities(password) WHERE password IS NOT NULL;

-- Add comment
COMMENT ON COLUMN activities.password IS 'Optional password for private activities. If set, users must enter password to join.';

