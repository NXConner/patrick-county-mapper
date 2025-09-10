import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = 'https://vodglzbgqsafghlihivy.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZvZGdsemJncXNhZmdobGloaXZ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDkzNDcwMDQsImV4cCI6MjA2NDkyMzAwNH0.uLAZ_zY3zY-QmDDXwkAuspCUW9NpotsTV5fVCiHf5mM';

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
	auth: {
		storage: typeof window !== 'undefined' ? localStorage : undefined,
		persistSession: true,
		autoRefreshToken: true,
	}
});