import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { 
  RulerIcon, 
  SquareIcon, 
  MousePointerIcon,
  InfoIcon,
  Eye,
  Zap,
  Menu,
  X
} from 'lucide-react';

interface MeasurementToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  currentMeasurement?: { distance?: number; area?: number };
  layerStates?: {
    satellite: boolean;
    roads: boolean;
    labels: boolean;
    property: boolean;
  };
  onLayerToggle?: (layerId: string) => void;
  onAsphaltDetection?: () => void;
  showAsphaltDetector?: boolean;
}

const MeasurementToolbar: React.FC<MeasurementToolbarProps> = ({
  activeTool,
  onToolChange,
  currentMeasurement,
  layerStates,
  onLayerToggle,
  onAsphaltDetection,
  showAsphaltDetector
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
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
      description: 'Building outlines and property boundaries'
    }
  ];

  // Toolbar content component to reuse in both mobile and desktop versions
  const ToolbarContent = () => (
    <div className="space-y-4">
      {/* Tools Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Measurement Tools</h3>
        <div className="grid grid-cols-2 gap-2">
          {tools.map((tool) => (
            <Button
              key={tool.id}
              variant={activeTool === tool.id ? "default" : "secondary"}
              size="sm"
              onClick={() => {
                onToolChange(tool.id);
                setIsMobileMenuOpen(false); // Close mobile menu on tool selection
              }}
              className="h-16 sm:h-auto p-2 flex flex-col items-center gap-1 transition-fast text-xs touch-manipulation"
              title={tool.description}
            >
              {tool.icon}
              <span className="text-xs">{tool.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Current Measurement Display */}
      {currentMeasurement && (
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-3">Current Measurement</h3>
          <div className="space-y-2">
            {currentMeasurement.area && (
              <Badge variant="secondary" className="w-full justify-between p-2">
                <span>Area:</span>
                <span className="text-gis-success font-medium">{currentMeasurement.area.toFixed(2)} sq ft</span>
              </Badge>
            )}
            {currentMeasurement.distance && (
              <Badge variant="secondary" className="w-full justify-between p-2">
                <span>Distance:</span>
                <span className="text-gis-measure font-medium">{currentMeasurement.distance.toFixed(2)} ft</span>
              </Badge>
            )}
          </div>
        </div>
      )}

      <Separator className="bg-border/50" />

      {/* Layer Controls */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Map Layers</h3>
        <div className="space-y-2">
          {layerControls.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerToggle?.(layer.id)}
              className="w-full flex items-center justify-between p-2 rounded hover:bg-muted/50 transition-fast touch-manipulation"
              title={layer.description}
            >
              <span className="text-sm text-muted-foreground">{layer.name}</span>
              <div className={`w-4 h-4 rounded-full ${layer.active ? 'bg-primary' : 'bg-muted'} transition-fast`} />
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* AI Tools Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">AI Analysis Tools</h3>
        <div className="space-y-2">
          <Button
            onClick={() => {
              onAsphaltDetection?.();
              setIsMobileMenuOpen(false); // Close mobile menu
            }}
            variant={showAsphaltDetector ? "default" : "outline"}
            size="sm"
            className="w-full justify-start h-12 touch-manipulation"
          >
            <Zap className="w-4 h-4 mr-2" />
            {showAsphaltDetector ? 'Hide AI Detection' : 'AI Asphalt Detection'}
          </Button>
          
          {showAsphaltDetector && (
            <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-950/20 p-3 rounded">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-3 h-3" />
                <span className="font-medium">Computer Vision Active</span>
              </div>
              <div>Click "Run AI Detection" to analyze satellite imagery for asphalt surfaces</div>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-border/50" />

      {/* Coverage Area */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3">Coverage Area</h3>
        <div className="text-xs text-muted-foreground space-y-1">
          <div><strong>Virginia Counties:</strong></div>
          <div>• Patrick County (Primary)</div>
          <div>• Carroll, Floyd, Franklin, Henry Counties</div>
          <div><strong>North Carolina Counties:</strong></div>
          <div>• Stokes & Surry Counties</div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile: Sheet/Drawer */}
      <div className="sm:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="fixed top-20 left-4 z-50 bg-gis-toolbar/95 backdrop-blur-sm shadow-toolbar h-12 w-12 p-0 touch-manipulation"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="bg-gis-toolbar/95 backdrop-blur-sm border-border/50 w-[300px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground">Tools & Layers</SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ToolbarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Card */}
      <div className="hidden sm:block">
        <Card className="absolute top-4 left-4 z-50 bg-gis-toolbar/95 backdrop-blur-sm border-border/50 shadow-toolbar max-w-[300px] lg:max-w-[320px]">
          <div className="p-4">
            <ToolbarContent />
          </div>
        </Card>
      </div>
    </>
  );
};
        

export default MeasurementToolbar;