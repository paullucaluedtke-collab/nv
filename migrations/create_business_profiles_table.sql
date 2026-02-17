-- Migration: Create business_profiles table
-- This table stores business profiles for clubs, bars, restaurants, etc.

CREATE TABLE IF NOT EXISTS business_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL UNIQUE, -- Owner user ID (one business per user)
  business_name TEXT NOT NULL,
  business_type TEXT NOT NULL CHECK (business_type IN ('club', 'bar', 'restaurant', 'sport_club', 'cafe', 'event_venue', 'gym', 'other')),
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  
  -- Location
  address TEXT,
  city TEXT,
  postal_code TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  
  -- Media
  logo_url TEXT,
  cover_image_url TEXT,
  gallery_urls JSONB DEFAULT '[]'::jsonb, -- Max 10 images
  
  -- Business hours (JSONB)
  opening_hours JSONB,
  
  -- Verification & Status
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected', 'suspended')),
  verified_at TIMESTAMPTZ,
  verified_by TEXT, -- Admin user ID
  
  -- Business details
  tax_id TEXT,
  registration_number TEXT,
  
  -- Features & Settings
  can_create_activities BOOLEAN DEFAULT true,
  can_promote_activities BOOLEAN DEFAULT false, -- Requires payment/verification
  promotion_credits INTEGER DEFAULT 0, -- Available promotion credits
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_business_profiles_user_id ON business_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_business_profiles_status ON business_profiles(status);
CREATE INDEX IF NOT EXISTS idx_business_profiles_business_type ON business_profiles(business_type);
CREATE INDEX IF NOT EXISTS idx_business_profiles_location ON business_profiles(latitude, longitude) 
  WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Add constraint for gallery URLs max length
ALTER TABLE business_profiles
ADD CONSTRAINT check_gallery_urls_max_length 
CHECK (jsonb_array_length(COALESCE(gallery_urls, '[]'::jsonb)) <= 10);

-- Add comment
COMMENT ON TABLE business_profiles IS 'Stores business profiles for clubs, bars, restaurants, sport clubs, etc.';

