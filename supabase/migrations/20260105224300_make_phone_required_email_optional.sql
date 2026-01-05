-- Make client_email optional and client_phone required
-- This migration swaps the requirement between email and phone

-- Step 1: First, update existing NULL phone numbers
-- Use email if available, otherwise use a placeholder
UPDATE bookings
SET client_phone = COALESCE(
    NULLIF(client_phone, ''),  -- Keep existing phone if not empty
    client_email,               -- Use email if phone is empty/null
    'Not provided'              -- Fallback placeholder
)
WHERE client_phone IS NULL OR client_phone = '';

-- Step 2: Now we can safely make changes
ALTER TABLE bookings
  ALTER COLUMN client_email DROP NOT NULL,
  ALTER COLUMN client_phone SET NOT NULL;
