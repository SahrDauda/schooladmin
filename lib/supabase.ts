import { createBrowserClient } from "@supabase/ssr"

// Cookie-based client — must match middleware session handling (@supabase/ssr).
// Using @supabase/supabase-js createClient (localStorage) causes sessions to
// desync and users get kicked back to login unexpectedly.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
