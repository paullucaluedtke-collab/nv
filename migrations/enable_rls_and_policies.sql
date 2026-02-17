-- Migration: Enable Row-Level Security (RLS) and create policies for all tables
-- This fixes the CRITICAL security issues where RLS was disabled

-- ============================================
-- 1. FRIENDS TABLE
-- ============================================
ALTER TABLE friends ENABLE ROW LEVEL SECURITY;

-- Users can see their own friend relationships
CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

-- Users can create friend requests
CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own friend relationships
CREATE POLICY "Users can update their own friend relationships"
  ON friends FOR UPDATE
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id)
  WITH CHECK (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

-- Users can delete their own friend relationships
CREATE POLICY "Users can delete their own friend relationships"
  ON friends FOR DELETE
  USING (auth.uid()::text = user_id OR auth.uid()::text = friend_id);

-- ============================================
-- 2. ACTIVITY_LOGS TABLE
-- ============================================
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can view activity logs (or users can view their own)
CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING (auth.uid()::text = user_id);

-- Service role can insert logs (via backend)
-- Note: This requires service role key, not user auth
-- For now, allow authenticated users to insert their own logs
CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK (auth.uid()::text = user_id OR user_id IS NULL);

-- Only service role can update/delete logs (handled via backend)
-- Regular users cannot update or delete logs

-- ============================================
-- 3. BUSINESS_PROFILES TABLE
-- ============================================
ALTER TABLE business_profiles ENABLE ROW LEVEL SECURITY;

-- Anyone can view verified business profiles
CREATE POLICY "Anyone can view verified business profiles"
  ON business_profiles FOR SELECT
  USING (status = 'verified' OR auth.uid()::text = user_id);

-- Users can create their own business profile
CREATE POLICY "Users can create their own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Users can update their own business profile
CREATE POLICY "Users can update their own business profile"
  ON business_profiles FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Users can delete their own business profile
CREATE POLICY "Users can delete their own business profile"
  ON business_profiles FOR DELETE
  USING (auth.uid()::text = user_id);

-- ============================================
-- 4. BUSINESS_OFFERS TABLE
-- ============================================
ALTER TABLE business_offers ENABLE ROW LEVEL SECURITY;

-- Anyone can view active offers
CREATE POLICY "Anyone can view active offers"
  ON business_offers FOR SELECT
  USING (is_active = true);

-- Business owners can view all their offers
CREATE POLICY "Business owners can view their offers"
  ON business_offers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can create offers for their activities
CREATE POLICY "Business owners can create offers"
  ON business_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can update their offers
CREATE POLICY "Business owners can update their offers"
  ON business_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can delete their offers
CREATE POLICY "Business owners can delete their offers"
  ON business_offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- ============================================
-- 5. ACTIVITY_PROMOTIONS TABLE
-- ============================================
ALTER TABLE activity_promotions ENABLE ROW LEVEL SECURITY;

-- Anyone can view active promotions
CREATE POLICY "Anyone can view active promotions"
  ON activity_promotions FOR SELECT
  USING (status = 'active');

-- Business owners can view their promotions
CREATE POLICY "Business owners can view their promotions"
  ON activity_promotions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can create promotions
CREATE POLICY "Business owners can create promotions"
  ON activity_promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can update their promotions
CREATE POLICY "Business owners can update their promotions"
  ON activity_promotions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- Business owners can delete their promotions
CREATE POLICY "Business owners can delete their promotions"
  ON activity_promotions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = auth.uid()::text
    )
  );

-- ============================================
-- 6. ACTIVITIES TABLE (if RLS not already enabled)
-- ============================================
-- Enable RLS if not already enabled
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'activities' 
    AND schemaname = 'public'
  ) THEN
    -- Table doesn't exist, skip
    NULL;
  ELSE
    -- Enable RLS
    ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist (to avoid conflicts)
    DROP POLICY IF EXISTS "Anyone can view public activities" ON activities;
    DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
    DROP POLICY IF EXISTS "Users can create activities" ON activities;
    DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
    DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
    
    -- Public activities are visible to everyone
    CREATE POLICY "Anyone can view public activities"
      ON activities FOR SELECT
      USING (visibility = 'public' OR visibility = 'friends');
    
    -- Users can view activities they created or joined
    -- Cast host_user_id to text to handle both UUID and TEXT types
    CREATE POLICY "Users can view their own activities"
      ON activities FOR SELECT
      USING (
        COALESCE(host_user_id::text, '') = auth.uid()::text
        OR auth.uid()::text = ANY(COALESCE(joined_user_ids::text[], ARRAY[]::text[]))
      );
    
    -- Users can create activities
    CREATE POLICY "Users can create activities"
      ON activities FOR INSERT
      WITH CHECK (COALESCE(host_user_id::text, '') = auth.uid()::text);
    
    -- Users can update their own activities
    CREATE POLICY "Users can update their own activities"
      ON activities FOR UPDATE
      USING (COALESCE(host_user_id::text, '') = auth.uid()::text)
      WITH CHECK (COALESCE(host_user_id::text, '') = auth.uid()::text);
    
    -- Users can delete their own activities
    CREATE POLICY "Users can delete their own activities"
      ON activities FOR DELETE
      USING (COALESCE(host_user_id::text, '') = auth.uid()::text);
  END IF;
END $$;

-- ============================================
-- 7. ACTIVITY_MESSAGES TABLE (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'activity_messages' 
    AND schemaname = 'public'
  ) THEN
    ALTER TABLE activity_messages ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view messages in joined activities" ON activity_messages;
    DROP POLICY IF EXISTS "Users can send messages in joined activities" ON activity_messages;
    DROP POLICY IF EXISTS "Users can update their own messages" ON activity_messages;
    DROP POLICY IF EXISTS "Users can delete their own messages" ON activity_messages;
    
    -- Users can view messages in activities they joined
    -- Cast both sides to text to handle UUID/TEXT types
    CREATE POLICY "Users can view messages in joined activities"
      ON activity_messages FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM activities
          WHERE activities.id::text = COALESCE(activity_messages.activity_id::text, '')
          AND (
            COALESCE(activities.host_user_id::text, '') = auth.uid()::text
            OR auth.uid()::text = ANY(COALESCE(activities.joined_user_ids::text[], ARRAY[]::text[]))
          )
        )
      );
    
    -- Users can send messages in activities they joined
    -- Cast both sides to text to handle UUID/TEXT types
    CREATE POLICY "Users can send messages in joined activities"
      ON activity_messages FOR INSERT
      WITH CHECK (
        COALESCE(user_id::text, '') = auth.uid()::text
        AND EXISTS (
          SELECT 1 FROM activities
          WHERE activities.id::text = COALESCE(activity_messages.activity_id::text, '')
          AND (
            COALESCE(activities.host_user_id::text, '') = auth.uid()::text
            OR auth.uid()::text = ANY(COALESCE(activities.joined_user_ids::text[], ARRAY[]::text[]))
          )
        )
      );
    
    -- Users can update their own messages
    CREATE POLICY "Users can update their own messages"
      ON activity_messages FOR UPDATE
      USING (COALESCE(user_id::text, '') = auth.uid()::text)
      WITH CHECK (COALESCE(user_id::text, '') = auth.uid()::text);
    
    -- Users can delete their own messages
    CREATE POLICY "Users can delete their own messages"
      ON activity_messages FOR DELETE
      USING (COALESCE(user_id::text, '') = auth.uid()::text);
  END IF;
END $$;

-- ============================================
-- 8. GLOBAL_MESSAGES TABLE (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'global_messages' 
    AND schemaname = 'public'
  ) THEN
    ALTER TABLE global_messages ENABLE ROW LEVEL SECURITY;
    
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Anyone can view global messages" ON global_messages;
    DROP POLICY IF EXISTS "Authenticated users can send global messages" ON global_messages;
    DROP POLICY IF EXISTS "Users can update their own global messages" ON global_messages;
    DROP POLICY IF EXISTS "Users can delete their own global messages" ON global_messages;
    
    -- Anyone can view global messages
    CREATE POLICY "Anyone can view global messages"
      ON global_messages FOR SELECT
      USING (true);
    
    -- Authenticated users can send global messages
    CREATE POLICY "Authenticated users can send global messages"
      ON global_messages FOR INSERT
      WITH CHECK (auth.uid() IS NOT NULL AND COALESCE(user_id::text, '') = auth.uid()::text);
    
    -- Users can update their own global messages
    CREATE POLICY "Users can update their own global messages"
      ON global_messages FOR UPDATE
      USING (COALESCE(user_id::text, '') = auth.uid()::text)
      WITH CHECK (COALESCE(user_id::text, '') = auth.uid()::text);
    
    -- Users can delete their own global messages
    CREATE POLICY "Users can delete their own global messages"
      ON global_messages FOR DELETE
      USING (COALESCE(user_id::text, '') = auth.uid()::text);
  END IF;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "Users can view their own friends" ON friends IS 'Users can see friend relationships where they are involved';
COMMENT ON POLICY "Users can view their own activity logs" ON activity_logs IS 'Users can only view their own activity logs for privacy';
COMMENT ON POLICY "Anyone can view verified business profiles" ON business_profiles IS 'Public can view verified businesses, owners can view their own regardless of status';

