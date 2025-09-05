import React from 'react';

interface Props {
  zoning?: boolean;
  flood?: boolean;
  soils?: boolean;
}

export const OverlayLegend: React.FC<Props> = ({ zoning, flood, soils }) => {
  const items = [
    zoning ? { label: 'Zoning', color: '#f59e0b' } : null,
    flood ? { label: 'Flood', color: '#06b6d4' } : null,
    soils ? { label: 'Soils', color: '#65a30d' } : null,
  ].filter(Boolean) as { label: string; color: string }[];

  if (items.length === 0) return null;
  return (
    <div className="absolute bottom-4 right-4 z-40 bg-gis-panel/90 backdrop-blur-sm p-3 rounded shadow">
      <div className="text-xs font-semibold mb-2">Legend</div>
      <div className="space-y-1">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="inline-block w-3 h-3 rounded" style={{ background: it.color }} />
            <span>{it.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OverlayLegend;

