-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Profiles
create table profiles (
  id uuid references auth.users not null primary key,
  username text unique not null,
  full_name text,
  timezone text default 'Australia/Hobart',
  cancellation_policy_text text,
  created_at timestamptz default now()
);

-- 2. Services
create table services (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references profiles(id) not null,
  name text not null,
  duration_minutes int not null,
  price_cents int, -- saved for reference, no payment processing in P0
  is_active bool default true,
  created_at timestamptz default now()
);

-- 3. Availability Settings
create table availability_settings (
  provider_id uuid references profiles(id) primary key,
  min_notice_minutes int default 120,
  horizon_days int default 30,
  buffer_before_minutes int default 0,
  buffer_after_minutes int default 0
);

-- 4. Availability Rules (Weekly Template)
create table availability_rules (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references profiles(id) not null,
  day_of_week int not null, -- 0=Sun, 6=Sat
  start_time_local time not null,
  end_time_local time not null
);

-- 5. Busy Blocks
create table busy_blocks (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references profiles(id) not null,
  start_at timestamptz not null,
  end_at timestamptz not null,
  title text,
  repeat_type text, -- 'none' for P0
  created_at timestamptz default now()
);

-- 6. Bookings
create table bookings (
  id uuid primary key default uuid_generate_v4(),
  provider_id uuid references profiles(id) not null,
  service_id uuid references services(id) not null,
  client_name text not null,
  client_email text,
  client_phone text not null,
  notes text,
  start_at timestamptz not null,
  end_at timestamptz not null,
  status text not null check (status in ('confirmed', 'pending_reschedule', 'cancelled')),
  created_at timestamptz default now()
);

-- 7. Reschedule Proposals
create table reschedule_proposals (
  id uuid primary key default uuid_generate_v4(),
  booking_id uuid references bookings(id) not null,
  provider_id uuid references profiles(id) not null,
  token text unique not null,
  expires_at timestamptz not null,
  status text not null check (status in ('active', 'confirmed', 'expired', 'cancelled')),
  created_at timestamptz default now()
);

-- 8. Reschedule Options
create table reschedule_options (
  id uuid primary key default uuid_generate_v4(),
  proposal_id uuid references reschedule_proposals(id) not null,
  start_at timestamptz not null,
  end_at timestamptz not null
);

-- 9. Action Tokens (e.g., Cancel)
create table action_tokens (
  token text primary key,
  type text not null check (type in ('cancel')),
  booking_id uuid references bookings(id) not null,
  expires_at timestamptz not null,
  created_at timestamptz default now()
);

-- Indexes
create index idx_bookings_provider_start on bookings(provider_id, start_at);
create index idx_busy_blocks_provider_start on busy_blocks(provider_id, start_at);
create index idx_reschedule_proposals_token on reschedule_proposals(token);
create index idx_action_tokens_token on action_tokens(token);

-- RLS Policies
alter table profiles enable row level security;
alter table services enable row level security;
alter table availability_settings enable row level security;
alter table availability_rules enable row level security;
alter table busy_blocks enable row level security;
alter table bookings enable row level security;
alter table reschedule_proposals enable row level security;
alter table reschedule_options enable row level security;
-- action_tokens is likely server-side access mostly, but enable for consistency
alter table action_tokens enable row level security;

-- Profiles: Public read, owner write
create policy "Public profiles" on profiles for select using (true);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- Services: Public read, owner write
create policy "Public services" on services for select using (true);
create policy "Owner services" on services for all using (auth.uid() = provider_id);

-- Availability/Busy: Owner only (Public access via RPC/Server check generally, or public read availability rules? 
-- Actually availability logic is likely server-side or public read for rules? 
-- Prompt says: "Client booking page" -> "getAvailableSlots". 
-- If getAvailableSlots is an RPC or server-side function, we don't need public read on raw tables.
-- Let's keep them private to owner for now, except maybe rules if client calc is needed.
-- But Prompt Section 8 Says "server端写一个getAvailableSlots". So Client doesn't read tables directly.
create policy "Owner avail settings" on availability_settings for all using (auth.uid() = provider_id);
create policy "Owner avail rules" on availability_rules for all using (auth.uid() = provider_id);
create policy "Owner busy blocks" on busy_blocks for all using (auth.uid() = provider_id);

-- Bookings: Owner full access. Client NO ACCESS (use RPC).
create policy "Owner bookings" on bookings for all using (auth.uid() = provider_id);

-- Reschedule: Owner full access. Token-based access via RPC.
create policy "Owner reschedule proposals" on reschedule_proposals for all using (auth.uid() = provider_id);
-- Reschedule options are accessed through proposals, so we need to join
create policy "Owner reschedule options" on reschedule_options for all using (
  exists (
    select 1 from reschedule_proposals
    where reschedule_proposals.id = reschedule_options.proposal_id
    and reschedule_proposals.provider_id = auth.uid()
  )
);

-- RPC 1: Create Booking
create or replace function create_booking(
  p_provider_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text default null,
  p_notes text default null
) returns json
language plpgsql security definer
as $$
declare
  v_duration int;
  v_buffer_before int;
  v_buffer_after int;
  v_end_at timestamptz;
  v_total_start timestamptz;
  v_total_end timestamptz;
  v_booking_id uuid;
begin
  -- Get service duration
  select duration_minutes into v_duration from services where id = p_service_id;
  if not found then raise exception 'Service not found'; end if;

  -- Get buffers
  select coalesce(buffer_before_minutes, 0), coalesce(buffer_after_minutes, 0)
  into v_buffer_before, v_buffer_after
  from availability_settings where provider_id = p_provider_id;
  
  if not found then 
    v_buffer_before := 0; 
    v_buffer_after := 0; 
  end if;

  v_end_at := p_start_at + (v_duration || ' minutes')::interval;
  v_total_start := p_start_at - (v_buffer_before || ' minutes')::interval;
  v_total_end := v_end_at + (v_buffer_after || ' minutes')::interval;

  -- Check Busy Blocks
  if exists (
    select 1 from busy_blocks
    where provider_id = p_provider_id
      and start_at < v_total_end
      and end_at > v_total_start
  ) then
    raise exception 'Slot blocked by busy time';
  end if;

  -- Check Existing Bookings (considering THEIR buffers too? 
  -- Simplifying: Assume uniform buffers. 
  -- A booking occupies [b_start - buf_before, b_end + buf_after].
  -- Existing booking B overlaps if B_occupied overlaps New_occupied.
  -- B_occupied = [b.start - buf, b.end + buf].
  -- Overlap condition: MAX(start1, start2) < MIN(end1, end2).
  -- Here: MAX(v_total_start, b.start - buf) < MIN(v_total_end, b.end + buf).
  -- Note: We are using the CURRENT settings for existing bookings buffer approximations if not stored.
  -- Ideally booking stores its own buffer snapshot, but schema doesn't have it.
  -- We'll use current global buffer settings for existing bookings logic as P0 approximation.)
  
  if exists (
    select 1 from bookings
    where provider_id = p_provider_id
      and status != 'cancelled'
      and (start_at - (v_buffer_before || ' minutes')::interval) < v_total_end
      and (end_at + (v_buffer_after || ' minutes')::interval) > v_total_start
  ) then
    raise exception 'Slot blocked by existing booking';
  end if;

  -- Insert Booking
  insert into bookings (
    provider_id, service_id, client_name, client_email, client_phone, notes, start_at, end_at, status
  ) values (
    p_provider_id, p_service_id, p_client_name, p_client_email, p_client_phone, p_notes, p_start_at, v_end_at, 'confirmed'
  ) returning id into v_booking_id;

  return json_build_object('id', v_booking_id, 'status', 'confirmed');
end;
$$;

-- RPC 2: Confirm Reschedule
create or replace function confirm_reschedule(
  p_token text,
  p_option_id uuid
) returns json
language plpgsql security definer
as $$
declare
  v_proposal_id uuid;
  v_booking_id uuid;
  v_provider_id uuid;
  v_service_id uuid;
  v_new_start timestamptz;
  v_new_end timestamptz;
  v_buffer_before int;
  v_buffer_after int;
  v_total_start timestamptz;
  v_total_end timestamptz;
begin
  -- Validate Token
  select id, booking_id, provider_id into v_proposal_id, v_booking_id, v_provider_id
  from reschedule_proposals
  where token = p_token
    and status = 'active'
    and expires_at > now();
    
  if not found then raise exception 'Invalid or expired token'; end if;

  -- Get Option
  select start_at, end_at into v_new_start, v_new_end
  from reschedule_options
  where id = p_option_id and proposal_id = v_proposal_id;
  
  if not found then raise exception 'Invalid option'; end if;

  -- Get Buffers
  select coalesce(buffer_before_minutes, 0), coalesce(buffer_after_minutes, 0)
  into v_buffer_before, v_buffer_after
  from availability_settings where provider_id = v_provider_id;
  
  if not found then v_buffer_before := 0; v_buffer_after := 0; end if;

  v_total_start := v_new_start - (v_buffer_before || ' minutes')::interval;
  v_total_end := v_new_end + (v_buffer_after || ' minutes')::interval;

  -- Check Conflicts (logic repeat - ideally factor out but SQL function calls logic can be verbose)
  if exists (
    select 1 from busy_blocks
    where provider_id = v_provider_id
      and start_at < v_total_end
      and end_at > v_total_start
  ) then
    raise exception 'Target slot blocked by busy time';
  end if;

  if exists (
    select 1 from bookings
    where provider_id = v_provider_id
      and id != v_booking_id -- Exclude self!
      and status != 'cancelled'
      and (start_at - (v_buffer_before || ' minutes')::interval) < v_total_end
      and (end_at + (v_buffer_after || ' minutes')::interval) > v_total_start
  ) then
    raise exception 'Target slot blocked by existing booking';
  end if;

  -- Update Booking
  update bookings
  set start_at = v_new_start, end_at = v_new_end, status = 'confirmed'
  where id = v_booking_id;

  -- Update Proposal
  update reschedule_proposals
  set status = 'confirmed'
  where id = v_proposal_id;

  return json_build_object('success', true);
end;
$$;
