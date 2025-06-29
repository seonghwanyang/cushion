import { createClient } from '@supabase/supabase-js';
import { config } from './index';

// Ensure we have the required environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.warn(
    '[Supabase Config] Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your .env.local file'
  );
}

// Create Supabase client with service role key for backend use
// This client has elevated privileges and should only be used server-side
export const supabase = supabaseUrl && supabaseServiceRoleKey
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false
      }
    })
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Log Supabase configuration status
console.log('[Supabase Config] Configured:', isSupabaseConfigured());