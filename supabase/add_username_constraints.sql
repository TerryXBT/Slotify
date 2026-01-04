-- Add username length constraint
-- Twitter: 15 chars, Instagram: 30 chars
-- We'll use 20 characters for a good balance

-- Add check constraint for username length
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS username_length_check;

ALTER TABLE profiles 
ADD CONSTRAINT username_length_check 
CHECK (char_length(username) >= 3 AND char_length(username) <= 20);

-- Also add constraint to only allow alphanumeric and underscore
ALTER TABLE profiles 
DROP CONSTRAINT IF EXISTS username_format_check;

ALTER TABLE profiles 
ADD CONSTRAINT username_format_check 
CHECK (username ~ '^[a-z0-9_]+$');

-- Verify constraints
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'profiles'::regclass 
AND contype = 'c';
