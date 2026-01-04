DO $$
DECLARE
  v_old_id uuid := '11111111-1111-1111-1111-111111111111';
  v_new_id uuid := 'b1af3414-b8ff-4f33-8309-bb6ddf3faf5e';
BEGIN
  -- 1. Create Profile for New User (copy details from old)
  INSERT INTO profiles (id, username, full_name, timezone)
  SELECT v_new_id, 'browser_pro', 'Browser Pro', timezone
  FROM profiles WHERE id = v_old_id
  ON CONFLICT (id) DO NOTHING;

  -- 2. Move Services
  UPDATE services SET provider_id = v_new_id WHERE provider_id = v_old_id;

  -- 3. Move Bookings
  UPDATE bookings SET provider_id = v_new_id WHERE provider_id = v_old_id;

  -- 4. Move Availability Settings
  -- Handle potential conflict if new user has settings (unlikely as profile not found)
  -- But update where old exists
  DELETE FROM availability_settings WHERE provider_id = v_new_id; -- Clear if any
  UPDATE availability_settings SET provider_id = v_new_id WHERE provider_id = v_old_id;

  -- 5. Move Availability Rules
  DELETE FROM availability_rules WHERE provider_id = v_new_id;
  UPDATE availability_rules SET provider_id = v_new_id WHERE provider_id = v_old_id;

  -- 6. Move Busy Blocks
  UPDATE busy_blocks SET provider_id = v_new_id WHERE provider_id = v_old_id;

END $$;
