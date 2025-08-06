import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Loader2, Zap, Square, AlertTriangle, Eye, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import ComputerVisionService, { AsphaltRegion } from './ComputerVisionService';

interface AsphaltDetectorProps {
  map: L.Map | null;
  onDetectionComplete?: (results: AsphaltRegion[]) => void;
}

const AsphaltDetector: React.FC<AsphaltDetectorProps> = ({ map, onDetectionComplete }) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectionResults, setDetectionResults] = useState<AsphaltRegion[]>([]);
  const [analysisStats, setAnalysisStats] = useState<{
    totalArea: number;
    processingTime: number;
    confidence: number;
  } | null>(null);
  
  const detectionLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const cvService = useRef(new ComputerVisionService());

  // Run AI asphalt detection with computer vision
  const runAsphaltDetection = async () => {
    if (!map) {
      toast.error('Map not available for analysis');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);
    toast.info('AI analyzing satellite imagery for asphalt surfaces...');

    try {
      // Get current map bounds and zoom
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      // Step 1: Initialize analysis
      setDetectionProgress(20);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Computer vision processing
      setDetectionProgress(40);
      const analysisResult = await cvService.current.analyzeForAsphalt(bounds, zoom);
      
      // Step 3: Process results
      setDetectionProgress(70);
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Step 4: Create map overlays
      setDetectionProgress(90);
      
      // Clear previous detections
      detectionLayer.current.clearLayers();
      
      // Add detection overlays to map
      analysisResult.asphaltRegions.forEach((surface, index) => {
        const polygon = L.polygon(surface.polygon.map(coord => L.latLng(coord[0], coord[1])), {
          color: getAsphaltColor(surface.surfaceType),
          weight: 2,
          opacity: 0.9,
          fillColor: getAsphaltColor(surface.surfaceType),
          fillOpacity: 0.25,
          dashArray: surface.confidence > 0.9 ? undefined : '8,4',
          className: `asphalt-${surface.surfaceType}`
        });

        // Enhanced measurement popup with AI details
        polygon.bindPopup(`
          <div class="p-3 min-w-[220px]">
            <div class="flex items-center gap-2 mb-2">
              <Square className="w-4 h-4" style="color: ${getAsphaltColor(surface.surfaceType)}" />
              <span class="font-semibold text-sm">AI-Detected ${surface.surfaceType.replace('_', ' ')}</span>
            </div>
            <div class="grid grid-cols-2 gap-2 text-xs mb-2">
              <div><strong>Length:</strong> ${surface.length.toFixed(1)} ft</div>
              <div><strong>Width:</strong> ${surface.width.toFixed(1)} ft</div>
              <div><strong>Area:</strong> ${surface.area.toFixed(0)} sq ft</div>
              <div><strong>Confidence:</strong> ${(surface.confidence * 100).toFixed(1)}%</div>
            </div>
            <div class="text-xs bg-gray-50 p-2 rounded">
              <div><strong>Surface Analysis:</strong></div>
              <div>Darkness: ${(surface.darkness * 100).toFixed(0)}%</div>
              <div>Material: Asphalt/Blacktop</div>
            </div>
            <div class="mt-2 text-[10px] text-gray-500">
              Computer Vision Analysis
            </div>
          </div>
        `);

        // Add pulsing effect for high-confidence detections
        if (surface.confidence > 0.9) {
          polygon.setStyle({
            className: `asphalt-${surface.surfaceType} asphalt-high-confidence`
          });
        }

        detectionLayer.current.addLayer(polygon);
      });

      // Add detection layer to map
      if (!map.hasLayer(detectionLayer.current)) {
        detectionLayer.current.addTo(map);
      }

      // Update state
      setDetectionResults(analysisResult.asphaltRegions);
      setAnalysisStats({
        totalArea: analysisResult.asphaltRegions.reduce((sum, surface) => sum + surface.area, 0),
        processingTime: analysisResult.processingTime,
        confidence: analysisResult.confidence
      });
      
      onDetectionComplete?.(analysisResult.asphaltRegions);
      setDetectionProgress(100);

      toast.success(`AI detected ${analysisResult.asphaltRegions.length} asphalt surfaces in ${analysisResult.processingTime}ms`);

    } catch (error) {
      console.error('Asphalt detection error:', error);
      toast.error('AI detection service temporarily unavailable');
    } finally {
      setIsDetecting(false);
      setTimeout(() => setDetectionProgress(0), 1000);
    }
  };

  // Get color for different asphalt surface types
  const getAsphaltColor = (type: AsphaltRegion['surfaceType']): string => {
    switch (type) {
      case 'driveway': return '#3b82f6';
      case 'parking_lot': return '#10b981';
      case 'road': return '#f59e0b';
      case 'path': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const clearDetections = () => {
    detectionLayer.current.clearLayers();
    setDetectionResults([]);
    setAnalysisStats(null);
    toast.success('AI detections cleared');
  };

  return (
    <Card className="absolute top-20 right-4 z-40 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-[300px]">
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-blue-600" />
          <h3 className="text-sm font-semibold">AI Asphalt Detection</h3>
        </div>
        
        <p className="text-xs text-muted-foreground">
          Computer vision analysis of satellite imagery to automatically detect and measure asphalt surfaces
        </p>

        {isDetecting && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>Processing satellite imagery...</span>
            </div>
            <Progress value={detectionProgress} className="h-2" />
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={runAsphaltDetection}
            disabled={isDetecting}
            className="w-full"
            size="sm"
          >
            {isDetecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Zap className="w-4 h-4 mr-2" />
                Run AI Detection
              </>
            )}
          </Button>

          {detectionResults.length > 0 && (
            <Button
              onClick={clearDetections}
              variant="outline"
              size="sm"
              className="w-full"
            >
              Clear Results
            </Button>
          )}
        </div>

        {analysisStats && (
          <div className="space-y-2 bg-muted/30 p-3 rounded">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-green-600" />
              <h4 className="text-xs font-medium">Analysis Results</h4>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Surfaces Found</div>
                <div className="font-medium">{detectionResults.length}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Total Area</div>
                <div className="font-medium">{analysisStats.totalArea.toFixed(0)} sq ft</div>
              </div>
              <div>
                <div className="text-muted-foreground">Avg Confidence</div>
                <div className="font-medium">{(analysisStats.confidence * 100).toFixed(1)}%</div>
              </div>
              <div>
                <div className="text-muted-foreground">Process Time</div>
                <div className="font-medium">{analysisStats.processingTime}ms</div>
              </div>
            </div>
          </div>
        )}

        {detectionResults.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium">Detected Surfaces:</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {detectionResults.map((surface, index) => (
                <div key={index} className="text-xs p-2 bg-muted/50 rounded">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: getAsphaltColor(surface.surfaceType) }}
                    />
                    <div className="font-medium">{surface.surfaceType.replace('_', ' ')}</div>
                  </div>
                  <div className="mt-1 text-muted-foreground">
                    {surface.area.toFixed(0)} sq ft • {(surface.confidence * 100).toFixed(0)}% confidence
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <div>
            AI detection uses computer vision analysis. Results are estimates - verify measurements for critical applications.
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AsphaltDetector;