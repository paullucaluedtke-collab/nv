-- Migration: Create business_offers table
-- This table stores offers/deals that businesses can attach to activities

CREATE TABLE IF NOT EXISTS business_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id UUID NOT NULL REFERENCES business_profiles(id) ON DELETE CASCADE,
  activity_id UUID NOT NULL REFERENCES activities(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed', 'free_item', 'other')),
  discount_value INTEGER, -- Percentage (0-100) or fixed amount in cents
  terms TEXT, -- Terms and conditions
  valid_from TIMESTAMPTZ NOT NULL,
  valid_until TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_offers_business_id ON business_offers(business_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_activity_id ON business_offers(activity_id);
CREATE INDEX IF NOT EXISTS idx_business_offers_valid_dates ON business_offers(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_business_offers_active ON business_offers(is_active) WHERE is_active = true;

-- Add comment
COMMENT ON TABLE business_offers IS 'Stores offers/deals that businesses can attach to their activities';

