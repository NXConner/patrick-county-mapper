import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  getViewport: () => { west: number; south: number; east: number; north: number } | null;
}

export const BatchAoiTool: React.FC<Props> = ({ isOpen, onClose, getViewport }) => {
  const [detail, setDetail] = useState<'standard' | 'high'>('standard');
  const [types, setTypes] = useState<{ asphalt: boolean; roofs: boolean }>({ asphalt: true, roofs: false });
  const [pending, setPending] = useState(false);

  const queue = async () => {
    const vp = getViewport();
    if (!vp) return;
    setPending(true);
    try {
      const aoi = { bbox: [vp.west, vp.south, vp.east, vp.north] };
      const params = { detail, surfaces: Object.entries(types).filter(([, v]) => v).map(([k]) => k) };
      const { AiJobsService } = await import('@/services/AiJobsService');
      await AiJobsService.queue(aoi, params);
      onClose();
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Batch AOI Analysis</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <div className="text-sm text-muted-foreground">Detail</div>
            <select className="border rounded px-2 py-1 w-full" value={detail} onChange={(e) => setDetail(e.target.value as any)}>
              <option value="standard">Standard</option>
              <option value="high">High</option>
            </select>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Surfaces</div>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={types.asphalt} onChange={(e) => setTypes({ ...types, asphalt: e.target.checked })} /> Asphalt</label>
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={types.roofs} onChange={(e) => setTypes({ ...types, roofs: e.target.checked })} /> Roofs</label>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button onClick={queue} disabled={pending}>{pending ? 'Queuing…' : 'Queue'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BatchAoiTool;

