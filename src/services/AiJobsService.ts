import { supabase } from '@/integrations/supabase/client';

export interface AiJob {
  id: string;
  status: 'queued' | 'running' | 'succeeded' | 'failed' | 'cancelled';
  aoi: Record<string, unknown>;
  params: Record<string, unknown>;
  result?: Record<string, unknown> | null;
  error?: string | null;
  created_at: string;
}

export class AiJobsService {
  static async queue(aoi: Record<string, unknown>, params: Record<string, unknown> = {}): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    try {
      const { data, error } = await supabase
        .from('ai_jobs')
        .insert({ aoi, params, created_by: user?.id ?? null })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    } catch (e) {
      // Fallback to offline queue
      const { OfflineQueueService } = await import('./OfflineQueueService');
      await OfflineQueueService.enqueue({ id: crypto.randomUUID(), type: 'ai_job_insert', payload: { aoi, params, created_by: user?.id ?? null }, createdAt: Date.now() });
      return 'offline-queued';
    }
  }

  static async get(id: string): Promise<AiJob | null> {
    const { data, error } = await supabase.from('ai_jobs').select('*').eq('id', id).single();
    if (error) return null;
    return data as unknown as AiJob;
  }

  static async listMy(): Promise<AiJob[]> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];
    const { data } = await supabase
      .from('ai_jobs')
      .select('*')
      .eq('created_by', user.id)
      .order('created_at', { ascending: false });
    return (data || []) as unknown as AiJob[];
  }

  static async retry(id: string): Promise<void> {
    const { data } = await supabase.from('ai_jobs').select('retries, max_retries').eq('id', id).single();
    const retries = ((data as any)?.retries || 0) + 1;
    const max = (data as any)?.max_retries || 3;
    if (retries > max) throw new Error('Max retries reached');
    await supabase.from('ai_jobs').update({ status: 'queued', retries }).eq('id', id);
  }

  static async cancel(id: string): Promise<void> {
    await supabase.from('ai_jobs').update({ status: 'cancelled' }).eq('id', id);
  }
}

export default AiJobsService;

