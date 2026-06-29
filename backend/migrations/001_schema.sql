-- ============================================================
-- PropCopy AI — Supabase Database Migration
-- Run this in your Supabase SQL Editor (supabase.com → SQL Editor)
-- ============================================================

-- ── 1. PROPERTIES TABLE ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS properties (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    raw_bullet_points TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ── 2. PROPERTY_IMAGES TABLE ─────────────────────────────────
CREATE TABLE IF NOT EXISTS property_images (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    storage_path TEXT NOT NULL,
    ai_analysis TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ── 3. MARKETING_ASSETS TABLE ────────────────────────────────
CREATE TABLE IF NOT EXISTS marketing_assets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    property_id UUID REFERENCES properties(id) ON DELETE CASCADE NOT NULL,
    mls_description TEXT,
    instagram_script TEXT,
    email_blast TEXT,
    facebook_ad TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ── 4. USER_CREDITS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    credits_remaining INTEGER DEFAULT 5 NOT NULL,
    trial_ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ── 5. PAYMENT_LOGS TABLE ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS payment_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    razorpay_order_id TEXT NOT NULL,
    razorpay_payment_id TEXT NOT NULL,
    amount_paise INTEGER NOT NULL,
    credits_purchased INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================

-- Enable RLS on all tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketing_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_logs ENABLE ROW LEVEL SECURITY;

-- Properties: users can only see/edit their own
CREATE POLICY "Users can view own properties" ON properties
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own properties" ON properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own properties" ON properties
    FOR DELETE USING (auth.uid() = user_id);

-- Property Images: accessible via property ownership
CREATE POLICY "Users can view own property images" ON property_images
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = property_images.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- Marketing Assets: accessible via property ownership
CREATE POLICY "Users can view own marketing assets" ON marketing_assets
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM properties
            WHERE properties.id = marketing_assets.property_id
            AND properties.user_id = auth.uid()
        )
    );

-- User Credits: users can view their own credits
CREATE POLICY "Users can view own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

-- Payment Logs: users can view their own payments
CREATE POLICY "Users can view own payments" ON payment_logs
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================
-- STORAGE SETUP (Bucket & Policies)
-- ============================================================

-- Create property-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('property-images', 'property-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop policies if they already exist to prevent duplicate errors
DROP POLICY IF EXISTS "Allow auth upload to property-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public select from property-images" ON storage.objects;

-- Policy: Allow authenticated users to upload to a folder named after their user_id
CREATE POLICY "Allow auth upload to property-images" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (
        bucket_id = 'property-images' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Policy: Allow public read access to images
CREATE POLICY "Allow public select from property-images" ON storage.objects
    FOR SELECT TO public USING (
        bucket_id = 'property-images'
    );

-- ============================================================
-- INDEXES for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_properties_user_id ON properties(user_id);
CREATE INDEX IF NOT EXISTS idx_property_images_property_id ON property_images(property_id);
CREATE INDEX IF NOT EXISTS idx_marketing_assets_property_id ON marketing_assets(property_id);
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_logs_user_id ON payment_logs(user_id);
