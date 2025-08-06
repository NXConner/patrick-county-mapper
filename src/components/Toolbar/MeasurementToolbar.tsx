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
  X,
  Layers,
  Settings,
  MapPin,
  Target,
  BarChart3,
  Download,
  Share2
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
  const [activeSection, setActiveSection] = useState<'tools' | 'layers' | 'ai' | 'info'>('tools');

  const tools = [
    {
      id: 'select',
      name: 'Select',
      icon: <MousePointerIcon className="w-4 h-4" />,
      description: 'Select and move features',
      color: 'bg-blue-500/20 text-blue-600 border-blue-500/30'
    },
    {
      id: 'polygon',
      name: 'Area',
      icon: <SquareIcon className="w-4 h-4" />,
      description: 'Measure area (driveways, parking lots)',
      color: 'bg-green-500/20 text-green-600 border-green-500/30'
    },
    {
      id: 'line',
      name: 'Distance',
      icon: <RulerIcon className="w-4 h-4" />,
      description: 'Measure distance and length',
      color: 'bg-purple-500/20 text-purple-600 border-purple-500/30'
    },
    {
      id: 'point',
      name: 'Point',
      icon: <MapPin className="w-4 h-4" />,
      description: 'Add point markers',
      color: 'bg-orange-500/20 text-orange-600 border-orange-500/30'
    }
  ];

  // Dynamic layer controls based on current state
  const layerControls = [
    {
      id: 'satellite',
      name: 'Satellite',
      icon: <Eye className="w-4 h-4" />,
      active: layerStates?.satellite ?? true,
      description: 'High-resolution satellite imagery',
      color: 'bg-slate-500/20 text-slate-600 border-slate-500/30'
    },
    {
      id: 'roads',
      name: 'Roads',
      icon: <BarChart3 className="w-4 h-4" />,
      active: layerStates?.roads ?? true,
      description: 'Street and road overlays',
      color: 'bg-gray-500/20 text-gray-600 border-gray-500/30'
    },
    {
      id: 'labels',
      name: 'Labels',
      icon: <Target className="w-4 h-4" />,
      active: layerStates?.labels ?? true,
      description: 'Place names and street labels',
      color: 'bg-indigo-500/20 text-indigo-600 border-indigo-500/30'
    },
    {
      id: 'property',
      name: 'Property Lines',
      icon: <SquareIcon className="w-4 h-4" />,
      active: layerStates?.property ?? false,
      description: 'Building outlines and property boundaries',
      color: 'bg-red-500/20 text-red-600 border-red-500/30'
    }
  ];

  // Enhanced Toolbar content component
  const ToolbarContent = () => (
    <div className="space-y-6">
      {/* Header with Close Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-foreground">GIS Tools</h2>
        <Button
          onClick={() => setIsMobileMenuOpen(false)}
          variant="ghost"
          size="sm"
          className="close-btn-enhanced"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-muted/20 rounded-lg p-1">
        {[
          { id: 'tools', label: 'Tools', icon: <MousePointerIcon className="w-4 h-4" /> },
          { id: 'layers', label: 'Layers', icon: <Layers className="w-4 h-4" /> },
          { id: 'ai', label: 'AI Tools', icon: <Zap className="w-4 h-4" /> },
          { id: 'info', label: 'Info', icon: <InfoIcon className="w-4 h-4" /> }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id as any)}
            className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
              activeSection === tab.id
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Tools Section */}
      {activeSection === 'tools' && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            {tools.map((tool) => (
              <Button
                key={tool.id}
                variant={activeTool === tool.id ? "default" : "secondary"}
                size="sm"
                onClick={() => {
                  onToolChange(tool.id);
                  setIsMobileMenuOpen(false);
                }}
                className={`h-16 p-3 flex flex-col items-center gap-2 transition-all duration-200 ${
                  activeTool === tool.id 
                    ? 'btn-primary-enhanced shadow-success' 
                    : 'btn-secondary-enhanced hover:shadow-panel'
                }`}
                title={tool.description}
              >
                <div className={`p-2 rounded-lg ${tool.color} ${activeTool === tool.id ? 'bg-primary/20' : ''}`}>
                  {tool.icon}
                </div>
                <span className="text-xs font-medium">{tool.name}</span>
              </Button>
            ))}
          </div>

          {/* Current Measurement Display */}
          {currentMeasurement && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <BarChart3 className="w-4 h-4" />
                Current Measurement
              </h3>
              <div className="space-y-2">
                {currentMeasurement.area && (
                  <div className="badge-enhanced p-3 flex justify-between items-center">
                    <span className="text-sm">Area:</span>
                    <span className="text-sm font-bold text-primary">{currentMeasurement.area.toFixed(2)} sq ft</span>
                  </div>
                )}
                {currentMeasurement.distance && (
                  <div className="badge-enhanced p-3 flex justify-between items-center">
                    <span className="text-sm">Distance:</span>
                    <span className="text-sm font-bold text-primary">{currentMeasurement.distance.toFixed(2)} ft</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Layers Section */}
      {activeSection === 'layers' && (
        <div className="space-y-4">
          <div className="space-y-3">
            {layerControls.map((layer) => (
              <button
                key={layer.id}
                onClick={() => onLayerToggle?.(layer.id)}
                className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-all duration-200 group"
                title={layer.description}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${layer.color} ${layer.active ? 'bg-primary/20' : ''}`}>
                    {layer.icon}
                  </div>
                  <div className="text-left">
                    <span className="text-sm font-medium text-foreground">{layer.name}</span>
                    <p className="text-xs text-muted-foreground">{layer.description}</p>
                  </div>
                </div>
                <div className={`w-5 h-5 rounded-full border-2 transition-all duration-200 ${
                  layer.active 
                    ? 'bg-primary border-primary shadow-success' 
                    : 'bg-muted border-border'
                }`} />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* AI Tools Section */}
      {activeSection === 'ai' && (
        <div className="space-y-4">
          <Button
            onClick={() => {
              onAsphaltDetection?.();
              setIsMobileMenuOpen(false);
            }}
            variant={showAsphaltDetector ? "default" : "outline"}
            size="sm"
            className={`w-full justify-start h-12 transition-all duration-200 ${
              showAsphaltDetector ? 'btn-primary-enhanced' : 'btn-secondary-enhanced'
            }`}
          >
            <Zap className="w-4 h-4 mr-2" />
            {showAsphaltDetector ? 'Hide AI Detection' : 'AI Asphalt Detection'}
          </Button>
          
          {showAsphaltDetector && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 border border-blue-200/50 dark:border-blue-800/50">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-4 h-4 text-blue-600" />
                <span className="font-medium text-blue-600">Computer Vision Active</span>
              </div>
              <p className="text-sm text-muted-foreground">
                Click "Run AI Detection" to analyze satellite imagery for asphalt surfaces
              </p>
            </div>
          )}

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">AI Features</h4>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                Surface Detection
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                Property Analysis
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                Measurement Automation
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Info Section */}
      {activeSection === 'info' && (
        <div className="space-y-4">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Coverage Area</h4>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="p-3 rounded-lg bg-muted/20">
                <div className="font-medium text-foreground mb-1">Virginia Counties:</div>
                <div>• Patrick County (Primary)</div>
                <div>• Carroll, Floyd, Franklin, Henry Counties</div>
              </div>
              <div className="p-3 rounded-lg bg-muted/20">
                <div className="font-medium text-foreground mb-1">North Carolina Counties:</div>
                <div>• Stokes & Surry Counties</div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-foreground">Quick Actions</h4>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="outline" size="sm" className="h-10">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
              <Button variant="outline" size="sm" className="h-10">
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* Mobile: Enhanced Sheet/Drawer */}
      <div className="sm:hidden">
        <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
          <SheetTrigger asChild>
            <Button
              size="sm"
              className="fixed top-20 left-4 z-50 bg-gis-toolbar/95 backdrop-blur-md shadow-toolbar h-12 w-12 p-0 touch-manipulation btn-secondary-enhanced hover:shadow-floating"
            >
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sheet-enhanced w-[320px] overflow-y-auto scrollbar-enhanced">
            <div className="mt-6">
              <ToolbarContent />
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Desktop: Enhanced Fixed Card */}
      <div className="hidden sm:block">
        <Card className="absolute top-4 left-4 z-50 card-enhanced max-w-[320px] lg:max-w-[340px]">
          <div className="p-4">
            <ToolbarContent />
          </div>
        </Card>
      </div>
    </>
  );
};
        

export default MeasurementToolbar;