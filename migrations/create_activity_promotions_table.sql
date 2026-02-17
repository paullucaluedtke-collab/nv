-- Migration: Create activity_promotions table
-- This table stores paid promotions for activities (featured, boost, sponsored)

CREATE TABLE IF NOT EXISTS activity_promotions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  promotion_type TEXT NOT NULL CHECK (promotion_type IN ('featured', 'boost', 'sponsored')),
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  cost INTEGER NOT NULL, -- Cost in cents
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_activity_promotions_activity_id ON activity_promotions(activity_id);
CREATE INDEX IF NOT EXISTS idx_activity_promotions_business_id ON activity_promotions(business_id);
CREATE INDEX IF NOT EXISTS idx_activity_promotions_status ON activity_promotions(status);
CREATE INDEX IF NOT EXISTS idx_activity_promotions_dates ON activity_promotions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_activity_promotions_active ON activity_promotions(status, start_date, end_date) 
  WHERE status = 'active';

-- Add comment
COMMENT ON TABLE activity_promotions IS 'Stores paid promotions for activities (featured, boost, sponsored)';

