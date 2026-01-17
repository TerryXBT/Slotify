-- Update profile trigger to set onboarding_completed = false for new users
-- This ensures new users go through the onboarding flow

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  base_username text;
  final_username text;
  username_suffix text;
BEGIN
  -- Get base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    split_part(NEW.email, '@', 1)
  );

  -- Generate a unique username by appending part of the user ID
  -- This ensures uniqueness even if multiple users have the same email prefix
  username_suffix := substring(NEW.id::text, 1, 8);
  final_username := base_username || '_' || username_suffix;

  INSERT INTO public.profiles (id, username, full_name, timezone, phone, onboarding_completed, onboarding_step)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'Australia/Hobart',
    NEW.raw_user_meta_data->>'phone',
    false,  -- New users need to complete onboarding
    0       -- Start at step 0
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: The trigger itself doesn't need to be recreated as it references the function
