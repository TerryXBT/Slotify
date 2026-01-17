-- Add onboarding tracking fields to profiles table
-- This migration adds fields to track user onboarding progress

-- Add onboarding_completed flag
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

-- Add onboarding_step to track current progress (0-4)
-- 0 = not started, 1 = profile, 2 = service, 3 = availability, 4 = completed
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS onboarding_step INTEGER DEFAULT 0;

-- Add index for quick filtering of users who haven't completed onboarding
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding
ON profiles(onboarding_completed)
WHERE onboarding_completed = FALSE;

-- Comment for documentation
COMMENT ON COLUMN profiles.onboarding_completed IS 'Whether user has completed the onboarding flow';
COMMENT ON COLUMN profiles.onboarding_step IS 'Current onboarding step: 0=not started, 1=profile, 2=service, 3=availability, 4=share/complete';
