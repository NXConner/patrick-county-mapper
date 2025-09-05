import React, { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CostCatalogService, type CostCatalog } from '@/services/CostCatalogService';
import EstimatorCatalogDialog from './EstimatorCatalogDialog';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  areaSqFt: number | null;
  surfaces?: Array<{ type: string; area: number }>;
}

const FALLBACK_UNIT_COST = 4; // $/sqft default fallback

export const EstimatorPanel: React.FC<Props> = ({ isOpen, onClose, areaSqFt, surfaces }) => {
  const [catalog, setCatalog] = useState<CostCatalog | null>(null);
  const [catalogs, setCatalogs] = useState<CostCatalog[]>([]);
  const [template, setTemplate] = useState<'Driveway' | 'Parking Lot' | 'Custom'>('Custom');
  const [showCatalog, setShowCatalog] = useState(false);
  const [unitCost, setUnitCost] = useState<number>(FALLBACK_UNIT_COST);
  const [wastePct, setWastePct] = useState<number>(5);
  const [taxPct, setTaxPct] = useState<number>(0);
  const [fees, setFees] = useState<number>(0);
  const [items, setItems] = useState<Array<{ label: string; area: number; cost: number }>>([]);

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
    (async () => {
      // fetch a couple of catalogs if present (simple approach)
      const def = await CostCatalogService.getDefault();
      const list: CostCatalog[] = [];
      if (def) list.push(def);
      setCatalogs(list);
    })();
  }, [isOpen]);

  const subtotal = useMemo(() => {
    if (items.length > 0) return items.reduce((s, i) => s + i.cost, 0);
    if (!areaSqFt) return 0;
    return Math.round(areaSqFt * unitCost);
  }, [areaSqFt, unitCost, items]);

  const total = useMemo(() => {
    const withWaste = Math.round(subtotal * (1 + wastePct / 100));
    const taxed = Math.round(withWaste * (1 + taxPct / 100));
    return taxed + Math.round(fees);
  }, [subtotal, wastePct, taxPct, fees]);

  useEffect(() => {
    const base = (surfaces || []).map(s => ({ label: s.type, area: s.area, cost: Math.round(s.area * unitCost) }));
    if (base.length === 0 && areaSqFt) {
      base.push({ label: 'Asphalt', area: areaSqFt, cost: Math.round(areaSqFt * unitCost) });
    }
    setItems(base);
  }, [surfaces, areaSqFt, unitCost]);

  const exportEstimate = async (format: 'pdf' | 'json') => {
    const payload = {
      items,
      unitCost,
      wastePct,
      taxPct,
      fees,
      subtotal,
      total,
      generatedAt: new Date().toISOString()
    };
    if (format === 'json') {
      const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'estimate.json';
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const { jsPDF } = await import('jspdf');
      const pdf = new jsPDF();
      pdf.setFontSize(16);
      pdf.text('Estimate', 105, 15, { align: 'center' });
      pdf.setFontSize(11);
      pdf.text(`Generated: ${new Date().toLocaleString()}`, 15, 25);
      let y = 35;
      items.forEach((li) => {
        pdf.text(`${li.label}: ${Math.round(li.area).toLocaleString()} sq ft  $${li.cost.toLocaleString()}`, 15, y);
        y += 7;
      });
      y += 5;
      pdf.text(`Unit: $${unitCost}/sq ft`, 15, y); y += 7;
      pdf.text(`Waste: ${wastePct}%`, 15, y); y += 7;
      pdf.text(`Tax: ${taxPct}%`, 15, y); y += 7;
      pdf.text(`Fees: $${Math.round(fees).toLocaleString()}`, 15, y); y += 7;
      pdf.text(`Subtotal: $${subtotal.toLocaleString()}`, 15, y); y += 7;
      pdf.setFontSize(14);
      pdf.text(`Total: $${total.toLocaleString()}`, 15, y);
      pdf.save('estimate.pdf');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Estimator</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Template</div>
              <select className="border rounded px-2 py-1 w-full" value={template} onChange={(e) => setTemplate(e.target.value as any)}>
                <option value="Driveway">Driveway</option>
                <option value="Parking Lot">Parking Lot</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Catalog</div>
              <select className="border rounded px-2 py-1 w-full" value={catalog?.id || ''} onChange={async (e) => {
                // in this minimal version, keep only default
                const id = e.target.value;
                if (!id) return;
                const cat = await CostCatalogService.getCatalog(id);
                if (cat) setCatalog(cat);
              }}>
                {catalogs.map(c => (
                  <option key={c.id} value={c.id}>{c.region} {c.is_default ? '(Default)' : ''}</option>
                ))}
              </select>
              <div className="flex justify-end mt-2"><button className="text-xs underline" onClick={() => setShowCatalog(true)}>Manage items</button></div>
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Area (sq ft)</div>
          <div className="text-lg font-medium">{areaSqFt ? Math.round(areaSqFt).toLocaleString() : '—'}</div>
          <div className="text-sm text-muted-foreground">Unit cost ($/sq ft)</div>
          <Input type="number" value={unitCost} onChange={(e) => setUnitCost(Number(e.target.value || 0))} />
          <div className="grid grid-cols-3 gap-2">
            <div>
              <div className="text-sm text-muted-foreground">Waste %</div>
              <Input type="number" value={wastePct} onChange={(e) => setWastePct(Number(e.target.value || 0))} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Tax %</div>
              <Input type="number" value={taxPct} onChange={(e) => setTaxPct(Number(e.target.value || 0))} />
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Fees ($)</div>
              <Input type="number" value={fees} onChange={(e) => setFees(Number(e.target.value || 0))} />
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Estimated total</div>
          <div className="text-2xl font-bold">${total.toLocaleString()}</div>
          {catalog ? <div className="text-xs text-muted-foreground">Using default catalog: {catalog.region}</div> : <div className="text-xs text-muted-foreground">Using fallback rate</div>}
          <div className="pt-2">
            <div className="text-sm font-medium">Line items</div>
            <div className="space-y-2">
              {items.map((li, idx) => (
                <div key={idx} className="grid grid-cols-12 items-center gap-2 text-sm">
                  <Input className="col-span-5" value={li.label} onChange={(e) => {
                    const copy = [...items]; copy[idx] = { ...copy[idx], label: e.target.value }; setItems(copy);
                  }} />
                  <Input className="col-span-3" type="number" value={Math.round(li.area)} onChange={(e) => {
                    const v = Number(e.target.value || 0);
                    const copy = [...items]; copy[idx] = { ...copy[idx], area: v, cost: Math.round(v * unitCost) }; setItems(copy);
                  }} />
                  <div className="col-span-2 text-right text-muted-foreground">${li.cost.toLocaleString()}</div>
                  <Button className="col-span-2" variant="secondary" size="sm" onClick={() => { const copy = items.filter((_, i) => i !== idx); setItems(copy); }}>Remove</Button>
                </div>
              ))}
              <div>
                <Button variant="outline" size="sm" onClick={() => setItems([...items, { label: 'Custom', area: 0, cost: 0 }])}>Add item</Button>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 pt-2">
            <Button onClick={() => exportEstimate('pdf')}>Export PDF</Button>
            <Button variant="secondary" onClick={() => exportEstimate('json')}>Export JSON</Button>
          </div>
        </div>
        <EstimatorCatalogDialog isOpen={showCatalog} onClose={() => setShowCatalog(false)} catalogId={catalog?.id || null} />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="secondary" onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EstimatorPanel;

