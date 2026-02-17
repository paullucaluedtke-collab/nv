-- Migration: Create gamification tables for points, achievements, streaks, and leaderboards
-- This enables a comprehensive gamification system to motivate users

-- User Stats Table - Tracks points, streaks, and activity counts
CREATE TABLE IF NOT EXISTS user_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE,
  total_points INTEGER NOT NULL DEFAULT 0,
  activities_created INTEGER NOT NULL DEFAULT 0,
  activities_joined INTEGER NOT NULL DEFAULT 0,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_activity_date DATE,
  level INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Achievements Table - Defines available achievements
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  achievement_key TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  points_required INTEGER NOT NULL,
  category TEXT NOT NULL, -- 'creation', 'participation', 'streak', 'social'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Achievements Table - Tracks which achievements users have unlocked
CREATE TABLE IF NOT EXISTS user_achievements (
  user_id TEXT NOT NULL,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, achievement_id)
);

-- Points History Table - Tracks all point transactions for transparency
CREATE TABLE IF NOT EXISTS points_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  points INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'activity_created', 'activity_joined', 'achievement_unlocked', etc.
  activity_id TEXT,
  achievement_id UUID REFERENCES achievements(id),
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_stats_user_id ON user_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_user_stats_total_points ON user_stats(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_user_stats_level ON user_stats(level DESC);
CREATE INDEX IF NOT EXISTS idx_achievements_key ON achievements(achievement_key);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX IF NOT EXISTS idx_points_history_user_id ON points_history(user_id);
CREATE INDEX IF NOT EXISTS idx_points_history_created_at ON points_history(created_at DESC);

-- Add comments
COMMENT ON TABLE user_stats IS 'Tracks user gamification stats: points, streaks, activity counts';
COMMENT ON TABLE achievements IS 'Defines available achievements users can unlock';
COMMENT ON TABLE user_achievements IS 'Tracks which achievements each user has unlocked';
COMMENT ON TABLE points_history IS 'Audit trail of all point transactions';

-- Insert default achievements
INSERT INTO achievements (achievement_key, title, description, icon, points_required, category) VALUES
  ('first_activity', 'Erste Schritte', 'Erstelle deine erste Aktivität', '🎯', 0, 'creation'),
  ('creator_5', 'Aktiver Organisator', 'Erstelle 5 Aktivitäten', '⭐', 5, 'creation'),
  ('creator_10', 'Erfahrener Host', 'Erstelle 10 Aktivitäten', '🏆', 10, 'creation'),
  ('creator_25', 'Community Leader', 'Erstelle 25 Aktivitäten', '👑', 25, 'creation'),
  ('creator_50', 'Event Master', 'Erstelle 50 Aktivitäten', '🌟', 50, 'creation'),
  ('joiner_5', 'Gesellig', 'Nimm an 5 Aktivitäten teil', '🤝', 5, 'participation'),
  ('joiner_10', 'Aktiv dabei', 'Nimm an 10 Aktivitäten teil', '🎉', 10, 'participation'),
  ('joiner_25', 'Social Butterfly', 'Nimm an 25 Aktivitäten teil', '🦋', 25, 'participation'),
  ('joiner_50', 'Community Champion', 'Nimm an 50 Aktivitäten teil', '💫', 50, 'participation'),
  ('streak_3', 'Dranbleiben', '3 Tage in Folge aktiv', '🔥', 3, 'streak'),
  ('streak_7', 'Woche voller Action', '7 Tage in Folge aktiv', '🔥🔥', 7, 'streak'),
  ('streak_14', 'Zwei Wochen Power', '14 Tage in Folge aktiv', '🔥🔥🔥', 14, 'streak'),
  ('streak_30', 'Monat der Aktivität', '30 Tage in Folge aktiv', '🔥🔥🔥🔥', 30, 'streak'),
  ('points_100', 'Hundert Punkte', 'Sammle 100 Punkte', '💯', 100, 'social'),
  ('points_500', 'Fünfhundert Punkte', 'Sammle 500 Punkte', '💎', 500, 'social'),
  ('points_1000', 'Tausend Punkte', 'Sammle 1000 Punkte', '🏅', 1000, 'social')
ON CONFLICT (achievement_key) DO NOTHING;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER update_user_stats_updated_at_trigger
  BEFORE UPDATE ON user_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_user_stats_updated_at();

