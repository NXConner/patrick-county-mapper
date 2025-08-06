import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface MeasurementToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  currentMeasurement?: { distance?: number; area?: number };
  onLayerToggle?: (layerId: string) => void;
  layerStates?: { satellite: boolean; roads: boolean; labels: boolean; property: boolean };
}

const MeasurementToolbar: React.FC<MeasurementToolbarProps> = ({
  activeTool,
  onToolChange,
  currentMeasurement,
  onLayerToggle,
  layerStates
}) => {
  const tools = [
    {
      id: 'select',
      name: 'Select',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.121 2.122" />
        </svg>
      ),
      description: 'Select and move features'
    },
    {
      id: 'polygon',
      name: 'Area',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.176v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
        </svg>
      ),
      description: 'Measure area (driveways, parking lots)'
    },
    {
      id: 'line',
      name: 'Distance',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
        </svg>
      ),
      description: 'Measure distance and length'
    },
    {
      id: 'point',
      name: 'Point',
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      description: 'Add point markers'
    }
  ];

  // Dynamic layer controls based on current state
  const layerControls = [
    {
      id: 'satellite',
      name: 'Satellite',
      active: layerStates?.satellite ?? true,
      description: 'High-resolution satellite imagery'
    },
    {
      id: 'roads',
      name: 'Roads',
      active: layerStates?.roads ?? true,
      description: 'Street and road overlays'
    },
    {
      id: 'labels',
      name: 'Labels',
      active: layerStates?.labels ?? true,
      description: 'Place names and street labels'
    },
    {
      id: 'property',
      name: 'Property Lines',
      active: layerStates?.property ?? false,
      description: 'Property boundaries (coming soon)'
    }
  ];

  return (
    <Card className="absolute top-16 sm:top-4 left-4 z-50 bg-gis-toolbar/95 backdrop-blur-sm border-border/50 shadow-toolbar max-w-[280px] sm:max-w-[320px]">
      <div className="p-3 sm:p-4 space-y-3 sm:space-y-4">
        {/* Tools Section */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Measurement Tools</h3>
          <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "secondary"}
                size="sm"
                onClick={() => onToolChange(tool.id)}
                className="h-auto p-1.5 sm:p-2 flex flex-col items-center gap-1 transition-fast text-xs"
                title={tool.description}
              >
                {tool.icon}
                <span className="text-[10px] sm:text-xs">{tool.name}</span>
              </Button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Current Measurement Display */}
        {currentMeasurement && (
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-2">Current Measurement</h3>
            <div className="space-y-1">
              {currentMeasurement.area && (
                <Badge variant="secondary" className="w-full justify-between">
                  <span>Area:</span>
                  <span className="text-gis-success">{currentMeasurement.area.toFixed(2)} sq ft</span>
                </Badge>
              )}
              {currentMeasurement.distance && (
                <Badge variant="secondary" className="w-full justify-between">
                  <span>Distance:</span>
                  <span className="text-gis-measure">{currentMeasurement.distance.toFixed(2)} ft</span>
                </Badge>
              )}
            </div>
          </div>
        )}

        <Separator className="bg-border/50" />

        {/* Layer Controls */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Map Layers</h3>
          <div className="space-y-1">
            {layerControls.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onLayerToggle?.(layer.id)}
                disabled={layer.id === 'property'} // Disable property lines for now
                className="w-full flex items-center justify-between p-1 rounded hover:bg-muted/50 transition-fast disabled:opacity-50 disabled:cursor-not-allowed"
                title={layer.description}
              >
                <span className="text-xs text-muted-foreground">{layer.name}</span>
                <div className={`w-3 h-3 rounded-full ${layer.active ? 'bg-primary' : 'bg-muted'} transition-fast`} />
              </button>
            ))}
          </div>
        </div>

        <Separator className="bg-border/50" />

        {/* Location Info */}
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">Coverage Area</h3>
          <div className="text-xs text-muted-foreground space-y-1">
            <div><strong>Virginia Counties:</strong></div>
            <div>• Patrick County (Primary)</div>
            <div>• Carroll County</div>
            <div>• Floyd County</div>
            <div>• Franklin County</div>
            <div>• Henry County</div>
            <div><strong>North Carolina Counties:</strong></div>
            <div>• Stokes County</div>
            <div>• Surry County</div>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default MeasurementToolbar;