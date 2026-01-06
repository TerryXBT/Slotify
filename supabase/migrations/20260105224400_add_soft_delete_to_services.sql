-- Add soft delete support to services table

-- 1. Add deleted_at column for soft delete
ALTER TABLE services ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create index for efficient filtering of deleted items
CREATE INDEX IF NOT EXISTS idx_services_deleted ON services(deleted_at) WHERE deleted_at IS NOT NULL;

-- 3. Add comment for documentation
COMMENT ON COLUMN services.deleted_at IS 'Timestamp when the service was soft-deleted. NULL means active.';
