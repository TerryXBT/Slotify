-- Clear all existing display names (full_name) from profiles table
UPDATE profiles SET full_name = NULL;

-- Verify it worked
SELECT id, username, full_name, avatar_url FROM profiles;
