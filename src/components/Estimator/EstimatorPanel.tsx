import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CostCatalogService, type CostCatalog } from '@/services/CostCatalogService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  areaSqFt: number | null;
}

const FALLBACK_UNIT_COST = 4; // $/sqft default fallback

export const EstimatorPanel: React.FC<Props> = ({ isOpen, onClose, areaSqFt }) => {
  const [catalog, setCatalog] = useState<CostCatalog | null>(null);
  const [unitCost, setUnitCost] = useState<number>(FALLBACK_UNIT_COST);

  useEffect(() => {
    if (!isOpen) return;
    CostCatalogService.getDefault().then(async (cat) => {
      setCatalog(cat);
      if (cat) {
        const asphalt = cat.items.find(i => /asphalt/i.test(i.name) || /pave/i.test(i.name));
        if (asphalt) setUnitCost(Number(asphalt.unit_cost) || FALLBACK_UNIT_COST);
      } else {
        // Seed a tiny default if none exists
        try {
          const id = await CostCatalogService.createCatalog('Default', true);
          await CostCatalogService.addItem(id, { code: 'ASPHALT_STD', name: 'Asphalt Paving (standard)', unit: 'sqft', unit_cost: FALLBACK_UNIT_COST, material_type: 'asphalt', notes: 'Seeded default' });
          const seeded = await CostCatalogService.getCatalog(id);
          setCatalog(seeded);
        } catch {
          // ignore failures; fallback rate remains
        }
      }
    });
  }, [isOpen]);

  const total = useMemo(() => {
    if (!areaSqFt) return 0;
    return Math.round(areaSqFt * unitCost);
  }, [areaSqFt, unitCost]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Estimator</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Area (sq ft)</div>
          <div className="text-lg font-medium">{areaSqFt ? Math.round(areaSqFt).toLocaleString() : '—'}</div>
          <div className="text-sm text-muted-foreground">Unit cost ($/sq ft)</div>
          <Input type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value || 0))} />
          <div className="text-sm text-muted-foreground">Estimated total</div>
          <div className="text-2xl font-bold">${total.toLocaleString()}</div>
          {catalog ? <div className="text-xs text-muted-foreground">Using default catalog: {catalog.region}</div> : <div className="text-xs text-muted-foreground">Using fallback rate</div>}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EstimatorPanel;

