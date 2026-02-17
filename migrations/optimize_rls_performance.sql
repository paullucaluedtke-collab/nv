-- Migration: Optimize RLS Policies for Performance
-- This fixes performance issues by:
-- 1. Using (select auth.uid()) instead of auth.uid() to avoid re-evaluation per row
-- 2. Removing duplicate policies that cause multiple permissive policy warnings

-- ============================================
-- 1. FRIENDS TABLE - Optimize auth.uid() calls
-- ============================================
DROP POLICY IF EXISTS "Users can view their own friends" ON friends;
DROP POLICY IF EXISTS "Users can create friend requests" ON friends;
DROP POLICY IF EXISTS "Users can update their own friend relationships" ON friends;
DROP POLICY IF EXISTS "Users can delete their own friend relationships" ON friends;

CREATE POLICY "Users can view their own friends"
  ON friends FOR SELECT
  USING ((select auth.uid())::text = user_id OR (select auth.uid())::text = friend_id);

CREATE POLICY "Users can create friend requests"
  ON friends FOR INSERT
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own friend relationships"
  ON friends FOR UPDATE
  USING ((select auth.uid())::text = user_id OR (select auth.uid())::text = friend_id)
  WITH CHECK ((select auth.uid())::text = user_id OR (select auth.uid())::text = friend_id);

CREATE POLICY "Users can delete their own friend relationships"
  ON friends FOR DELETE
  USING ((select auth.uid())::text = user_id OR (select auth.uid())::text = friend_id);

-- ============================================
-- 2. ACTIVITY_LOGS TABLE - Optimize auth.uid() calls
-- ============================================
DROP POLICY IF EXISTS "Users can view their own activity logs" ON activity_logs;
DROP POLICY IF EXISTS "Users can insert their own activity logs" ON activity_logs;

CREATE POLICY "Users can view their own activity logs"
  ON activity_logs FOR SELECT
  USING ((select auth.uid())::text = user_id);

CREATE POLICY "Users can insert their own activity logs"
  ON activity_logs FOR INSERT
  WITH CHECK ((select auth.uid())::text = user_id OR user_id IS NULL);

-- ============================================
-- 3. BUSINESS_PROFILES TABLE - Optimize and consolidate
-- ============================================
DROP POLICY IF EXISTS "Anyone can view verified business profiles" ON business_profiles;
DROP POLICY IF EXISTS "Users can create their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can update their own business profile" ON business_profiles;
DROP POLICY IF EXISTS "Users can delete their own business profile" ON business_profiles;

CREATE POLICY "Anyone can view verified business profiles"
  ON business_profiles FOR SELECT
  USING (status = 'verified' OR (select auth.uid())::text = user_id);

CREATE POLICY "Users can create their own business profile"
  ON business_profiles FOR INSERT
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can update their own business profile"
  ON business_profiles FOR UPDATE
  USING ((select auth.uid())::text = user_id)
  WITH CHECK ((select auth.uid())::text = user_id);

CREATE POLICY "Users can delete their own business profile"
  ON business_profiles FOR DELETE
  USING ((select auth.uid())::text = user_id);

-- ============================================
-- 4. BUSINESS_OFFERS TABLE - Optimize and consolidate
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active offers" ON business_offers;
DROP POLICY IF EXISTS "Business owners can view their offers" ON business_offers;
DROP POLICY IF EXISTS "Business owners can create offers" ON business_offers;
DROP POLICY IF EXISTS "Business owners can update their offers" ON business_offers;
DROP POLICY IF EXISTS "Business owners can delete their offers" ON business_offers;

-- Consolidated: Anyone can view active offers OR business owners can view all their offers
CREATE POLICY "Users can view offers"
  ON business_offers FOR SELECT
  USING (
    is_active = true
    OR EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can create offers"
  ON business_offers FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can update their offers"
  ON business_offers FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can delete their offers"
  ON business_offers FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = business_offers.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

-- ============================================
-- 5. ACTIVITY_PROMOTIONS TABLE - Optimize and consolidate
-- ============================================
DROP POLICY IF EXISTS "Anyone can view active promotions" ON activity_promotions;
DROP POLICY IF EXISTS "Business owners can view their promotions" ON activity_promotions;
DROP POLICY IF EXISTS "Business owners can create promotions" ON activity_promotions;
DROP POLICY IF EXISTS "Business owners can update their promotions" ON activity_promotions;
DROP POLICY IF EXISTS "Business owners can delete their promotions" ON activity_promotions;

-- Consolidated: Anyone can view active promotions OR business owners can view all their promotions
CREATE POLICY "Users can view promotions"
  ON activity_promotions FOR SELECT
  USING (
    status = 'active'
    OR EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can create promotions"
  ON activity_promotions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can update their promotions"
  ON activity_promotions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

CREATE POLICY "Business owners can delete their promotions"
  ON activity_promotions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM business_profiles
      WHERE business_profiles.id = activity_promotions.business_id
      AND business_profiles.user_id = (select auth.uid())::text
    )
  );

-- ============================================
-- 6. ACTIVITIES TABLE - Optimize and consolidate duplicate policies
-- ============================================
-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view public activities" ON activities;
DROP POLICY IF EXISTS "Users can view their own activities" ON activities;
DROP POLICY IF EXISTS "Users can create activities" ON activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON activities;
DROP POLICY IF EXISTS "Users can delete their own activities" ON activities;
DROP POLICY IF EXISTS "Authenticated users can create activities" ON activities;
DROP POLICY IF EXISTS "Host can update own activity" ON activities;
DROP POLICY IF EXISTS "Host can delete own activity" ON activities;
DROP POLICY IF EXISTS "Users can read activities based on visibility" ON activities;

-- Consolidated SELECT policy: Public activities OR users can view their own/joined activities
CREATE POLICY "Users can read activities"
  ON activities FOR SELECT
  USING (
    visibility = 'public' 
    OR visibility = 'friends'
    OR COALESCE(host_user_id::text, '') = (select auth.uid())::text
    OR (select auth.uid())::text = ANY(COALESCE(joined_user_ids::text[], ARRAY[]::text[]))
  );

-- Consolidated INSERT policy
CREATE POLICY "Users can create activities"
  ON activities FOR INSERT
  WITH CHECK (COALESCE(host_user_id::text, '') = (select auth.uid())::text);

-- Consolidated UPDATE policy
CREATE POLICY "Users can update their own activities"
  ON activities FOR UPDATE
  USING (COALESCE(host_user_id::text, '') = (select auth.uid())::text)
  WITH CHECK (COALESCE(host_user_id::text, '') = (select auth.uid())::text);

-- Consolidated DELETE policy
CREATE POLICY "Users can delete their own activities"
  ON activities FOR DELETE
  USING (COALESCE(host_user_id::text, '') = (select auth.uid())::text);

-- ============================================
-- 7. ACTIVITY_MESSAGES TABLE - Optimize and consolidate
-- ============================================
DROP POLICY IF EXISTS "Users can view messages in joined activities" ON activity_messages;
DROP POLICY IF EXISTS "Users can send messages in joined activities" ON activity_messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON activity_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON activity_messages;
DROP POLICY IF EXISTS "Users can read messages for joined activities" ON activity_messages;
DROP POLICY IF EXISTS "Users can send messages to joined activities" ON activity_messages;

-- Consolidated SELECT policy
CREATE POLICY "Users can read messages for joined activities"
  ON activity_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id::text = COALESCE(activity_messages.activity_id::text, '')
      AND (
        COALESCE(activities.host_user_id::text, '') = (select auth.uid())::text
        OR (select auth.uid())::text = ANY(COALESCE(activities.joined_user_ids::text[], ARRAY[]::text[]))
      )
    )
  );

-- Consolidated INSERT policy
CREATE POLICY "Users can send messages to joined activities"
  ON activity_messages FOR INSERT
  WITH CHECK (
    COALESCE(user_id::text, '') = (select auth.uid())::text
    AND EXISTS (
      SELECT 1 FROM activities
      WHERE activities.id::text = COALESCE(activity_messages.activity_id::text, '')
      AND (
        COALESCE(activities.host_user_id::text, '') = (select auth.uid())::text
        OR (select auth.uid())::text = ANY(COALESCE(activities.joined_user_ids::text[], ARRAY[]::text[]))
      )
    )
  );

CREATE POLICY "Users can update their own messages"
  ON activity_messages FOR UPDATE
  USING (COALESCE(user_id::text, '') = (select auth.uid())::text)
  WITH CHECK (COALESCE(user_id::text, '') = (select auth.uid())::text);

CREATE POLICY "Users can delete their own messages"
  ON activity_messages FOR DELETE
  USING (COALESCE(user_id::text, '') = (select auth.uid())::text);

-- ============================================
-- 8. GLOBAL_MESSAGES TABLE - Optimize and consolidate
-- ============================================
DROP POLICY IF EXISTS "Anyone can view global messages" ON global_messages;
DROP POLICY IF EXISTS "Authenticated users can send global messages" ON global_messages;
DROP POLICY IF EXISTS "Users can update their own global messages" ON global_messages;
DROP POLICY IF EXISTS "Users can delete their own global messages" ON global_messages;
DROP POLICY IF EXISTS "Anyone can read global messages" ON global_messages;
DROP POLICY IF EXISTS "Authenticated users can send messages" ON global_messages;
DROP POLICY IF EXISTS "Users can delete their own messages" ON global_messages;

-- Consolidated SELECT policy
CREATE POLICY "Anyone can read global messages"
  ON global_messages FOR SELECT
  USING (true);

-- Consolidated INSERT policy
CREATE POLICY "Authenticated users can send global messages"
  ON global_messages FOR INSERT
  WITH CHECK ((select auth.uid()) IS NOT NULL AND COALESCE(user_id::text, '') = (select auth.uid())::text);

-- Consolidated UPDATE policy
CREATE POLICY "Users can update their own global messages"
  ON global_messages FOR UPDATE
  USING (COALESCE(user_id::text, '') = (select auth.uid())::text)
  WITH CHECK (COALESCE(user_id::text, '') = (select auth.uid())::text);

-- Consolidated DELETE policy
CREATE POLICY "Users can delete their own global messages"
  ON global_messages FOR DELETE
  USING (COALESCE(user_id::text, '') = (select auth.uid())::text);

-- ============================================
-- 9. USER_PROFILES TABLE - Optimize (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'user_profiles' 
    AND schemaname = 'public'
  ) THEN
    DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
    DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
    
    CREATE POLICY "Users can insert own profile"
      ON user_profiles FOR INSERT
      WITH CHECK (COALESCE(user_id::text, '') = (select auth.uid())::text);
    
    CREATE POLICY "Users can update own profile"
      ON user_profiles FOR UPDATE
      USING (COALESCE(user_id::text, '') = (select auth.uid())::text)
      WITH CHECK (COALESCE(user_id::text, '') = (select auth.uid())::text);
  END IF;
END $$;

-- ============================================
-- 10. REPORTS TABLE - Optimize (if exists)
-- ============================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_tables 
    WHERE tablename = 'reports' 
    AND schemaname = 'public'
  ) THEN
    DROP POLICY IF EXISTS "Authenticated users can create reports" ON reports;
    
    CREATE POLICY "Authenticated users can create reports"
      ON reports FOR INSERT
      WITH CHECK ((select auth.uid()) IS NOT NULL);
  END IF;
END $$;

-- ============================================
-- Comments
-- ============================================
COMMENT ON POLICY "Users can view their own friends" ON friends IS 'Users can see friend relationships where they are involved - optimized with (select auth.uid())';
COMMENT ON POLICY "Users can view their own activity logs" ON activity_logs IS 'Users can only view their own activity logs for privacy - optimized with (select auth.uid())';
COMMENT ON POLICY "Users can read activities" ON activities IS 'Consolidated policy: Public activities OR users can view their own/joined activities - optimized with (select auth.uid())';

