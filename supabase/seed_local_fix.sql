-- Seed Data with Auth User Creation (For Local Dev)

DO $$
DECLARE
  v_provider_id uuid := '11111111-1111-1111-1111-111111111111';
BEGIN
  -- 0. Insert into auth.users (REQUIRED for foreign key)
  INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
  VALUES (
    v_provider_id,
    'demo@slotify.app',
    '$2a$10$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMN0PQRSTUVWXYZ', -- Dummy hash
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(),
    now()
  )
  ON CONFLICT (id) DO NOTHING;

  -- 1. Insert Profile
  INSERT INTO profiles (id, username, full_name, timezone)
  VALUES (v_provider_id, 'demo_pro', 'Demo Professional', 'Australia/Hobart')
  ON CONFLICT (id) DO NOTHING;

  -- 2. Insert Services
  INSERT INTO services (provider_id, name, duration_minutes, price_cents)
  VALUES 
    (v_provider_id, 'Discovery Call', 30, 0),
    (v_provider_id, 'Deep Dive Session', 60, 10000)
  ON CONFLICT DO NOTHING;

  -- 3. Insert Availability Settings
  INSERT INTO availability_settings (provider_id, min_notice_minutes, horizon_days, buffer_before_minutes, buffer_after_minutes)
  VALUES (v_provider_id, 120, 14, 0, 15)
  ON CONFLICT (provider_id) DO NOTHING;

  -- 4. Insert Availability Rules (Mon-Fri, 9am - 5pm)
  INSERT INTO availability_rules (provider_id, day_of_week, start_time_local, end_time_local)
  VALUES
    (v_provider_id, 1, '09:00', '17:00'),
    (v_provider_id, 2, '09:00', '17:00'),
    (v_provider_id, 3, '09:00', '17:00'),
    (v_provider_id, 4, '09:00', '17:00'),
    (v_provider_id, 5, '09:00', '17:00');

     -- 5. Insert ONE Dummy Booking for "Today" (to test Dashboard)
    INSERT INTO bookings (provider_id, service_id, client_name, client_email, start_at, end_at, status, notes)
    SELECT 
        v_provider_id, 
        (SELECT id FROM services WHERE name = 'Discovery Call' LIMIT 1),
        'Alex Client', 
        'alex@example.com',
        (CURRENT_DATE + TIME '10:00:00')::timestamptz,
        (CURRENT_DATE + TIME '10:30:00')::timestamptz,
        'confirmed',
        'Looking forward to it!'
    WHERE NOT EXISTS (SELECT 1 FROM bookings WHERE client_email = 'alex@example.com');
    
END $$;
