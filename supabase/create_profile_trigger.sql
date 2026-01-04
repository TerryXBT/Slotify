-- Automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Create profile with username derived from email
  INSERT INTO public.profiles (id, username, full_name, timezone)
  VALUES (
    NEW.id,
    split_part(NEW.email, '@', 1), -- username from email part before @
    split_part(NEW.email, '@', 1), -- use same for full_name initially
    'Australia/Hobart' -- default timezone
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger that fires after a new user is inserted into auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
