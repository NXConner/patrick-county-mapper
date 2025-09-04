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
            <div key={j.id} className="flex items-center justify-between rounded border p-2">
              <div className="text-sm">
                <div className="font-medium">{j.status}</div>
                <div className="text-muted-foreground">{new Date(j.created_at).toLocaleString()}</div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => navigator.clipboard.writeText(j.id)}>Copy ID</Button>
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

