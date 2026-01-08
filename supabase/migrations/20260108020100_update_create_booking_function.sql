-- Update create_booking function to require both email and phone
-- Remove default null from phone parameter to make it required

-- Drop the existing function first (PostgreSQL doesn't allow removing defaults with CREATE OR REPLACE)
DROP FUNCTION IF EXISTS create_booking(uuid, uuid, timestamptz, text, text, text, text);

CREATE FUNCTION create_booking(
  p_provider_id uuid,
  p_service_id uuid,
  p_start_at timestamptz,
  p_client_name text,
  p_client_email text,
  p_client_phone text,  -- Removed "default null" to make it required
  p_notes text default null
) RETURNS json
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_duration int;
  v_buffer_before int;
  v_buffer_after int;
  v_end_at timestamptz;
  v_total_start timestamptz;
  v_total_end timestamptz;
  v_booking_id uuid;
BEGIN
  -- Get service duration
  SELECT duration_minutes INTO v_duration FROM services WHERE id = p_service_id;
  IF NOT FOUND THEN RAISE EXCEPTION 'Service not found'; END IF;

  -- Get buffers
  SELECT COALESCE(buffer_before_minutes, 0), COALESCE(buffer_after_minutes, 0)
  INTO v_buffer_before, v_buffer_after
  FROM availability_settings WHERE provider_id = p_provider_id;

  IF NOT FOUND THEN
    v_buffer_before := 0;
    v_buffer_after := 0;
  END IF;

  v_end_at := p_start_at + (v_duration || ' minutes')::interval;
  v_total_start := p_start_at - (v_buffer_before || ' minutes')::interval;
  v_total_end := v_end_at + (v_buffer_after || ' minutes')::interval;

  -- Check Busy Blocks
  IF EXISTS (
    SELECT 1 FROM busy_blocks
    WHERE provider_id = p_provider_id
      AND start_at < v_total_end
      AND end_at > v_total_start
  ) THEN
    RAISE EXCEPTION 'Slot blocked by busy time';
  END IF;

  -- Check Existing Bookings
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE provider_id = p_provider_id
      AND status != 'cancelled'
      AND (start_at - (v_buffer_before || ' minutes')::interval) < v_total_end
      AND (end_at + (v_buffer_after || ' minutes')::interval) > v_total_start
  ) THEN
    RAISE EXCEPTION 'Slot blocked by existing booking';
  END IF;

  -- Insert Booking
  INSERT INTO bookings (
    provider_id, service_id, client_name, client_email, client_phone, notes, start_at, end_at, status
  ) VALUES (
    p_provider_id, p_service_id, p_client_name, p_client_email, p_client_phone, p_notes, p_start_at, v_end_at, 'confirmed'
  ) RETURNING id INTO v_booking_id;

  RETURN json_build_object('id', v_booking_id, 'status', 'confirmed');
END;
$$;
