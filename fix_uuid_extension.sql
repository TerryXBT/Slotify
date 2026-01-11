-- Fix UUID extension issue
-- Run this in Supabase SQL Editor first

-- Drop and recreate the extension properly
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" SCHEMA public;

-- Verify it works
SELECT uuid_generate_v4();
