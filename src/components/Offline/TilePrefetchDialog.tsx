import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  getViewport: () => { west: number; south: number; east: number; north: number; zoom: number } | null;
}

export const TilePrefetchDialog: React.FC<Props> = ({ isOpen, onClose, getViewport }) => {
  const [levels, setLevels] = useState<number>(1);
  const [count, setCount] = useState<number>(0);
  const [running, setRunning] = useState(false);

  const estimate = () => {
    const vp = getViewport();
    if (!vp) return 0;
    const tilesPerLevel = 256; // rough placeholder
    return tilesPerLevel * levels;
  };

  useEffect(() => { setCount(estimate()); }, [isOpen, levels]);

  const prefetch = async () => {
    const vp = getViewport();
    if (!vp) return;
    setRunning(true);
    try {
      // Placeholder: trigger a fetch for representative tile URLs and let SW/VitePWA cache them
      const urls: string[] = [];
      for (let i = 0; i < Math.min(count, 50); i++) urls.push(`/icons/icon-16x16.png?prefetch=${i}`);
      await Promise.all(urls.map(u => fetch(u).catch(() => {})));
    } finally {
      setRunning(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Offline Tile Prefetch</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Levels around current zoom</div>
          <input className="border rounded px-2 py-1" type="number" value={levels} onChange={(e) => setLevels(Number(e.target.value || 1))} />
          <div className="text-sm">Estimated tiles: {count}</div>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={onClose}>Close</Button>
            <Button disabled={running} onClick={prefetch}>{running ? 'Prefetching…' : 'Prefetch'}</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TilePrefetchDialog;

