import React, { useEffect, useMemo, useState } from 'react';
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
  const [service, setService] = useState<'esri'|'osm'>('esri');

  const estimate = () => {
    const vp = getViewport();
    if (!vp) return 0;
    // Rough estimate based on viewport area vs world area at zoom
    const worldTiles = (z: number) => Math.pow(2, z) * Math.pow(2, z);
    const tilesAtZoom = worldTiles(vp.zoom);
    const factor = 0.0005; // viewport fraction
    return Math.round(tilesAtZoom * factor * Math.max(1, levels));
  };

  useEffect(() => { setCount(estimate()); }, [isOpen, levels]);

  const prefetch = async () => {
    const vp = getViewport();
    if (!vp) return;
    setRunning(true);
    try {
      const tileUrls: string[] = [];
      const toTile = (lat: number, lng: number, z: number) => {
        const x = Math.floor(((lng + 180) / 360) * Math.pow(2, z));
        const y = Math.floor(
          (
            (1 -
              Math.log(Math.tan((lat * Math.PI) / 180) + 1 / Math.cos((lat * Math.PI) / 180)) /
                Math.PI) /
            2
          ) * Math.pow(2, z)
        );
        return { x, y };
      };
      const bounds = vp;
      const centerLat = (bounds.north + bounds.south) / 2;
      const centerLng = (bounds.east + bounds.west) / 2;
      const baseZ = vp.zoom;
      const maxZ = baseZ + Math.max(0, Math.min(3, levels - 1));
      const providerUrl = service === 'esri'
        ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
        : 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
      const subs = service === 'osm' ? ['a', 'b', 'c'] : [''];
      for (let z = baseZ; z <= maxZ; z++) {
        const { x, y } = toTile(centerLat, centerLng, z);
        const radius = 1 + (z - baseZ);
        for (let dx = -radius; dx <= radius; dx++) {
          for (let dy = -radius; dy <= radius; dy++) {
            const u = providerUrl
              .replace('{z}', String(z))
              .replace('{x}', String(x + dx))
              .replace('{y}', String(y + dy))
              .replace('{s}', subs[(Math.abs(x + dx + y + dy) % subs.length)] || 'a');
            tileUrls.push(u);
          }
        }
      }
      // Limit concurrent fetches
      const limited = tileUrls.slice(0, Math.min(tileUrls.length, 500));
      const concurrency = 8;
      let index = 0;
      const run = async () => {
        while (index < limited.length) {
          const i = index++;
          try { await fetch(limited[i], { mode: 'no-cors', cache: 'reload' }); } catch {}
        }
      };
      await Promise.all(Array.from({ length: concurrency }).map(run));
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
          <div className="text-sm text-muted-foreground">Service</div>
          <select className="border rounded px-2 py-1" value={service} onChange={(e) => setService(e.target.value as any)}>
            <option value="esri">ESRI World Imagery</option>
            <option value="osm">OpenStreetMap</option>
          </select>
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

