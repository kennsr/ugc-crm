import { createClient as createSupabaseClient } from '@supabase/supabase-js';

// Server-side only: uses SUPABASE_SERVICE_ROLE_KEY
// NEVER imported in client-side code (LoginClient, etc.)
export const supabaseAdmin = createSupabaseClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
