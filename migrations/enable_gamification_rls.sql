-- Enable RLS on gamification tables
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE points_history ENABLE ROW LEVEL SECURITY;

-- Policies for user_stats
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public user_stats read access' AND tablename = 'user_stats'
    ) THEN
        CREATE POLICY "Public user_stats read access" ON user_stats FOR SELECT USING (true);
    END IF;
END
$$;

-- Policies for achievements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public achievements read access' AND tablename = 'achievements'
    ) THEN
        CREATE POLICY "Public achievements read access" ON achievements FOR SELECT USING (true);
    END IF;
END
$$;

-- Policies for user_achievements
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Public user_achievements read access' AND tablename = 'user_achievements'
    ) THEN
        CREATE POLICY "Public user_achievements read access" ON user_achievements FOR SELECT USING (true);
    END IF;
END
$$;

-- Policies for points_history
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can read own points history' AND tablename = 'points_history'
    ) THEN
        CREATE POLICY "Users can read own points history" ON points_history FOR SELECT USING (auth.uid()::text = user_id);
    END IF;
END
$$;

-- Allow users to update their own stats (if needed for client-side logic, though server-side is preferred)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own stats' AND tablename = 'user_stats'
    ) THEN
         CREATE POLICY "Users can update own stats" ON user_stats FOR UPDATE USING (auth.uid()::text = user_id);
    END IF;
END
$$;

-- Allow users to insert their own stats (needed for initial creation if happening from client)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own stats' AND tablename = 'user_stats'
    ) THEN
         CREATE POLICY "Users can insert own stats" ON user_stats FOR INSERT WITH CHECK (auth.uid()::text = user_id);
    END IF;
END
$$;
