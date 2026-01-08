-- Create audit logs table for tracking all changes
-- This is critical for dispute resolution and compliance

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- What was changed
    entity_type TEXT NOT NULL CHECK (entity_type IN ('booking', 'service', 'profile', 'availability')),
    entity_id UUID NOT NULL,
    action TEXT NOT NULL CHECK (action IN ('create', 'update', 'delete', 'cancel', 'reschedule', 'confirm')),

    -- Who made the change
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    user_email TEXT, -- Store email for record even if user deleted

    -- What changed (JSON format for flexibility)
    changes JSONB, -- {old: {...}, new: {...}}
    metadata JSONB, -- Additional context (IP address, user agent, etc.)

    -- When
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for efficient querying
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Policies: Only service role can write, users can read their own
CREATE POLICY "audit_logs_service_role_insert"
ON audit_logs
FOR INSERT
TO service_role
WITH CHECK (true);

CREATE POLICY "audit_logs_user_read_own"
ON audit_logs
FOR SELECT
USING (user_id = auth.uid());

-- Providers can read audit logs for their bookings
CREATE POLICY "audit_logs_provider_read_bookings"
ON audit_logs
FOR SELECT
USING (
    entity_type = 'booking'
    AND entity_id IN (
        SELECT id FROM bookings WHERE provider_id = auth.uid()
    )
);

-- Add helpful comments
COMMENT ON TABLE audit_logs IS
'Audit trail for all important actions. Used for dispute resolution and compliance.
All writes should go through server-side functions with service role.';

COMMENT ON COLUMN audit_logs.changes IS
'JSONB storing before/after state: {old: {...}, new: {...}}';

COMMENT ON COLUMN audit_logs.metadata IS
'Additional context like IP address, user agent, or related entity IDs';
