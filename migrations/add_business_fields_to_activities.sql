-- Migration: Add business-related fields to activities table
-- This allows activities to be linked to businesses and have offers

ALTER TABLE activities
ADD COLUMN IF NOT EXISTS business_id UUID REFERENCES business_profiles(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS is_business_activity BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS promotion_level TEXT CHECK (promotion_level IN ('none', 'featured', 'boost', 'sponsored')) DEFAULT 'none';

-- Create index for business activities
CREATE INDEX IF NOT EXISTS idx_activities_business_id ON activities(business_id);
CREATE INDEX IF NOT EXISTS idx_activities_is_business ON activities(is_business_activity) WHERE is_business_activity = true;
CREATE INDEX IF NOT EXISTS idx_activities_promotion_level ON activities(promotion_level) WHERE promotion_level != 'none';

-- Add comment
COMMENT ON COLUMN activities.business_id IS 'Reference to business profile if this is a business activity';
COMMENT ON COLUMN activities.is_business_activity IS 'Whether this activity is created by a business';
COMMENT ON COLUMN activities.promotion_level IS 'Promotion level: none, featured, boost, or sponsored';

