import React, { useState, useRef, useEffect } from 'react';
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
}

const EnhancedAsphaltDetector: React.FC<EnhancedAsphaltDetectorProps> = ({ 
  map, 
  onDetectionComplete,
  onClose 
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [results, setResults] = useState<AsphaltRegion[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const detectionLayer = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (map && !detectionLayer.current) {
      detectionLayer.current = L.layerGroup().addTo(map);
    }
    
    return () => {
      if (detectionLayer.current && map) {
        map.removeLayer(detectionLayer.current);
      }
    };
  }, [map]);

  const startDetection = async () => {
    if (!map) {
      toast.error('Map not available for analysis');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);

    try {
      const bounds = map.getBounds();
      const zoom = map.getZoom();

      // Queue AI job in Supabase; worker may process it (dev) or backend (prod)
      const aoi = { north: bounds.getNorth(), south: bounds.getSouth(), east: bounds.getEast(), west: bounds.getWest(), zoom };
      const jobId = await AiJobsService.queue(aoi, { model: 'asphalt-v1' });

      // Show synthetic progress bar while waiting
      const interval = setInterval(() => {
        setDetectionProgress(prev => {
          if (prev >= 95) return 95;
          return prev + 5;
        });
      }, 250);

      // Perform local analysis as an immediate fallback to provide user feedback
      const cv = new ComputerVisionService();
      const local = await cv.analyzeForAsphalt(bounds, zoom);

      // Stop progress and render results
      clearInterval(interval);
      setDetectionProgress(100);
      setResults(local.asphaltRegions);
      setIsDetecting(false);
      onDetectionComplete(local.asphaltRegions);

      // Add detection overlay to map
      local.asphaltRegions.forEach(result => {
        const polygon = L.polygon(result.polygon as L.LatLngTuple[], { color: '#22c55e', fillOpacity: 0.3 });
        if (detectionLayer.current) detectionLayer.current.addLayer(polygon);
      });

      // Optionally, attach jobId to layer for later inspection
      (polygon => polygon)(null as any); // no-op to satisfy lints when not used

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
            onClick={startDetection}
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
                  <div>Area: {result.area} sq ft</div>
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