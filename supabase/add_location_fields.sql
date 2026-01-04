-- Add location support to services table
-- Supports both physical locations and online meeting links

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS location_type text DEFAULT 'physical' CHECK (location_type IN ('physical', 'online'));

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS default_location text;

ALTER TABLE services 
ADD COLUMN IF NOT EXISTS location_details text;

-- Add optional location override to bookings
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS meeting_location text;

-- Add helpful comment
COMMENT ON COLUMN services.location_type IS 'Type of service: physical (in-person) or online (virtual)';
COMMENT ON COLUMN services.default_location IS 'For physical: venue/address. For online: meeting link template';
COMMENT ON COLUMN services.location_details IS 'Additional location instructions or details';
COMMENT ON COLUMN bookings.meeting_location IS 'Optional: override service location for this specific booking';
