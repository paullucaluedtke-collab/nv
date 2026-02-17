-- Migration: Add username field to user_profiles table
-- This allows users to have a unique, searchable username/handle

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username TEXT;

-- Create unique index for username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_profiles_username_lower ON user_profiles(LOWER(username)) WHERE username IS NOT NULL;

-- Create index for faster username searches
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username) WHERE username IS NOT NULL;

-- Add comment
COMMENT ON COLUMN user_profiles.username IS 'Unique username/handle for the user profile. Used for friend requests and profile sharing.';

