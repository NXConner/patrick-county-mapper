import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AiJobsService, type AiJob } from '@/services/AiJobsService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export const AiJobsDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const [jobs, setJobs] = useState<AiJob[]>([]);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = () => {
      AiJobsService.listMy().then((j) => { if (mounted) setJobs(j); });
    };
    load();
    const id = window.setInterval(() => { setTick(t => t + 1); load(); }, 4000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>AI Jobs</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {jobs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No jobs yet.</div>
          ) : jobs.map(j => (
            <div key={j.id} className="rounded border p-2 space-y-1">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{j.status}</div>
                <div className="text-xs text-muted-foreground">{new Date(j.created_at).toLocaleString()}</div>
              </div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(j.id)}>Copy ID</Button>
                {(j.status === 'failed' || j.status === 'cancelled') && (
                  <Button size="sm" onClick={async () => { await AiJobsService.retry(j.id); }}>Retry</Button>
                )}
                {(j.status === 'queued' || j.status === 'running') && (
                  <Button size="sm" variant="destructive" onClick={async () => { await AiJobsService.cancel(j.id); }}>Cancel</Button>
                )}
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiJobsDialog;

