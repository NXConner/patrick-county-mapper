import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CostCatalogService, type CostCatalog, type CostItem } from '@/services/CostCatalogService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  catalogId: string | null;
}

export const EstimatorCatalogDialog: React.FC<Props> = ({ isOpen, onClose, catalogId }) => {
  const [catalog, setCatalog] = useState<CostCatalog | null>(null);
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('sqft');
  const [unitCost, setUnitCost] = useState<number>(4);

  useEffect(() => {
    if (!isOpen || !catalogId) { setCatalog(null); return; }
    CostCatalogService.getCatalog(catalogId).then(setCatalog);
  }, [isOpen, catalogId]);

  const addItem = async () => {
    if (!catalogId) return;
    await CostCatalogService.addItem(catalogId, { code, name, unit, unit_cost: unitCost } as any);
    const c = await CostCatalogService.getCatalog(catalogId);
    setCatalog(c);
    setCode(''); setName(''); setUnit('sqft'); setUnitCost(4);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Catalog Items</DialogTitle>
        </DialogHeader>
        {!catalog ? (
          <div className="text-sm text-muted-foreground">No catalog selected.</div>
        ) : (
          <div className="space-y-3">
            <div className="text-sm font-medium">{catalog.region} {catalog.is_default ? '(Default)' : ''}</div>
            <div className="space-y-2 max-h-[40vh] overflow-auto">
              {catalog.items.map((it: CostItem) => (
                <div key={it.id} className="flex items-center justify-between border rounded p-2 text-sm">
                  <div className="flex-1">
                    <div className="font-medium">{it.name}</div>
                    <div className="text-xs text-muted-foreground">{it.code} · {it.unit}</div>
                  </div>
                  <div>${Number(it.unit_cost).toLocaleString()}/{it.unit}</div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-4 gap-2 items-end">
              <Input placeholder="Code" value={code} onChange={(e) => setCode(e.target.value)} />
              <Input placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Unit" value={unit} onChange={(e) => setUnit(e.target.value)} />
              <Input placeholder="$/unit" type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value || 0))} />
              <div className="col-span-4 flex justify-end"><Button onClick={addItem}>Add Item</Button></div>
            </div>
          </div>
        )}
        <div className="flex justify-end"><Button variant="secondary" onClick={onClose}>Close</Button></div>
      </DialogContent>
    </Dialog>
  );
};

export default EstimatorCatalogDialog;

