import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Note: This client has admin privileges and requires SUPABASE_SERVICE_ROLE_KEY.
// We initialize it conditionally to prevent top-level module load crashes.
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
          autoRefreshToken: false,
          persistSession: false
      }
    })
  : null
