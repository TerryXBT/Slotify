-- Add RLS policies for action_tokens table
-- This table should only be accessible by the backend (service role)
-- Public users should never directly query this table

-- Drop existing policies if any
DROP POLICY IF EXISTS "action_tokens_service_role_only" ON action_tokens;

-- Create a policy that blocks all access except service role
-- Service role bypasses RLS, so this effectively locks out all other access
CREATE POLICY "action_tokens_service_role_only"
ON action_tokens
FOR ALL
USING (false);

-- Add comment explaining the security model
COMMENT ON TABLE action_tokens IS
'Security-critical table for cancellation and reschedule tokens.
Access restricted to service role only via RLS policy.
All operations must go through server-side RPCs or server actions.';
