-- Add sample availability rules for testing
-- This will add Monday-Friday 9am-5pm availability for your account

-- OR, if you want to add for ALL users:
INSERT INTO availability_rules (provider_id, day_of_week, start_time_local, end_time_local)
SELECT id, 1, '09:00:00'::time, '17:00:00'::time FROM profiles
UNION ALL
SELECT id, 2, '09:00:00'::time, '17:00:00'::time FROM profiles
UNION ALL
SELECT id, 3, '09:00:00'::time, '17:00:00'::time FROM profiles
UNION ALL
SELECT id, 4, '09:00:00'::time, '17:00:00'::time FROM profiles
UNION ALL
SELECT id, 5, '09:00:00'::time, '17:00:00'::time FROM profiles;

-- Day of week: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
