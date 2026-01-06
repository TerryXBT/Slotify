-- Seed Data (Run this in Supabase SQL Editor)

-- 1. Create a Demo Provider (You can change the ID to your actual User ID if you have signed up)
-- We use a fixed UUID for testing public pages.
DO $$
DECLARE
  v_provider_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- First, create the auth user if it doesn't exist
  INSERT INTO auth.users (
    id,
    instance_id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    confirmation_token,
    raw_app_meta_data,
    raw_user_meta_data
  )
  VALUES (
    v_provider_id,
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'demo@example.com',
    crypt('demo123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '',
    '{"provider":"email","providers":["email"]}',
    '{"full_name":"Demo Professional"}'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Insert Profile
  INSERT INTO profiles (id, username, full_name, timezone)
  VALUES (v_provider_id, 'demo_pro', 'Demo Professional', 'Australia/Hobart')
  ON CONFLICT (id) DO NOTHING;

  -- Insert Services
  INSERT INTO services (provider_id, name, duration_minutes, price_cents)
  VALUES 
    (v_provider_id, 'Discovery Call', 30, 0),
    (v_provider_id, 'Deep Dive Session', 60, 10000)
  ON CONFLICT DO NOTHING;

  -- Insert Availability Settings
  INSERT INTO availability_settings (provider_id, min_notice_minutes, horizon_days, buffer_before_minutes, buffer_after_minutes)
  VALUES (v_provider_id, 120, 14, 0, 15)
  ON CONFLICT (provider_id) DO NOTHING;

  -- Insert Availability Rules (Mon-Fri, 9am - 5pm)
  INSERT INTO availability_rules (provider_id, day_of_week, start_time_local, end_time_local)
  VALUES
    (v_provider_id, 1, '09:00', '17:00'),
    (v_provider_id, 2, '09:00', '17:00'),
    (v_provider_id, 3, '09:00', '17:00'),
    (v_provider_id, 4, '09:00', '17:00'),
    (v_provider_id, 5, '09:00', '17:00');
    
END $$;
