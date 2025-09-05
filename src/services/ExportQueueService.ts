import { supabase } from '@/integrations/supabase/client';

export type ExportJob = {
  id: string;
  export_type: 'png' | 'pdf' | 'report';
  options: Record<string, unknown>;
  status: 'queued' | 'running' | 'succeeded' | 'failed';
  retries: number;
  max_retries: number;
  created_at: string;
};

export class ExportQueueService {
  static async enqueue(export_type: ExportJob['export_type'], options: Record<string, unknown>) {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('export_queue')
      .insert({ export_type, options, created_by: user?.id ?? null })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  static async nextBatch(limit = 3): Promise<ExportJob[]> {
    const { data } = await supabase.from('export_queue').select('*').eq('status', 'queued').limit(limit);
    return (data || []) as unknown as ExportJob[];
  }

  static async update(id: string, patch: Partial<ExportJob & { result?: any; error?: string }>) {
    await supabase.from('export_queue').update(patch as any).eq('id', id);
  }
}

export default ExportQueueService;

