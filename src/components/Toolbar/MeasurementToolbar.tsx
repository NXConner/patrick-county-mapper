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
  const [isDesktopToolbarOpen, setIsDesktopToolbarOpen] = useState(true);
  
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
    <div className="space-y-4 animate-[slide-up_0.3s_ease-out]">
      {/* Tools Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-primary rounded-full pulse-glow"></div>
          Measurement Tools
        </h3>
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
              className={`h-16 sm:h-auto p-2 flex flex-col items-center gap-1 transition-all duration-300 text-xs touch-manipulation interactive-hover ${
                activeTool === tool.id ? 'glow-effect scale-105' : ''
              }`}
              title={tool.description}
            >
              {tool.icon}
              <span className="text-xs">{tool.name}</span>
            </Button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50 shimmer-effect" />

      {/* Current Measurement Display */}
      {currentMeasurement && (
        <div className="animate-[scale-in_0.4s_ease-out]">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <div className="w-2 h-2 bg-gis-measure rounded-full pulse-glow"></div>
            Current Measurement
          </h3>
          <div className="space-y-2">
            {currentMeasurement.area && (
              <Badge variant="secondary" className="w-full justify-between p-3 interactive-hover bg-gradient-to-r from-gis-success/20 to-gis-success/10 border-gis-success/30">
                <span>Area:</span>
                <span className="text-gis-success font-medium glow-effect">{currentMeasurement.area.toFixed(2)} sq ft</span>
              </Badge>
            )}
            {currentMeasurement.distance && (
              <Badge variant="secondary" className="w-full justify-between p-3 interactive-hover bg-gradient-to-r from-gis-measure/20 to-gis-measure/10 border-gis-measure/30">
                <span>Distance:</span>
                <span className="text-gis-measure font-medium glow-effect">{currentMeasurement.distance.toFixed(2)} ft</span>
              </Badge>
            )}
          </div>
        </div>
      )}

      <Separator className="bg-border/50 shimmer-effect" />

      {/* Layer Controls */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-info rounded-full pulse-glow"></div>
          Map Layers
        </h3>
        <div className="space-y-2">
          {layerControls.map((layer) => (
            <button
              key={layer.id}
              onClick={() => onLayerToggle?.(layer.id)}
              className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-300 touch-manipulation interactive-hover glass-effect border border-border/30"
              title={layer.description}
            >
              <span className="text-sm text-muted-foreground font-medium">{layer.name}</span>
              <div className={`w-5 h-5 rounded-full transition-all duration-300 ${
                layer.active 
                  ? 'bg-gradient-to-r from-primary to-accent glow-effect scale-110' 
                  : 'bg-muted border-2 border-border'
              }`} />
            </button>
          ))}
        </div>
      </div>

      <Separator className="bg-border/50 shimmer-effect" />

      {/* AI Tools Section */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-draw rounded-full pulse-glow"></div>
          AI Analysis Tools
        </h3>
        <div className="space-y-2">
          <Button
            onClick={() => {
              onAsphaltDetection?.();
              setIsMobileMenuOpen(false); // Close mobile menu
            }}
            variant={showAsphaltDetector ? "default" : "outline"}
            size="sm"
            className={`w-full justify-start h-12 touch-manipulation transition-all duration-300 interactive-hover ${
              showAsphaltDetector ? 'glow-effect bg-gradient-to-r from-gis-draw to-gis-info' : ''
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {showAsphaltDetector ? 'Hide AI Detection' : 'AI Asphalt Detection'}
          </Button>
          
          {showAsphaltDetector && (
            <div className="text-xs text-muted-foreground bg-gradient-to-r from-blue-50/80 to-blue-100/80 dark:from-blue-950/20 dark:to-blue-900/20 p-4 rounded-lg border border-blue-200/30 dark:border-blue-800/30 animate-[slide-up_0.3s_ease-out] glass-effect">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-3 h-3 text-gis-draw" />
                <span className="font-medium text-gis-draw">Computer Vision Active</span>
              </div>
              <div>Click "Run AI Detection" to analyze satellite imagery for asphalt surfaces</div>
            </div>
          )}
        </div>
      </div>

      <Separator className="bg-border/50 shimmer-effect" />

      {/* Coverage Area */}
      <div>
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
          <div className="w-2 h-2 bg-gis-warning rounded-full pulse-glow"></div>
          Coverage Area
        </h3>
        <div className="text-xs text-muted-foreground space-y-2 glass-effect p-3 rounded-lg border border-border/30">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-primary rounded-full"></div>
            <strong>Virginia Counties:</strong>
          </div>
          <div className="ml-4 space-y-1">
            <div>• Patrick County (Primary)</div>
            <div>• Carroll, Floyd, Franklin, Henry Counties</div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 bg-accent rounded-full"></div>
            <strong>North Carolina Counties:</strong>
          </div>
          <div className="ml-4">
            <div>• Stokes & Surry Counties</div>
          </div>
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
              className="fixed top-20 left-4 z-50 floating-card h-12 w-12 p-0 touch-manipulation interactive-hover"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="panel-gradient w-[320px] overflow-y-auto">
            <SheetHeader>
              <SheetTitle className="text-foreground flex items-center gap-2">
                <div className="w-3 h-3 bg-primary rounded-full pulse-glow"></div>
                Tools & Layers
              </SheetTitle>
            </SheetHeader>
            <div className="mt-6">
              <ToolbarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Fixed Card with Close Button */}
      <div className="hidden sm:block">
        {!isDesktopToolbarOpen ? (
          <Button
            onClick={() => setIsDesktopToolbarOpen(true)}
            size="sm"
            className="fixed top-4 left-4 z-50 floating-card h-12 w-12 p-0 interactive-hover"
            title="Open Tools & Layers"
          >
            <Menu className="w-5 h-5" />
          </Button>
        ) : (
          <Card className="absolute top-4 left-4 z-50 floating-card max-w-[300px] lg:max-w-[320px] animate-[slide-in-right_0.4s_ease-out]">
            <div className="p-4">
              {/* Header with Close Button */}
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 bg-primary rounded-full pulse-glow"></div>
                  Tools & Layers
                </h2>
                <Button
                  onClick={() => setIsDesktopToolbarOpen(false)}
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-destructive/20 hover:text-destructive transition-all duration-300 interactive-hover"
                  title="Close Tools & Layers"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              <ToolbarContent />
            </div>
          </Card>
        )}
      </div>
    </>
  );
};
        

export default MeasurementToolbar;