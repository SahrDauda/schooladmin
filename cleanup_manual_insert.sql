-- =====================================================
-- CLEANUP SCRIPT
-- =====================================================
-- Run this to delete the manually created user so you can
-- try again using the "Add Admin" page.
-- =====================================================

DO $$
DECLARE
  target_email TEXT := 'emmanuelsahrdauda17@gmail.com';
  user_id UUID;
BEGIN
  -- Find the user ID
  SELECT id INTO user_id FROM auth.users WHERE email = target_email;

  IF user_id IS NOT NULL THEN
    -- Delete from schooladmin (should cascade, but being safe)
    DELETE FROM public.schooladmin WHERE id = user_id;
    
    -- Delete from auth.users (this cascades to many things)
    DELETE FROM auth.users WHERE id = user_id;
    
    RAISE NOTICE 'Deleted user %', target_email;
  ELSE
    RAISE NOTICE 'User % not found', target_email;
  END IF;
  
  -- Note: We are NOT deleting the school to avoid deleting other data
  -- if you want to delete the school too, you'd need to find it by name
  -- DELETE FROM public.schools WHERE name = 'Holy Family Senior Secondary Schools';
  
END $$;
