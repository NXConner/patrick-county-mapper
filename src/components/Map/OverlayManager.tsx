import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import L from 'leaflet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { 
  Layers, 
  Eye, 
  EyeOff, 
  Trash2, 
  Settings, 
  Move3D, 
  Square,
  ExternalLink,
  Download,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown
} from 'lucide-react';
import { toast } from 'sonner';

export interface OverlayLayer {
  id: string;
  name: string;
  type: 'asphalt' | 'property' | 'measurement' | 'custom';
  leafletLayer: L.Layer;
  visible: boolean;
  opacity: number;
  zIndex: number;
  data?: unknown;
  created: Date;
  popOutWindow?: Window | null;
}

interface OverlayManagerProps {
  map: L.Map | null;
  onLayerUpdate?: (layers: OverlayLayer[]) => void;
}

interface OverlayManagerRef {
  addOverlay: (overlay: Omit<OverlayLayer, 'id' | 'created'>) => string;
  removeOverlay: (id: string) => void;
  toggleOverlay: (id: string) => void;
  setOverlayOpacity: (id: string, opacity: number) => void;
  moveOverlay: (id: string, direction: 'up' | 'down') => void;
  popOutOverlay: (id: string) => void;
  getLayers: () => OverlayLayer[];
  clearAllOverlays: () => void;
}

const OverlayManager = forwardRef<OverlayManagerRef, OverlayManagerProps>(
  ({ map, onLayerUpdate }, ref) => {
    const [overlayLayers, setOverlayLayers] = useState<OverlayLayer[]>([]);
    const [isExpanded, setIsExpanded] = useState(true);
    const [selectedLayer, setSelectedLayer] = useState<string | null>(null);
    const layerGroupRef = useRef<L.LayerGroup>(new L.LayerGroup());

    // Initialize layer group on map
    useEffect(() => {
      if (map && layerGroupRef.current) {
        layerGroupRef.current.addTo(map);
      }
      return () => {
        const layerGroup = layerGroupRef.current;
        if (map && layerGroup) {
          map.removeLayer(layerGroup);
        }
      };
    }, [map]);

    // Update layers when overlayLayers change
    useEffect(() => {
      if (!layerGroupRef.current) return;

      // Clear existing layers
      layerGroupRef.current.clearLayers();

      // Add layers in correct z-index order
      const sortedLayers = [...overlayLayers]
        .sort((a, b) => a.zIndex - b.zIndex)
        .filter(layer => layer.visible);

      sortedLayers.forEach(layer => {
        if (layer.leafletLayer) {
          // Set opacity if the layer supports it
          if ('setStyle' in layer.leafletLayer && typeof (layer.leafletLayer as L.Path).setStyle === 'function') {
            (layer.leafletLayer as L.Path).setStyle({ 
              fillOpacity: layer.opacity * 0.5,
              opacity: layer.opacity 
            });
          }
          layerGroupRef.current.addLayer(layer.leafletLayer);
        }
      });

      onLayerUpdate?.(overlayLayers);
    }, [overlayLayers, onLayerUpdate]);

    // Add new overlay
    const addOverlay = (overlay: Omit<OverlayLayer, 'id' | 'created'>): string => {
      const id = `overlay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const maxZIndex = Math.max(0, ...overlayLayers.map(l => l.zIndex));
      
      const newOverlay: OverlayLayer = {
        ...overlay,
        id,
        created: new Date(),
        zIndex: maxZIndex + 1,
        popOutWindow: null
      };

      setOverlayLayers(prev => [...prev, newOverlay]);
      toast.success(`Added ${overlay.name} overlay`);
      return id;
    };

    // Remove overlay
    const removeOverlay = (id: string) => {
      const layer = overlayLayers.find(l => l.id === id);
      if (layer?.popOutWindow && !layer.popOutWindow.closed) {
        layer.popOutWindow.close();
      }
      
      setOverlayLayers(prev => prev.filter(l => l.id !== id));
      if (selectedLayer === id) {
        setSelectedLayer(null);
      }
      toast.success('Overlay removed');
    };

    // Toggle overlay visibility
    const toggleOverlay = (id: string) => {
      setOverlayLayers(prev =>
        prev.map(layer =>
          layer.id === id ? { ...layer, visible: !layer.visible } : layer
        )
      );
    };

    // Set overlay opacity
    const setOverlayOpacity = (id: string, opacity: number) => {
      setOverlayLayers(prev =>
        prev.map(layer =>
          layer.id === id ? { ...layer, opacity: opacity / 100 } : layer
        )
      );
    };

    // Move overlay up or down in z-index
    const moveOverlay = (id: string, direction: 'up' | 'down') => {
      setOverlayLayers(prev => {
        const layers = [...prev];
        const currentIndex = layers.findIndex(l => l.id === id);
        const currentLayer = layers[currentIndex];
        
        if (direction === 'up' && currentIndex < layers.length - 1) {
          const nextLayer = layers[currentIndex + 1];
          currentLayer.zIndex = nextLayer.zIndex + 1;
        } else if (direction === 'down' && currentIndex > 0) {
          const prevLayer = layers[currentIndex - 1];
          currentLayer.zIndex = prevLayer.zIndex - 1;
        }
        
        return layers;
      });
    };

    // Pop out overlay in separate window
    const popOutOverlay = (id: string) => {
      const layer = overlayLayers.find(l => l.id === id);
      if (!layer) return;

      // Create popup window
      const popupWindow = window.open(
        '',
        `overlay_${id}`,
        'width=800,height=600,scrollbars=yes,resizable=yes'
      );

      if (popupWindow) {
        // Update layer with window reference
        setOverlayLayers(prev =>
          prev.map(l =>
            l.id === id ? { ...l, popOutWindow: popupWindow } : l
          )
        );

        // Set up popup window content
        setupPopOutWindow(popupWindow, layer);
        toast.success(`${layer.name} opened in new window`);
      }
    };

    // Setup popup window with overlay content
    const setupPopOutWindow = (popupWindow: Window, layer: OverlayLayer) => {
      popupWindow.document.write(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>${layer.name} - Overlay Viewer</title>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
          <style>
            body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; }
            #map { height: 500px; width: 100%; border: 1px solid #ccc; margin: 20px 0; }
            .controls { background: #f5f5f5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
            .white-bg { background: white !important; }
            .export-btn { 
              background: #0066cc; color: white; padding: 8px 16px; 
              border: none; border-radius: 4px; margin: 5px; cursor: pointer; 
            }
            .export-btn:hover { background: #0052a3; }
          </style>
        </head>
        <body>
          <h2>${layer.name}</h2>
          <div class="controls">
            <button class="export-btn" onclick="toggleBackground()">Toggle White Background</button>
            <button class="export-btn" onclick="exportAsPNG()">Export as PNG</button>
            <button class="export-btn" onclick="exportAsPDF()">Export as PDF</button>
            <button class="export-btn" onclick="print()">Print</button>
            <button class="export-btn" onclick="attachToEmail()">Attach to Email</button>
          </div>
          <div id="map"></div>
          <script>
            let map;
            let whiteBackground = false;
            
            // Initialize map
            function initMap() {
              map = L.map('map').setView([36.6837, -80.2876], 18);
              
              // Add base layer
              L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: 'Esri'
              }).addTo(map);
              
              // Add the overlay layer data here
              // This would be populated with the actual layer data
            }
            
            function toggleBackground() {
              whiteBackground = !whiteBackground;
              if (whiteBackground) {
                document.getElementById('map').classList.add('white-bg');
              } else {
                document.getElementById('map').classList.remove('white-bg');
              }
            }
            
            function exportAsPNG() {
              // Implementation for PNG export
              alert('PNG export functionality would be implemented here');
            }
            
            function exportAsPDF() {
              // Implementation for PDF export
              alert('PDF export functionality would be implemented here');
            }
            
            function attachToEmail() {
              // Implementation for email attachment
              alert('Email attachment functionality would be implemented here');
            }
            
            // Initialize when page loads
            window.onload = initMap;
          </script>
        </body>
        </html>
      `);
      popupWindow.document.close();
    };

    // Clear all overlays
    const clearAllOverlays = () => {
      overlayLayers.forEach(layer => {
        if (layer.popOutWindow && !layer.popOutWindow.closed) {
          layer.popOutWindow.close();
        }
      });
      setOverlayLayers([]);
      setSelectedLayer(null);
      toast.success('All overlays cleared');
    };

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      addOverlay,
      removeOverlay,
      toggleOverlay,
      setOverlayOpacity,
      moveOverlay,
      popOutOverlay,
      getLayers: () => overlayLayers,
      clearAllOverlays
    }));

    // Get layer type icon
    const getLayerTypeIcon = (type: string) => {
      switch (type) {
        case 'asphalt': return <Square className="w-4 h-4" />;
        case 'property': return <Layers className="w-4 h-4" />;
        case 'measurement': return <Move3D className="w-4 h-4" />;
        default: return <Layers className="w-4 h-4" />;
      }
    };

    // Get layer type color
    const getLayerTypeColor = (type: string) => {
      switch (type) {
        case 'asphalt': return 'bg-gray-800 text-white';
        case 'property': return 'bg-blue-600 text-white';
        case 'measurement': return 'bg-green-600 text-white';
        default: return 'bg-gray-600 text-white';
      }
    };

    if (!map) return null;

    return (
      <Card className="absolute top-4 right-4 w-80 max-h-96 overflow-hidden z-[1000] bg-white/95 backdrop-blur-sm">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              <span className="font-semibold">Overlay Manager</span>
              <Badge variant="secondary">{overlayLayers.length}</Badge>
            </div>
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              </Button>
              {overlayLayers.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllOverlays}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="max-h-80 overflow-y-auto">
            {overlayLayers.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <Layers className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No overlays added yet</p>
              </div>
            ) : (
              <div className="p-2 space-y-2">
                {overlayLayers
                  .sort((a, b) => b.zIndex - a.zIndex)
                  .map((layer, index) => (
                    <div 
                      key={layer.id} 
                      className={`p-3 border rounded-lg ${selectedLayer === layer.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getLayerTypeIcon(layer.type)}
                          <span className="font-medium text-sm">{layer.name}</span>
                          <Badge className={`text-xs ${getLayerTypeColor(layer.type)}`}>
                            {layer.type}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleOverlay(layer.id)}
                          >
                            {layer.visible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => popOutOverlay(layer.id)}
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOverlay(layer.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {layer.visible && (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-600">Opacity:</span>
                            <Slider
                              value={[layer.opacity * 100]}
                              onValueChange={(value) => setOverlayOpacity(layer.id, value[0])}
                              max={100}
                              step={5}
                              className="flex-1"
                            />
                            <span className="text-xs text-gray-600 w-8">
                              {Math.round(layer.opacity * 100)}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveOverlay(layer.id, 'up')}
                                disabled={index === 0}
                              >
                                <ChevronUp className="w-3 h-3" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => moveOverlay(layer.id, 'down')}
                                disabled={index === overlayLayers.length - 1}
                              >
                                <ChevronDown className="w-3 h-3" />
                              </Button>
                            </div>
                            <Badge variant="outline" className="text-xs">
                              Z: {layer.zIndex}
                            </Badge>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </Card>
    );
  }
);

OverlayManager.displayName = 'OverlayManager';

export default OverlayManager;
export type { OverlayManagerRef };