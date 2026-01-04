-- Add phone column to profiles table
-- Run this in Supabase Studio SQL Editor (http://127.0.0.1:54323)

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone text;
