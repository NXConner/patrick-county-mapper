import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  Zap, 
  Square, 
  AlertTriangle, 
  Eye, 
  BarChart3, 
  X, 
  Minimize2, 
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import ComputerVisionService, { AsphaltRegion } from './ComputerVisionService';
import AiJobsService from '@/services/AiJobsService';

interface EnhancedAsphaltDetectorProps {
  map: L.Map | null;
  onDetectionComplete: (results: AsphaltRegion[]) => void;
  onClose: () => void;
  // Optional controlled UI props
  autoScan?: boolean;
  onAutoScanChange?: (enabled: boolean) => void;
  showLabels?: boolean;
  onShowLabelsChange?: (enabled: boolean) => void;
}

const EnhancedAsphaltDetector: React.FC<EnhancedAsphaltDetectorProps> = ({ 
  map, 
  onDetectionComplete,
  onClose,
  autoScan: controlledAutoScan,
  onAutoScanChange,
  showLabels: controlledShowLabels,
  onShowLabelsChange
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [results, setResults] = useState<AsphaltRegion[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const detectionLayer = useRef<L.LayerGroup | null>(null);
  const labelsLayer = useRef<L.LayerGroup | null>(null);
  const [autoScan, setAutoScan] = useState<boolean>(controlledAutoScan ?? false);
  const [showLabels, setShowLabels] = useState<boolean>(controlledShowLabels ?? true);
  const debounceId = useRef<number | null>(null);

  useEffect(() => {
    if (map && !detectionLayer.current) {
      detectionLayer.current = L.layerGroup().addTo(map);
    }
    if (map && !labelsLayer.current) {
      labelsLayer.current = L.layerGroup().addTo(map);
    }
    
    return () => {
      if (detectionLayer.current && map) {
        map.removeLayer(detectionLayer.current);
      }
      if (labelsLayer.current && map) {
        map.removeLayer(labelsLayer.current);
      }
    };
  }, [map]);

  // Persist and hydrate UI toggles (only when uncontrolled)
  useEffect(() => {
    if (controlledAutoScan === undefined && controlledShowLabels === undefined) {
      try {
        const a = localStorage.getItem('asphalt-auto-scan');
        const l = localStorage.getItem('asphalt-show-labels');
        if (a !== null) setAutoScan(a === '1');
        if (l !== null) setShowLabels(l === '1');
      } catch {}
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (controlledAutoScan === undefined) {
      try { localStorage.setItem('asphalt-auto-scan', autoScan ? '1' : '0'); } catch {}
    }
  }, [autoScan, controlledAutoScan]);

  useEffect(() => {
    if (controlledShowLabels === undefined) {
      try { localStorage.setItem('asphalt-show-labels', showLabels ? '1' : '0'); } catch {}
    }
  }, [showLabels, controlledShowLabels]);

  // Keep internal state in sync with controlled props if provided
  useEffect(() => {
    if (controlledAutoScan !== undefined) setAutoScan(controlledAutoScan);
  }, [controlledAutoScan]);
  useEffect(() => {
    if (controlledShowLabels !== undefined) setShowLabels(controlledShowLabels);
  }, [controlledShowLabels]);

  // Debounced re-run of detection when map view changes and autoScan is enabled
  useEffect(() => {
    if (!map) return;
    const schedule = () => {
      if (!autoScan) return;
      if (debounceId.current) window.clearTimeout(debounceId.current);
      debounceId.current = window.setTimeout(() => {
        startDetection({ auto: true });
      }, 600);
    };
    map.on('moveend', schedule);
    map.on('zoomend', schedule);
    return () => {
      map.off('moveend', schedule);
      map.off('zoomend', schedule);
      if (debounceId.current) {
        window.clearTimeout(debounceId.current);
        debounceId.current = null;
      }
    };
  }, [map, autoScan]);

  const getAsphaltColor = useCallback((type: AsphaltRegion['surfaceType']): string => {
    switch (type) {
      case 'driveway': return '#3b82f6';
      case 'parking_lot': return '#10b981';
      case 'road': return '#f59e0b';
      case 'path': return '#8b5cf6';
      default: return '#6b7280';
    }
  }, []);

  const startDetection = async (opts?: { auto?: boolean }) => {
    if (!map) {
      toast.error('Map not available for analysis');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);

    try {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Queue AI job only for manual runs to avoid spamming when auto-scanning
      let queuedId: string | null = null;
      if (!opts?.auto) {
        const aoi = { north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest(), zoom };
        queuedId = await AiJobsService.queue(aoi, { model: 'asphalt-v1' });
      }

      // Show synthetic progress bar while waiting
      const interval = setInterval(() => {
        setDetectionProgress(prev => {
          if (prev >= 95) return 95;
          return prev + 5;
        });
      }, 250);

      // Perform local analysis as immediate feedback
      const cv = new ComputerVisionService();
      const local = await cv.analyzeForAsphalt(bounds, zoom);

      // Stop progress and render results
      clearInterval(interval);
      setDetectionProgress(100);
      setResults(local.asphaltRegions);
      setIsDetecting(false);
      onDetectionComplete(local.asphaltRegions);

      // Clear and add detection overlay to map
      if (detectionLayer.current) detectionLayer.current.clearLayers();
      if (labelsLayer.current) labelsLayer.current.clearLayers();
      local.asphaltRegions.forEach(result => {
        const color = getAsphaltColor(result.surfaceType);
        const polygon = L.polygon(result.polygon as L.LatLngTuple[], {
          color,
          weight: 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: 0.25,
          className: `asphalt-${result.surfaceType}`
        });
        if (detectionLayer.current) detectionLayer.current.addLayer(polygon);

        if (showLabels && labelsLayer.current) {
          const center = (polygon.getBounds().getCenter());
          const labelHtml = `<div class="px-2 py-1 rounded text-[11px] font-semibold bg-white/90 border border-gray-300 shadow-sm whitespace-nowrap">${result.surfaceType.replace('_', ' ')} · ${Math.round(result.area).toLocaleString()} sq ft</div>`;
          const label = L.marker(center, {
            icon: L.divIcon({ html: labelHtml, className: 'asphalt-area-label', iconSize: [0, 0], iconAnchor: [0, 0] })
          });
          labelsLayer.current.addLayer(label);
        }
      });

      // If a job was queued, poll for server result and overlay when ready
      if (queuedId && queuedId !== 'offline-queued') {
        try {
          const pollUntil = Date.now() + 20000; // 20s
          const poll = async (): Promise<any | null> => {
            const { AiJobsService } = await import('@/services/AiJobsService');
            const j = await AiJobsService.get(queuedId!);
            if (!j) return null;
            if (j.status === 'succeeded' && j.result) return j.result;
            if (j.status === 'failed' || j.status === 'cancelled') return null;
            if (Date.now() > pollUntil) return null;
            await new Promise(r => setTimeout(r, 1500));
            return poll();
          };
          const serverResult = await poll();
          if (serverResult?.geojson && map && detectionLayer.current) {
            // Render server-result polygons in a distinct style
            try {
              const feats = serverResult.geojson.features as any[];
              feats.forEach((f) => {
                if (f.geometry?.type === 'Polygon') {
                  const ring = f.geometry.coordinates?.[0] || [];
                  const latlngs = ring.map((p: [number, number]) => [p[1], p[0]]) as L.LatLngTuple[];
                  const t = (f.properties?.surfaceType as any) || 'driveway';
                  const color = getAsphaltColor(t);
                  const poly = L.polygon(latlngs, { color, weight: 2, opacity: 0.9, fillOpacity: 0.18, dashArray: '6,3' });
                  detectionLayer.current!.addLayer(poly);
                }
              });
              toast.success('Server AI results overlayed');
            } catch {}
          }
        } catch {}
      }

    } catch (error) {
      console.error('Detection failed:', error);
      setIsDetecting(false);
      toast.error('Detection failed. Please try again.');
    }
  };

  const clearResults = () => {
    if (detectionLayer.current) {
      detectionLayer.current.clearLayers();
    }
    if (labelsLayer.current) {
      labelsLayer.current.clearLayers();
    }
    setResults([]);
    setDetectionProgress(0);
  };

  if (isMinimized) {
    return (
      <Card className="fixed bottom-4 right-4 z-40 w-64 p-3 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium">Asphalt Detector</span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(false)}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card className="fixed top-20 right-4 z-40 w-80 p-4 shadow-xl">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold">Enhanced Asphalt Detector</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(true)}
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isDetecting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-sm">Analyzing surface conditions...</span>
            </div>
            <Progress value={detectionProgress} className="w-full" />
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={() => startDetection()}
            disabled={isDetecting}
            className="flex-1"
          >
            {isDetecting ? 'Detecting...' : 'Start Detection'}
          </Button>
          <Button
            variant="outline"
            onClick={clearResults}
            disabled={results.length === 0}
          >
            Clear
          </Button>
        </div>

        {/* Auto-scan and Labels toggles */}
        <div className="flex items-center justify-between gap-2">
          <Button
            variant={autoScan ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !autoScan;
              if (onAutoScanChange) {
                onAutoScanChange(next);
              } else {
                setAutoScan(next);
              }
            }}
          >
            {autoScan ? 'Auto-scan: On' : 'Auto-scan: Off'}
          </Button>
          <Button
            variant={showLabels ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              const next = !showLabels;
              // Re-render labels without re-running detection
              if (labelsLayer.current) labelsLayer.current.clearLayers();
              if (next && results.length && map && detectionLayer.current && labelsLayer.current) {
                results.forEach(result => {
                  const color = getAsphaltColor(result.surfaceType);
                  const polygon = L.polygon(result.polygon as L.LatLngTuple[], { color });
                  const center = polygon.getBounds().getCenter();
                  const labelHtml = `<div class=\"px-2 py-1 rounded text-[11px] font-semibold bg-white/90 border border-gray-300 shadow-sm whitespace-nowrap\">${result.surfaceType.replace('_', ' ')} · ${Math.round(result.area).toLocaleString()} sq ft</div>`;
                  const label = L.marker(center, { icon: L.divIcon({ html: labelHtml, className: 'asphalt-area-label', iconSize: [0, 0], iconAnchor: [0, 0] }) });
                  labelsLayer.current!.addLayer(label);
                });
              }
              if (onShowLabelsChange) {
                onShowLabelsChange(next);
              } else {
                setShowLabels(next);
              }
            }}
          >
            {showLabels ? 'Labels: On' : 'Labels: Off'}
          </Button>
        </div>

        {results.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium">Detection Results</h4>
            {results.map((result, index) => (
              <div key={index} className="p-2 border rounded-lg space-y-1">
                <div className="flex items-center justify-between">
                  <Badge variant="default">
                    {result.surfaceType}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    {Math.round(result.confidence * 100)}% confidence
                  </span>
                </div>
                <div className="text-sm space-y-1">
                  <div>Area: {Math.round(result.area).toLocaleString()} sq ft</div>
                  <div>Length: {result.length} ft</div>
                  <div>Width: {result.width} ft</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
};

export default EnhancedAsphaltDetector;