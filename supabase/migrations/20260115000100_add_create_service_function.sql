-- Create a function to insert services with all fields
-- This bypasses PostgREST schema cache issues

CREATE OR REPLACE FUNCTION create_service_with_settings(
    p_provider_id uuid,
    p_name text,
    p_description text,
    p_duration_minutes int,
    p_price_cents int,
    p_price_negotiable boolean,
    p_location_type text,
    p_default_location text,
    p_buffer_minutes int,
    p_cancellation_policy text
) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_service_id uuid;
BEGIN
    INSERT INTO services (
        provider_id, name, description, duration_minutes, price_cents,
        price_negotiable, location_type, default_location, buffer_minutes, cancellation_policy
    ) VALUES (
        p_provider_id, p_name, p_description, p_duration_minutes, p_price_cents,
        p_price_negotiable, p_location_type, p_default_location, p_buffer_minutes, p_cancellation_policy
    ) RETURNING id INTO v_service_id;

    RETURN v_service_id;
END;
$$;

-- Create a function to update services with all fields
CREATE OR REPLACE FUNCTION update_service_with_settings(
    p_service_id uuid,
    p_provider_id uuid,
    p_name text,
    p_description text,
    p_duration_minutes int,
    p_price_cents int,
    p_price_negotiable boolean,
    p_location_type text,
    p_default_location text,
    p_is_active boolean,
    p_buffer_minutes int,
    p_cancellation_policy text
) RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE services SET
        name = p_name,
        description = p_description,
        duration_minutes = p_duration_minutes,
        price_cents = p_price_cents,
        price_negotiable = p_price_negotiable,
        location_type = p_location_type,
        default_location = p_default_location,
        is_active = p_is_active,
        buffer_minutes = p_buffer_minutes,
        cancellation_policy = p_cancellation_policy
    WHERE id = p_service_id AND provider_id = p_provider_id;

    RETURN FOUND;
END;
$$;
