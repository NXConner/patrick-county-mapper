import { supabase } from '@/integrations/supabase/client';

export class ExportLogsService {
  static async log(type: string, options: Record<string, unknown>, status: 'queued' | 'completed' | 'failed' = 'completed', error?: string): Promise<void> {
    const user = (await supabase.auth.getUser()).data.user;
    try {
      const { error: err } = await supabase.from('export_logs').insert({ export_type: type, options, status, error, user_id: user?.id ?? null });
      if (err) throw err;
    } catch {
      // ignore; optionally enqueue offline
      const { OfflineQueueService } = await import('./OfflineQueueService');
      await OfflineQueueService.enqueue({ id: crypto.randomUUID(), type: 'ai_job_insert', payload: { export_type: type, options, status, error, user_id: user?.id ?? null }, createdAt: Date.now() });
    }
  }
}

export default ExportLogsService;

