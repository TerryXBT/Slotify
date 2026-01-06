-- Backfill profiles for existing users who don't have one

INSERT INTO public.profiles (id, username, full_name, timezone)
SELECT
  au.id,
  split_part(au.email, '@', 1) as username,
  COALESCE(au.raw_user_meta_data->>'full_name', split_part(au.email, '@', 1)) as full_name,
  'Australia/Hobart' as timezone
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
