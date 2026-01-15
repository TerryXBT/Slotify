-- Add new fields to services table for per-service booking settings
-- These allow service-level customization while inheriting from global defaults

-- Add price_negotiable flag (when true, price is hidden and shown as "Price negotiable")
ALTER TABLE services ADD COLUMN IF NOT EXISTS price_negotiable boolean DEFAULT false;

-- Add buffer_minutes for per-service buffer time (overrides global setting if set)
ALTER TABLE services ADD COLUMN IF NOT EXISTS buffer_minutes int DEFAULT NULL;

-- Add cancellation_policy for per-service cancellation policy (overrides global setting if set)
-- Values: '24h', '48h', 'no_cancel', or custom text
ALTER TABLE services ADD COLUMN IF NOT EXISTS cancellation_policy text DEFAULT NULL;

-- Add default_buffer_minutes to availability_settings for global default
ALTER TABLE availability_settings ADD COLUMN IF NOT EXISTS default_buffer_minutes int DEFAULT 0;

-- Add default_cancellation_policy to availability_settings for global default
ALTER TABLE availability_settings ADD COLUMN IF NOT EXISTS default_cancellation_policy text DEFAULT '24h';

-- Comments for documentation
COMMENT ON COLUMN services.price_negotiable IS 'When true, price is hidden and shown as "Price negotiable"';
COMMENT ON COLUMN services.buffer_minutes IS 'Buffer time in minutes after this service. NULL means use global default.';
COMMENT ON COLUMN services.cancellation_policy IS 'Cancellation policy for this service. NULL means use global default. Values: 24h, 48h, no_cancel, or custom text.';
COMMENT ON COLUMN availability_settings.default_buffer_minutes IS 'Default buffer time in minutes applied to new services';
COMMENT ON COLUMN availability_settings.default_cancellation_policy IS 'Default cancellation policy for new services. Values: 24h, 48h, no_cancel, or custom text.';
