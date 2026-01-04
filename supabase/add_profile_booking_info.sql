-- Add profile booking page customization fields
-- Run this in Supabase SQL Editor

-- Add new columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cancellation_policy TEXT;

-- Add constraints for reasonable text lengths
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS bio_length_check;
ALTER TABLE profiles 
ADD CONSTRAINT bio_length_check 
CHECK (char_length(bio) <= 200);

ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS cancellation_policy_length_check;
ALTER TABLE profiles 
ADD CONSTRAINT cancellation_policy_length_check 
CHECK (char_length(cancellation_policy) <= 500);

-- Verify the changes
SELECT column_name, data_type, character_maximum_length 
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND column_name IN ('bio', 'location', 'phone', 'email', 'cancellation_policy');
