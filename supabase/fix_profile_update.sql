-- Simple fix for profile updates
-- Run this in Supabase SQL Editor

-- Add avatar_url column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Add updated_at column if missing
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Drop existing update policy if any
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- Create new update policy
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Verify it worked
SELECT * FROM profiles LIMIT 1;
