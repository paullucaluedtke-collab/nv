-- Migration: Complete Business Profiles Setup
-- Run this file to set up all business-related tables
-- Make sure to run migrations in order:
-- 1. create_business_profiles_table.sql
-- 2. create_business_offers_table.sql
-- 3. create_activity_promotions_table.sql
-- 4. add_business_fields_to_activities.sql

-- Note: This file is just a reference. Run each migration file separately in Supabase SQL Editor.

-- IMPORTANT: Before running migrations, create the storage bucket:
-- Storage > Buckets > New Bucket
-- Name: business-profiles
-- Public: Yes
-- File size limit: 5MB
-- Allowed MIME types: image/*

