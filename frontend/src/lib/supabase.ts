import { createClient } from '@supabase/supabase-js';

// Ensure we have the required environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Supabase Client] Missing Supabase environment variables. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file'
  );
}

// Create Supabase client with anon key for frontend use
// This client is safe to use in the browser
export const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        storageKey: 'cushion-supabase-auth',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;

// Helper function to check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Log Supabase configuration status (only in development)
if (process.env.NODE_ENV === 'development') {
  console.log('[Supabase Client] Configured:', isSupabaseConfigured());
}