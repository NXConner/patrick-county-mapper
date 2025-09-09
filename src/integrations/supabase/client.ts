import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!SUPABASE_URL || !SUPABASE_PUBLISHABLE_KEY) {
  const missing = [
    !SUPABASE_URL ? 'VITE_SUPABASE_URL' : undefined,
    !SUPABASE_PUBLISHABLE_KEY ? 'VITE_SUPABASE_ANON_KEY' : undefined,
  ].filter(Boolean).join(', ');
  throw new Error(`Supabase configuration missing: ${missing}. Please set these in your .env file.`);
}

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		storage: typeof window !== 'undefined' ? localStorage : undefined,
		persistSession: true,
		autoRefreshToken: true,
	}
});