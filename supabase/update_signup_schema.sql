-- Assume supabase_admin role to alter table
SET ROLE supabase_admin;

-- 1. Add phone column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;

-- 2. Update the trigger function to capture metadata
-- (We recreate it to ensure it handles the new logic)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, full_name, timezone, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'Australia/Hobart',
    NEW.raw_user_meta_data->>'phone'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reset role back
RESET ROLE;
