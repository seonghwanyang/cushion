import { createClient } from '@supabase/supabase-js';
import { config } from '@/config';

const supabaseUrl = config.supabase.url;
const supabaseServiceKey = config.supabase.serviceRoleKey;

// Only create client if both environment variables are present
export const supabaseAdmin = supabaseUrl && supabaseServiceKey
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )
  : null;

// Log warning if Supabase is not configured
if (!supabaseAdmin && config.features.useSupabaseAuth) {
  console.warn('[Supabase Admin] Missing environment variables but USE_SUPABASE_AUTH is true. Supabase features will not work.');
} else if (supabaseAdmin && config.features.useSupabaseAuth) {
  console.log('[Supabase Admin] Initialized successfully');
}