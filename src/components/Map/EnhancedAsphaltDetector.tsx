import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Zap, 
  Square, 
  AlertTriangle, 
  Eye, 
  BarChart3, 
  X, 
  Minimize2, 
  Maximize2,
  Download,
  Share2,
  Printer,
  Mail,
  FileText,
  Globe,
  Camera,
  Ruler,
  MapPin,
  Layers,
  Settings,
  Palette,
  Target,
  Info
} from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import ComputerVisionService, { AsphaltRegion } from './ComputerVisionService';

interface EnhancedAsphaltDetectorProps {
  map: L.Map | null;
  onDetectionComplete?: (results: AsphaltRegion[]) => void;
  onClose?: () => void;
  onExport?: (data: AsphaltRegion[], format: string) => void;
}

interface DetectionResult {
  region: AsphaltRegion;
  measurements: {
    length: number;
    width: number;
    area: number;
    perimeter: number;
  };
  confidence: number;
  surfaceType: string;
  estimatedCost?: number;
}

const EnhancedAsphaltDetector: React.FC<EnhancedAsphaltDetectorProps> = ({ 
  map, 
  onDetectionComplete, 
  onClose,
  onExport 
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectionResults, setDetectionResults] = useState<DetectionResult[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [selectedResult, setSelectedResult] = useState<DetectionResult | null>(null);
  const [visualizationMode, setVisualizationMode] = useState<'2d' | '3d' | 'measurements'>('2d');
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf' | 'svg' | 'json'>('png');
  
  const detectionLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const cvService = useRef(new ComputerVisionService());
  const highlightLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());

  // Initialize layers on map
  useEffect(() => {
    if (!map) return;

    // Add detection layer
    if (!map.hasLayer(detectionLayer.current)) {
      detectionLayer.current.addTo(map);
    }

    // Add highlight layer
    if (!map.hasLayer(highlightLayer.current)) {
      highlightLayer.current.addTo(map);
    }

    return () => {
      if (map.hasLayer(detectionLayer.current)) {
        map.removeLayer(detectionLayer.current);
      }
      if (map.hasLayer(highlightLayer.current)) {
        map.removeLayer(highlightLayer.current);
      }
    };
  }, [map]);

  // Run enhanced AI asphalt detection
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
      
      // Step 3: Process and enhance results
      setDetectionProgress(70);
      const enhancedResults = await processDetectionResults(analysisResult.asphaltRegions);
      
      // Step 4: Create enhanced map overlays
      setDetectionProgress(90);
      createEnhancedOverlays(enhancedResults);
      
      // Update state
      setDetectionResults(enhancedResults);
      setDetectionProgress(100);

      toast.success(`AI detected ${enhancedResults.length} asphalt surfaces with enhanced measurements`);

      onDetectionComplete?.(analysisResult.asphaltRegions);

    } catch (error) {
      console.error('Enhanced asphalt detection error:', error);
      toast.error('AI detection service temporarily unavailable');
    } finally {
      setIsDetecting(false);
      setTimeout(() => setDetectionProgress(0), 1000);
    }
  };

  // Process detection results with enhanced measurements
  const processDetectionResults = async (regions: AsphaltRegion[]): Promise<DetectionResult[]> => {
    return regions.map(region => {
      const measurements = calculateEnhancedMeasurements(region);
      const estimatedCost = calculateEstimatedCost(measurements.area);
      
      return {
        region,
        measurements,
        confidence: region.confidence,
        surfaceType: region.surfaceType,
        estimatedCost
      };
    });
  };

  // Calculate enhanced measurements
  const calculateEnhancedMeasurements = (region: AsphaltRegion) => {
    const { length, width, area } = region;
    const perimeter = 2 * (length + width);
    
    return {
      length,
      width,
      area,
      perimeter
    };
  };

  // Calculate estimated cost based on area
  const calculateEstimatedCost = (area: number): number => {
    // Rough estimate: $3-5 per square foot for asphalt paving
    const costPerSqFt = 4.0;
    return area * costPerSqFt;
  };

  // Create enhanced overlays with better visualization
  const createEnhancedOverlays = (results: DetectionResult[]) => {
    // Clear previous detections
    detectionLayer.current.clearLayers();
    
    results.forEach((result, index) => {
      const { region, measurements, confidence, surfaceType } = result;
      
      // Create enhanced polygon with better styling
      const polygon = L.polygon(region.polygon.map(coord => L.latLng(coord[0], coord[1])), {
        color: getAsphaltColor(surfaceType),
        weight: confidence > 0.9 ? 3 : 2,
        opacity: 0.9,
        fillColor: getAsphaltColor(surfaceType),
        fillOpacity: confidence > 0.9 ? 0.3 : 0.2,
        dashArray: confidence > 0.9 ? undefined : '8,4',
        className: `asphalt-${surfaceType} asphalt-confidence-${Math.floor(confidence * 10)}`
      });

      // Enhanced popup with detailed measurements
      const popupContent = createEnhancedPopup(result);
      polygon.bindPopup(popupContent, {
        maxWidth: 300,
        className: 'asphalt-popup-enhanced'
      });

      // Add hover effects
      polygon.on('mouseover', () => {
        polygon.setStyle({
          weight: 4,
          fillOpacity: 0.4
        });
        highlightLayer.current.clearLayers();
        highlightLayer.current.addLayer(polygon.clone());
      });

      polygon.on('mouseout', () => {
        polygon.setStyle({
          weight: confidence > 0.9 ? 3 : 2,
          fillOpacity: confidence > 0.9 ? 0.3 : 0.2
        });
        highlightLayer.current.clearLayers();
      });

      // Add click handler for selection
      polygon.on('click', () => {
        setSelectedResult(result);
      });

      detectionLayer.current.addLayer(polygon);
    });
  };

  // Create enhanced popup content
  const createEnhancedPopup = (result: DetectionResult) => {
    const { region, measurements, confidence, surfaceType, estimatedCost } = result;
    
    return `
      <div class="p-4 min-w-[280px] bg-white rounded-lg shadow-lg">
        <div class="flex items-center gap-2 mb-3">
          <div class="w-4 h-4 rounded-full" style="background-color: ${getAsphaltColor(surfaceType)}"></div>
          <span class="font-semibold text-sm">AI-Detected ${surfaceType.replace('_', ' ')}</span>
          <Badge variant="secondary" class="text-xs">${(confidence * 100).toFixed(0)}%</Badge>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="text-center p-2 bg-blue-50 rounded">
            <div class="text-xs text-blue-600 font-medium">Length</div>
            <div class="text-lg font-bold text-blue-800">${measurements.length.toFixed(1)} ft</div>
          </div>
          <div class="text-center p-2 bg-green-50 rounded">
            <div class="text-xs text-green-600 font-medium">Width</div>
            <div class="text-lg font-bold text-green-800">${measurements.width.toFixed(1)} ft</div>
          </div>
          <div class="text-center p-2 bg-purple-50 rounded">
            <div class="text-xs text-purple-600 font-medium">Area</div>
            <div class="text-lg font-bold text-purple-800">${measurements.area.toFixed(0)} sq ft</div>
          </div>
          <div class="text-center p-2 bg-orange-50 rounded">
            <div class="text-xs text-orange-600 font-medium">Perimeter</div>
            <div class="text-lg font-bold text-orange-800">${measurements.perimeter.toFixed(1)} ft</div>
          </div>
        </div>
        
        ${estimatedCost ? `
          <div class="p-2 bg-yellow-50 rounded mb-3">
            <div class="text-xs text-yellow-600 font-medium">Estimated Cost</div>
            <div class="text-lg font-bold text-yellow-800">$${estimatedCost.toLocaleString()}</div>
          </div>
        ` : ''}
        
        <div class="text-xs text-gray-500 bg-gray-50 p-2 rounded">
          <div class="font-medium">Surface Analysis:</div>
          <div>Darkness: ${(region.darkness * 100).toFixed(0)}%</div>
          <div>Material: Asphalt/Blacktop</div>
          <div>Confidence: ${(confidence * 100).toFixed(1)}%</div>
        </div>
      </div>
    `;
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

  // Export detection results
  const exportResults = (format: string) => {
    if (detectionResults.length === 0) {
      toast.error('No detection results to export');
      return;
    }

    try {
      switch (format) {
        case 'json':
          exportAsJSON();
          break;
        case 'pdf':
          exportAsPDF();
          break;
        case 'svg':
          exportAsSVG();
          break;
        default:
          exportAsImage();
      }
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Export failed');
    }
  };

  // Export as JSON
  const exportAsJSON = () => {
    const data = {
      timestamp: new Date().toISOString(),
      totalSurfaces: detectionResults.length,
      totalArea: detectionResults.reduce((sum, r) => sum + r.measurements.area, 0),
      surfaces: detectionResults.map(r => ({
        type: r.surfaceType,
        measurements: r.measurements,
        confidence: r.confidence,
        estimatedCost: r.estimatedCost
      }))
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt_detection_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as PDF
  const exportAsPDF = () => {
    // Create PDF content
    const content = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .surface { margin-bottom: 20px; padding: 10px; border: 1px solid #ccc; }
            .measurements { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Asphalt Detection Report</h1>
            <p>Generated on ${new Date().toLocaleDateString()}</p>
          </div>
          ${detectionResults.map((result, index) => `
            <div class="surface">
              <h3>Surface ${index + 1}: ${result.surfaceType.replace('_', ' ')}</h3>
              <div class="measurements">
                <div>Length: ${result.measurements.length.toFixed(1)} ft</div>
                <div>Width: ${result.measurements.width.toFixed(1)} ft</div>
                <div>Area: ${result.measurements.area.toFixed(0)} sq ft</div>
                <div>Perimeter: ${result.measurements.perimeter.toFixed(1)} ft</div>
                <div>Confidence: ${(result.confidence * 100).toFixed(1)}%</div>
                ${result.estimatedCost ? `<div>Estimated Cost: $${result.estimatedCost.toLocaleString()}</div>` : ''}
              </div>
            </div>
          `).join('')}
        </body>
      </html>
    `;

    // Convert to PDF (simplified - in real app would use a PDF library)
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt_report_${Date.now()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as SVG
  const exportAsSVG = () => {
    const svgContent = `
      <svg width="800" height="600" xmlns="http://www.w3.org/2000/svg">
        <rect width="800" height="600" fill="white"/>
        <text x="400" y="30" text-anchor="middle" font-family="Arial" font-size="16" font-weight="bold">
          Asphalt Detection Results
        </text>
        ${detectionResults.map((result, index) => {
          const x = 50 + (index % 3) * 250;
          const y = 80 + Math.floor(index / 3) * 150;
          const width = Math.min(result.measurements.width / 10, 200);
          const height = Math.min(result.measurements.length / 10, 100);
          
          return `
            <rect x="${x}" y="${y}" width="${width}" height="${height}" 
                  fill="${getAsphaltColor(result.surfaceType)}" opacity="0.7" stroke="black" stroke-width="2"/>
            <text x="${x + width/2}" y="${y + height + 15}" text-anchor="middle" font-family="Arial" font-size="12">
              ${result.measurements.area.toFixed(0)} sq ft
            </text>
          `;
        }).join('')}
      </svg>
    `;

    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `asphalt_visualization_${Date.now()}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Export as image
  const exportAsImage = () => {
    if (!map) return;

    // Create canvas and capture map
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const mapSize = map.getSize();
    canvas.width = mapSize.x;
    canvas.height = mapSize.y;

    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Capture map
    const mapImage = new Image();
    mapImage.onload = () => {
      ctx.drawImage(mapImage, 0, 0);
      
      // Add annotations
      detectionResults.forEach((result, index) => {
        const { region, measurements } = result;
        
        // Draw polygon outline
        ctx.strokeStyle = getAsphaltColor(result.surfaceType);
        ctx.lineWidth = 3;
        ctx.beginPath();
        region.polygon.forEach((coord, i) => {
          const point = map.latLngToLayerPoint(L.latLng(coord[0], coord[1]));
          if (i === 0) {
            ctx.moveTo(point.x, point.y);
          } else {
            ctx.lineTo(point.x, point.y);
          }
        });
        ctx.closePath();
        ctx.stroke();

        // Add measurement text
        const center = region.polygon.reduce(
          (acc, coord) => [acc[0] + coord[0], acc[1] + coord[1]], 
          [0, 0]
        ).map(val => val / region.polygon.length);
        
        const centerPoint = map.latLngToLayerPoint(L.latLng(center[0], center[1]));
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(
          `${measurements.length.toFixed(0)}' × ${measurements.width.toFixed(0)}' = ${measurements.area.toFixed(0)} sq ft`,
          centerPoint.x, centerPoint.y
        );
      });

      // Download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `asphalt_detection_${Date.now()}.png`;
          a.click();
          URL.revokeObjectURL(url);
        }
      });
    };
    mapImage.src = map.getContainer().toDataURL();
  };

  const clearDetections = () => {
    detectionLayer.current.clearLayers();
    highlightLayer.current.clearLayers();
    setDetectionResults([]);
    setSelectedResult(null);
    toast.success('AI detections cleared');
  };

  return (
    <Card className="absolute top-20 right-4 z-40 bg-background/95 backdrop-blur-sm border-border/50 shadow-lg max-w-[380px]">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-semibold">Enhanced AI Detection</h3>
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
              onClick={onClose}
              title="Close"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        </div>
        
        {!isMinimized && (
          <>
            <p className="text-xs text-muted-foreground">
              Advanced computer vision analysis with enhanced measurements and cost estimates
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
                    Run Enhanced Detection
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

            {/* Export Options */}
            {detectionResults.length > 0 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-xs font-medium">Export Format:</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(['png', 'pdf', 'svg', 'json'] as const).map((format) => (
                      <Button
                        key={format}
                        variant={exportFormat === format ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          setExportFormat(format);
                          exportResults(format);
                        }}
                        className="text-xs"
                      >
                        <Download className="w-3 h-3 mr-1" />
                        {format.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
              </>
            )}

            {/* Results Summary */}
            {detectionResults.length > 0 && (
              <div className="space-y-2 bg-muted/30 p-3 rounded">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-4 h-4 text-green-600" />
                  <h4 className="text-xs font-medium">Detection Summary</h4>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <div className="text-muted-foreground">Surfaces Found</div>
                    <div className="font-medium">{detectionResults.length}</div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Total Area</div>
                    <div className="font-medium">
                      {detectionResults.reduce((sum, r) => sum + r.measurements.area, 0).toFixed(0)} sq ft
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Avg Confidence</div>
                    <div className="font-medium">
                      {(detectionResults.reduce((sum, r) => sum + r.confidence, 0) / detectionResults.length * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Est. Total Cost</div>
                    <div className="font-medium">
                      ${detectionResults.reduce((sum, r) => sum + (r.estimatedCost || 0), 0).toLocaleString()}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 text-xs text-amber-600 bg-amber-50 p-2 rounded">
              <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <div>
                Enhanced AI detection with cost estimates. Verify measurements for critical applications.
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

export default EnhancedAsphaltDetector;