import 'server-only'

import { createClient } from '@supabase/supabase-js'

// Never borrow the visitor's session or a service-role client for public intake.
export function getPublicIntakeClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  if (!url || !key) throw new Error('Missing Supabase configuration')
  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  })
}
