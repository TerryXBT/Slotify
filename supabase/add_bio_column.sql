-- Add bio column to profiles table for booking page
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS bio text;

COMMENT ON COLUMN profiles.bio IS 'Short bio displayed on public booking page';
