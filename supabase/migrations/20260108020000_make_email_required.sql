-- Make client_email required for bookings
-- Since email is essential for booking confirmations and reschedule notifications

-- First, update any existing bookings with empty emails to have a placeholder
-- This ensures the NOT NULL constraint won't fail
UPDATE bookings
SET client_email = 'noemail@placeholder.local'
WHERE client_email IS NULL OR client_email = '';

-- Now make the column required
ALTER TABLE bookings
ALTER COLUMN client_email SET NOT NULL;

-- Add a check constraint to ensure email is not empty
ALTER TABLE bookings
ADD CONSTRAINT client_email_not_empty
CHECK (client_email != '' AND client_email IS NOT NULL);
