import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Download, 
  Share2, 
  Printer, 
  Mail, 
  FileText,
  Maximize2,
  Minimize2,
  X,
  Settings,
  BarChart3,
  Square,
  Ruler,
  MapPin,
  Zap,
  Palette,
  Camera,
  Globe
} from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import AsphaltDetector from './AsphaltDetector';
import { AsphaltRegion } from './ComputerVisionService';

interface OverlayLayer {
  id: string;
  name: string;
  type: 'satellite' | 'roads' | 'labels' | 'property' | 'asphalt' | 'measurement' | 'custom';
  visible: boolean;
  opacity: number;
  color?: string;
  data?: any;
  layer?: L.Layer;
}

interface OverlayManagerProps {
  map: L.Map | null;
  onOverlayChange?: (overlays: OverlayLayer[]) => void;
  onExport?: (overlayData: any) => void;
}

const OverlayManager: React.FC<OverlayManagerProps> = ({ 
  map, 
  onOverlayChange,
  onExport 
}) => {
  const [overlays, setOverlays] = useState<OverlayLayer[]>([
    {
      id: 'satellite',
      name: 'Satellite Imagery',
      type: 'satellite',
      visible: true,
      opacity: 1.0,
      color: '#3b82f6'
    },
    {
      id: 'roads',
      name: 'Road Network',
      type: 'roads',
      visible: true,
      opacity: 0.8,
      color: '#f59e0b'
    },
    {
      id: 'labels',
      name: 'Map Labels',
      type: 'labels',
      visible: true,
      opacity: 0.9,
      color: '#10b981'
    },
    {
      id: 'property',
      name: 'Property Boundaries',
      type: 'property',
      visible: false,
      opacity: 0.7,
      color: '#ef4444'
    }
  ]);

  const [showAsphaltDetector, setShowAsphaltDetector] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [activeOverlay, setActiveOverlay] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'svg'>('png');

  const asphaltLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const measurementLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());

  // Initialize overlay layers on map
  useEffect(() => {
    if (!map) return;

    // Add asphalt detection layer
    if (!map.hasLayer(asphaltLayer.current)) {
      asphaltLayer.current.addTo(map);
    }

    // Add measurement layer
    if (!map.hasLayer(measurementLayer.current)) {
      measurementLayer.current.addTo(map);
    }

    return () => {
      if (map.hasLayer(asphaltLayer.current)) {
        map.removeLayer(asphaltLayer.current);
      }
      if (map.hasLayer(measurementLayer.current)) {
        map.removeLayer(measurementLayer.current);
      }
    };
  }, [map]);

  // Toggle overlay visibility
  const toggleOverlay = (overlayId: string) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, visible: !overlay.visible }
        : overlay
    ));
  };

  // Update overlay opacity
  const updateOpacity = (overlayId: string, opacity: number) => {
    setOverlays(prev => prev.map(overlay => 
      overlay.id === overlayId 
        ? { ...overlay, opacity }
        : overlay
    ));
  };

  // Add new overlay
  const addOverlay = (type: OverlayLayer['type'], name: string, data?: any) => {
    const newOverlay: OverlayLayer = {
      id: `${type}_${Date.now()}`,
      name,
      type,
      visible: true,
      opacity: 0.8,
      data,
      color: getOverlayColor(type)
    };

    setOverlays(prev => [...prev, newOverlay]);
    onOverlayChange?.(overlays);
  };

  // Remove overlay
  const removeOverlay = (overlayId: string) => {
    setOverlays(prev => prev.filter(overlay => overlay.id !== overlayId));
  };

  // Get color for overlay type
  const getOverlayColor = (type: OverlayLayer['type']): string => {
    switch (type) {
      case 'satellite': return '#3b82f6';
      case 'roads': return '#f59e0b';
      case 'labels': return '#10b981';
      case 'property': return '#ef4444';
      case 'asphalt': return '#8b5cf6';
      case 'measurement': return '#06b6d4';
      case 'custom': return '#6b7280';
      default: return '#6b7280';
    }
  };

  // Export overlay as image
  const exportOverlay = async (overlayId: string) => {
    if (!map) return;

    try {
      const overlay = overlays.find(o => o.id === overlayId);
      if (!overlay) return;

      // Create canvas for export
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Set canvas size to map size
      const mapSize = map.getSize();
      canvas.width = mapSize.x;
      canvas.height = mapSize.y;

      // Create white background
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Capture map as image
      const mapImage = await new Promise<HTMLImageElement>((resolve) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.src = map.getContainer().toDataURL();
      });

      // Draw map image
      ctx.drawImage(mapImage, 0, 0);

      // Add overlay-specific annotations
      if (overlay.type === 'asphalt' && overlay.data) {
        drawAsphaltAnnotations(ctx, overlay.data);
      }

      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `${overlay.name}_${Date.now()}.${exportFormat}`;
          a.click();
          URL.revokeObjectURL(url);
        }
      }, `image/${exportFormat}`);

      toast.success(`Exported ${overlay.name}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  // Draw asphalt annotations on export
  const drawAsphaltAnnotations = (ctx: CanvasRenderingContext2D, asphaltData: AsphaltRegion[]) => {
    ctx.fillStyle = '#8b5cf6';
    ctx.strokeStyle = '#8b5cf6';
    ctx.lineWidth = 2;
    ctx.font = '12px Arial';

    asphaltData.forEach((region, index) => {
      // Draw polygon
      ctx.beginPath();
      region.polygon.forEach((coord, i) => {
        if (i === 0) {
          ctx.moveTo(coord[1], coord[0]); // lat, lng
        } else {
          ctx.lineTo(coord[1], coord[0]);
        }
      });
      ctx.closePath();
      ctx.stroke();
      ctx.fillStyle = 'rgba(139, 92, 246, 0.2)';
      ctx.fill();

      // Add measurement text
      const center = region.polygon.reduce(
        (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], 
        [0, 0]
      ).map(val => val / region.polygon.length);

      ctx.fillStyle = '#000000';
      ctx.fillText(
        `${region.length.toFixed(0)}' × ${region.width.toFixed(0)}' = ${region.area.toFixed(0)} sq ft`,
        center[1], center[0]
      );
    });
  };

  // Export all overlays
  const exportAllOverlays = () => {
    overlays.filter(o => o.visible).forEach(overlay => {
      exportOverlay(overlay.id);
    });
  };

  // Create 3D visualization
  const create3DVisualization = (overlayId: string) => {
    const overlay = overlays.find(o => o.id === overlayId);
    if (!overlay || overlay.type !== 'asphalt') return;

    // Create 3D canvas visualization
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    // Draw 3D asphalt visualization
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (overlay.data) {
      overlay.data.forEach((region: AsphaltRegion, index: number) => {
        // Create 3D effect with shadows and perspective
        const x = 100 + (index % 3) * 200;
        const y = 100 + Math.floor(index / 3) * 150;
        const width = region.width / 10;
        const height = region.length / 10;

        // Draw shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fillRect(x + 5, y + 5, width, height);

        // Draw 3D surface
        ctx.fillStyle = '#374151';
        ctx.fillRect(x, y, width, height);

        // Draw top surface
        ctx.fillStyle = '#6b7280';
        ctx.fillRect(x - 2, y - 2, width, height);

        // Add measurements
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.fillText(`${region.area.toFixed(0)} sq ft`, x, y + height + 15);
      });
    }

    // Download 3D visualization
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${overlay.name}_3D_${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }
    });

    toast.success('3D visualization created');
  };

  return (
    <Card className="absolute top-20 right-4 z-40 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-[350px]">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Overlay Manager</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => setIsMinimized(!isMinimized)}
              title={isMinimized ? "Expand" : "Minimize"}
            >
              {isMinimized ? (
                <Maximize2 className="w-3 h-3" />
              ) : (
                <Minimize2 className="w-3 h-3" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
              title="Close"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {!isMinimized && (
          <>
            {/* Overlay List */}
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {overlays.map((overlay) => (
                <div key={overlay.id} className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50">
                  <div className="flex items-center gap-2 flex-1">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: overlay.color }}
                    />
                    <span className="text-sm font-medium">{overlay.name}</span>
                    <Badge variant="secondary" className="text-xs">
                      {overlay.type}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => toggleOverlay(overlay.id)}
                      title={overlay.visible ? "Hide" : "Show"}
                    >
                      {overlay.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </Button>
                    {overlay.type === 'asphalt' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0"
                        onClick={() => create3DVisualization(overlay.id)}
                        title="Create 3D View"
                      >
                        <Globe className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => exportOverlay(overlay.id)}
                      title="Export"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <Separator />

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button
                onClick={() => setShowAsphaltDetector(!showAsphaltDetector)}
                variant={showAsphaltDetector ? "default" : "outline"}
                size="sm"
                className="w-full"
              >
                <Zap className="w-4 h-4 mr-2" />
                {showAsphaltDetector ? 'Hide AI Detection' : 'AI Asphalt Detection'}
              </Button>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={exportAllOverlays}
                  variant="outline"
                  size="sm"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                >
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Export Format Selector */}
            <div className="space-y-2">
              <label className="text-xs font-medium">Export Format:</label>
              <div className="flex gap-2">
                {(['png', 'pdf', 'svg'] as const).map((format) => (
                  <Button
                    key={format}
                    variant={exportFormat === format ? "default" : "outline"}
                    size="sm"
                    onClick={() => setExportFormat(format)}
                    className="text-xs"
                  >
                    {format.toUpperCase()}
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* AI Asphalt Detector */}
        {showAsphaltDetector && (
          <AsphaltDetector
            map={map}
            onDetectionComplete={(results) => {
              // Add asphalt overlay
              addOverlay('asphalt', 'AI Asphalt Detection', results);
              toast.success(`Added ${results.length} asphalt surfaces to overlays`);
            }}
            onClose={() => setShowAsphaltDetector(false)}
          />
        )}
      </div>
    </Card>
  );
};

export default OverlayManager;