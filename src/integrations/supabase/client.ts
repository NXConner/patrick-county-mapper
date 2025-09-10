import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const url = (import.meta as any).env?.VITE_SUPABASE_URL as string | undefined;
const anonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!url || !anonKey) {
	// eslint-disable-next-line no-console
	console.warn('Supabase env vars missing: set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient<Database>(url || '', anonKey || '', {
	auth: {
		storage: typeof window !== 'undefined' ? localStorage : undefined,
		persistSession: true,
		autoRefreshToken: true,
	}
});