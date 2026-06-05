-- =====================================================
-- SYNC ADMIN USERS & CREATE GOOGLE AUTH TRIGGER
-- =====================================================
-- Run this script in your Supabase SQL Editor to link
-- Google accounts and other logins to the schooladmin profiles automatically.
-- =====================================================

-- 1. Sync any existing schooladmin profiles that have matching emails in auth.users
-- but different IDs (e.g. if you logged in via Google first)
UPDATE public.schooladmin sa
SET id = u.id
FROM auth.users u
WHERE sa.email = u.email AND sa.id != u.id;

-- 2. Create a function to automatically sync future new logins (like Google OAuth)
CREATE OR REPLACE FUNCTION public.handle_new_user_sync_admin()
RETURNS TRIGGER AS $$
BEGIN
  -- If a schooladmin record exists with this email, update its ID to match the new auth.users ID
  IF EXISTS (SELECT 1 FROM public.schooladmin WHERE email = NEW.email) THEN
    UPDATE public.schooladmin
    SET id = NEW.id
    WHERE email = NEW.email;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create a trigger that runs whenever a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_sync_admin();

-- =====================================================
-- Sync completed & Auto-sync trigger active!
-- =====================================================
