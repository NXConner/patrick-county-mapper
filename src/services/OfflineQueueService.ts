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

  private static getDefaultHandlers() {
    return {
      ai_job_insert: async (payload: Record<string, unknown>) => {
        const { AiJobsService } = await import('./AiJobsService');
        await AiJobsService.queue(
          (payload as any).aoi as Record<string, unknown>,
          (payload as any).params as Record<string, unknown>
        );
      },
      export_log_insert: async (payload: Record<string, unknown>) => {
        const { ExportLogsService } = await import('./ExportLogsService');
        await ExportLogsService.log(
          (payload as any).export_type as string,
          (payload as any).options as Record<string, unknown>,
          (payload as any).status as any,
          (payload as any).error as string | undefined
        );
      },
      workspace_upsert: async (payload: Record<string, unknown>) => {
        const { WorkspaceService } = await import('./WorkspaceService');
        await WorkspaceService.upsert(
          (payload as any).name as string,
          (payload as any).payload as Record<string, unknown>
        );
      },
    } as const;
  }

  static async processAll(): Promise<void> {
    const handlers = this.getDefaultHandlers();
    const q = await loadQueue();
    const remaining: OfflineTask[] = [];
    for (const t of q) {
      try {
        if (t.type === 'ai_job_insert') await handlers.ai_job_insert(t.payload);
        else if (t.type === 'export_log_insert') await handlers.export_log_insert(t.payload);
        else if (t.type === 'workspace_upsert') await handlers.workspace_upsert(t.payload);
      } catch {
        remaining.push(t);
      }
    }
    await saveQueue(remaining);
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

  static init() {
    const run = () => {
      this.processAll().catch(() => {});
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

