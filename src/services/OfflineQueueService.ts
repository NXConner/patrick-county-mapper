import { idbGet, idbSet } from '@/lib/idbCache';

type OfflineTask = {
  id: string;
  type: 'ai_job_insert' | 'export_log_insert' | 'workspace_upsert';
  payload: Record<string, unknown>;
  createdAt: number;
};

const KEY = 'offline:queue';
const TTL = 1000 * 60 * 60 * 24 * 7;

async function loadQueue(): Promise<OfflineTask[]> {
  return (await idbGet<OfflineTask[]>(KEY)) || [];
}

async function saveQueue(q: OfflineTask[]): Promise<void> {
  await idbSet(KEY, q, TTL);
}

export class OfflineQueueService {
  static async enqueue(task: OfflineTask): Promise<void> {
    const q = await loadQueue();
    q.push(task);
    await saveQueue(q);
  }

  static async process(processors: {
    ai_job_insert: (payload: Record<string, unknown>) => Promise<void>;
    export_log_insert: (payload: Record<string, unknown>) => Promise<void>;
    workspace_upsert: (payload: Record<string, unknown>) => Promise<void>;
  }): Promise<void> {
    const q = await loadQueue();
    const remaining: OfflineTask[] = [];
    for (const t of q) {
      try {
        if (t.type === 'ai_job_insert') await processors.ai_job_insert(t.payload);
        else if (t.type === 'export_log_insert') await processors.export_log_insert(t.payload);
        else if (t.type === 'workspace_upsert') await processors.workspace_upsert(t.payload);
      } catch {
        remaining.push(t);
      }
    }
    await saveQueue(remaining);
  }

  static init(processors: {
    ai_job_insert: (payload: Record<string, unknown>) => Promise<void>;
  }) {
    const run = () => {
      this.process(processors).catch(() => {});
    };
    window.addEventListener('online', run);
    const id = window.setInterval(run, 15000);
    run();
    return () => {
      window.removeEventListener('online', run);
      window.clearInterval(id);
    };
  }
}

export default OfflineQueueService;

