-- Add description field to services table for detailed service information

ALTER TABLE services ADD COLUMN IF NOT EXISTS description text;
COMMENT ON COLUMN services.description IS 'Detailed description of the service shown on booking page';
