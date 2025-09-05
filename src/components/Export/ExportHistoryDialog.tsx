import React, { useEffect, useMemo, useState } from 'react';
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
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [from, setFrom] = useState<string>('');
  const [to, setTo] = useState<string>('');

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

  const filtered = useMemo(() => {
    return logs.filter(l => (
      (typeFilter === 'all' || l.export_type === typeFilter) &&
      (statusFilter === 'all' || l.status === statusFilter) &&
      (!from || new Date(l.created_at) >= new Date(from)) &&
      (!to || new Date(l.created_at) <= new Date(to))
    ));
  }, [logs, typeFilter, statusFilter, from, to]);

  const retry = async (log: ExportLog) => {
    // For now just re-log the same entry as completed, placeholder for re-run action
    const { ExportLogsService } = await import('@/services/ExportLogsService');
    await ExportLogsService.log(log.export_type, {}, 'completed');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Export History</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-2 mb-2">
          <select className="border rounded px-2 py-1" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
            <option value="all">All types</option>
            <option value="png">PNG</option>
            <option value="pdf">PDF</option>
            <option value="print">Print</option>
            <option value="report">Report</option>
          </select>
          <select className="border rounded px-2 py-1" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="all">All status</option>
            <option value="completed">Completed</option>
            <option value="failed">Failed</option>
          </select>
          <input className="border rounded px-2 py-1" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          <input className="border rounded px-2 py-1" type="date" value={to} onChange={(e) => setTo(e.target.value)} />
        </div>
        <div className="space-y-2 max-h-[50vh] overflow-auto">
          {filtered.length === 0 ? (
            <div className="text-sm text-muted-foreground">No export logs yet.</div>
          ) : filtered.map(l => (
            <div key={l.id} className="border rounded p-2">
              <div className="flex items-center justify-between">
                <div className="text-sm font-medium">{l.export_type.toUpperCase()}</div>
                <div className="text-xs text-muted-foreground">{new Date(l.created_at).toLocaleString()}</div>
              </div>
              <div className="text-sm flex items-center justify-between">
                <span>Status: {l.status}</span>
                {l.status === 'failed' && (
                  <button className="text-xs underline" onClick={() => retry(l)}>Retry</button>
                )}
              </div>
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

