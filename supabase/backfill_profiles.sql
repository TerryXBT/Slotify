-- Fix for existing users who are missing profiles
-- Run this in Supabase Studio SQL Editor (http://127.0.0.1:54323)

INSERT INTO public.profiles (id, username, full_name, timezone)
SELECT 
  id, 
  split_part(email, '@', 1), -- Generate username from email
  split_part(email, '@', 1), -- Generate full_name from email
  'Australia/Hobart'         -- Default timezone
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
