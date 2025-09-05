// Simple client-side worker to simulate AI job processing (dev/testing)
// Enabled when VITE_ENABLE_AI_WORKER=true

import { supabase } from '@/integrations/supabase/client';

let timer: number | null = null;

export function startAiWorker() {
  if (import.meta.env.VITE_ENABLE_AI_WORKER !== 'true') return () => {};
  const tick = async () => {
    const { data } = await supabase.from('ai_jobs').select('*').eq('status', 'queued').limit(3);
    for (const job of data || []) {
      await supabase.from('ai_jobs').update({ status: 'running' }).eq('id', job.id);
      // simulate work
      await new Promise(r => setTimeout(r, 1500));
      await supabase.from('ai_jobs').update({ status: 'succeeded', result: { note: 'Simulated result' } }).eq('id', job.id);
    }
  };
  timer = window.setInterval(tick, 3000);
  return () => { if (timer) window.clearInterval(timer); };
}

