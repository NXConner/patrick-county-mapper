// Client-side export worker (dev/testing) controlled by VITE_ENABLE_EXPORT_WORKER
import ExportQueueService from './ExportQueueService';

let timer: number | null = null;

export function startExportWorker() {
  if (import.meta.env.VITE_ENABLE_EXPORT_WORKER !== 'true') return () => {};
  const tick = async () => {
    const jobs = await ExportQueueService.nextBatch(2);
    for (const job of jobs) {
      await ExportQueueService.update(job.id, { status: 'running' });
      try {
        // Simulate generation
        await new Promise(r => setTimeout(r, 1200));
        await ExportQueueService.update(job.id, { status: 'succeeded', result: { note: 'Simulated export' } });
      } catch (e: any) {
        const retries = (job.retries || 0) + 1;
        if (retries >= (job.max_retries || 3)) {
          await ExportQueueService.update(job.id, { status: 'failed', error: e?.message || 'Failed' });
        } else {
          await ExportQueueService.update(job.id, { status: 'queued', retries });
        }
      }
    }
  };
  timer = window.setInterval(tick, 4000);
  return () => { if (timer) window.clearInterval(timer); };
}

