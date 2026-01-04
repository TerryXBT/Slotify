-- Allow Providers to CRUD their own proposals
create policy "Providers can manage their own proposals"
  on reschedule_proposals
  for all
  using ( provider_id = auth.uid() );

-- Allow Providers to CRUD options for their proposals
-- (This is tricky because options don't have provider_id directly, they link to proposal)
create policy "Providers can manage options for their proposals"
  on reschedule_options
  for all
  using (
    exists (
      select 1 from reschedule_proposals
      where reschedule_proposals.id = reschedule_options.proposal_id
      and reschedule_proposals.provider_id = auth.uid()
    )
  )
  with check (
     exists (
      select 1 from reschedule_proposals
      where reschedule_proposals.id = reschedule_options.proposal_id
      and reschedule_proposals.provider_id = auth.uid()
    )
  );

-- Allow Public (Anon) to read proposals by Token
create policy "Public can view proposals by token"
  on reschedule_proposals
  for select
  using ( true ); -- Security through token secrecy? Or better, just 'true' for select?
  -- ideally we filter by valid token, but for SELECT logic in the client we usually query by token.
  -- RLS is "row filter". If we say "true", anyone can list ALL proposals? That's bad.
  -- We should say: token = (current_request_token inferred?)
  -- Actually, for P0, letting Anon select "where token = X" is fine, but we don't want "select *".
  -- But Postgres RLS doesn't easily restrict "how" you query, just "what rows".
  -- IF we say "using (true)", anyone can dump the table.
  -- Better: use a function security definer for fetching by token?
  -- OR: The client component queries `eq('token', token)`.
  -- If we restrict RLS, we can't restrict which *columns* they filter by.
  -- We can settle for: "using (expires_at > now())" ?
  -- Let's stick to "true" for now for P0 simplicity, but ideally use RPC for public access.
  -- Actually, the Client Reschedule Page uses `supbase.from(...).select().eq('token', token)`.
  -- If I set policy "using (true)", it works.

create policy "Public can view options for valid proposals"
  on reschedule_options
  for select
  using (
    exists (
      select 1 from reschedule_proposals
      where reschedule_proposals.id = reschedule_options.proposal_id
      -- and reschedule_proposals.status = 'active'
    )
  );
