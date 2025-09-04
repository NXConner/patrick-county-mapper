import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

type ExportLog = {
  id: string;
  created_at: string;
  export_type: string;
  status: string;
  error?: string | null;
};

export const ExportHistoryDialog: React.FC<Props> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<ExportLog[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from('export_logs').select('id, created_at, export_type, status, error').order('created_at', { ascending: false }).limit(50);
      if (mounted) setLogs((data || []) as any);
    };
    load();
    const id = window.setInterval(load, 5000);
    return () => { mounted = false; window.clearInterval(id); };
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export History</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {logs.length === 0 ? (
            <div className="text-sm text-muted-foreground">No export logs yet.</div>
          ) : logs.map(l => (
            <div key={l.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{l.export_type.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm">Status: {l.status}</div>
              {l.error ? <div className="text-xs text-red-600">{l.error}</div> : null}
            </div>
          ))}
        </div>
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ExportHistoryDialog;

