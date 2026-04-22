import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Client-safe: only anon key, data accessed by the authenticated user
// NEVER contains SERVICE_ROLE_KEY
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClient() {
  return createSupabaseClient(supabaseUrl, supabaseAnonKey);
}
