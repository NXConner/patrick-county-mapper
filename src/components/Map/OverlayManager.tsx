import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Layers, 
  Eye, 
  EyeOff 
} from 'lucide-react';
import L from 'leaflet';

interface OverlayManagerProps {
  map: L.Map | null;
  layerStates: Record<string, boolean>;
  onLayerToggle: (layerId: string) => void;
}

const OverlayManager: React.FC<OverlayManagerProps> = ({
  map,
  layerStates,
  onLayerToggle
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const layers = [
    { id: 'satellite', name: 'Satellite', icon: '🛰️' },
    { id: 'roads', name: 'Roads', icon: '🛣️' },
    { id: 'labels', name: 'Labels', icon: '🏷️' },
    { id: 'property', name: 'Property Lines', icon: '📐' },
    { id: 'parcels', name: 'County Parcels', icon: '🧭' }
  ];

  return (
    <Card className="fixed top-4 left-4 z-40 w-64 p-3 shadow-xl">
      <div className="space-y-3">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <span className="font-medium">Map Layers</span>
          </div>
          <Button variant="ghost" size="sm">
            {isExpanded ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>

        {isExpanded && (
          <div className="space-y-2">
            {layers.map((layer) => (
              <div 
                key={layer.id}
                className="flex items-center justify-between p-2 hover:bg-muted rounded-lg cursor-pointer"
                onClick={() => onLayerToggle(layer.id)}
              >
                <div className="flex items-center gap-2">
                  <span>{layer.icon}</span>
                  <span className="text-sm">{layer.name}</span>
                </div>
                <div className={`w-4 h-4 rounded border-2 ${
                  layerStates[layer.id] 
                    ? 'bg-primary border-primary' 
                    : 'border-muted-foreground'
                }`}>
                  {layerStates[layer.id] && (
                    <Eye className="w-3 h-3 text-primary-foreground" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default OverlayManager;