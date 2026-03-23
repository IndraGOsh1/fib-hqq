import { createClient, SupabaseClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || ''
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const hasSupabase = Boolean(url && key)

export const supabase: SupabaseClient | null = hasSupabase
  ? createClient(url, key, { auth: { persistSession: false } })
  : null

if (!hasSupabase) {
  console.warn('[Supabase] No Supabase variables found. Using in-memory fallback data.')
} else {
  console.log('[Supabase] Client initialized.')
}
