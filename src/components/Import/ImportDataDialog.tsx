import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onGeoJson: (fc: GeoJSON.FeatureCollection) => void;
}

export const ImportDataDialog: React.FC<Props> = ({ isOpen, onClose, onGeoJson }) => {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      if (file.name.toLowerCase().endsWith('.geojson') || file.name.toLowerCase().endsWith('.json')) {
        const text = await file.text();
        const fc = JSON.parse(text) as GeoJSON.FeatureCollection;
        onGeoJson(fc);
        onClose();
      } else if (file.name.toLowerCase().endsWith('.zip')) {
        const { default: shp } = await import('shpjs');
        const buf = await file.arrayBuffer();
        const fc = await shp(buf) as GeoJSON.FeatureCollection;
        onGeoJson(fc);
        onClose();
      } else {
        setErr('Unsupported file type. Use .geojson/.json or zipped Shapefile (.zip).');
      }
    } catch (e: any) {
      setErr(e?.message || 'Failed to import file');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Import Data</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Upload a GeoJSON (.geojson/.json) or a zipped Shapefile (.zip)</div>
          <input type="file" accept=".geojson,.json,.zip" onChange={(e) => { const f = e.target.files?.[0]; if (f) void handleFile(f); }} />
          {err && <div className="text-xs text-red-600">{err}</div>}
          <div className="flex justify-end">
            <Button variant="secondary" onClick={onClose} disabled={busy}>Close</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImportDataDialog;

