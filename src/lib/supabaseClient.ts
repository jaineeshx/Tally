import { createClient } from '@supabase/supabase-js';

// ⚠️ Never commit real values here.
// Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file
// (see .env.example) and in Vercel's environment variable settings.

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    '[Tally] Supabase env vars missing. Auth and sync features will be disabled. ' +
    'Core logging still works offline via localStorage.'
  );
}

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      })
    : null;

export const isSupabaseAvailable = () => supabase !== null;
