import { createClient as createSupabaseClient } from '@supabase/supabase-js'

export async function createClient() {
  // Use service role key for server-side operations
  // This bypasses RLS for server components
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!, // Use service role key
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}