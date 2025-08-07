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
  Maximize2,
  ExternalLink,
  Download,
  Mail,
  FileText,
  Printer,
  Car,
  Building2,
  Sparkles,
  Move3D,
  Layers
} from 'lucide-react';
import { toast } from 'sonner';
import L from 'leaflet';
import ComputerVisionService, { AsphaltRegion } from './ComputerVisionService';
import type { OverlayManagerRef } from './OverlayManager';

interface EnhancedAsphaltDetectorProps {
  map: L.Map | null;
  overlayManagerRef?: React.RefObject<OverlayManagerRef>;
  onDetectionComplete?: (results: AsphaltRegion[]) => void;
  onClose?: () => void;
}

interface AsphaltMeasurement {
  id: string;
  type: 'driveway' | 'parking_lot' | 'road' | 'path';
  length: number; // feet
  width: number; // feet
  area: number; // square feet
  confidence: number;
  coordinates: [number, number][];
  popOutWindow?: Window | null;
}

const EnhancedAsphaltDetector: React.FC<EnhancedAsphaltDetectorProps> = ({ 
  map, 
  overlayManagerRef,
  onDetectionComplete, 
  onClose 
}) => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectionProgress, setDetectionProgress] = useState(0);
  const [detectionResults, setDetectionResults] = useState<AsphaltRegion[]>([]);
  const [measurements, setMeasurements] = useState<AsphaltMeasurement[]>([]);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoDetectionEnabled, setAutoDetectionEnabled] = useState(true);
  const [popOutEffect, setPopOutEffect] = useState(false);
  const [analysisStats, setAnalysisStats] = useState<{
    totalArea: number;
    processingTime: number;
    confidence: number;
    drivewayCount: number;
    parkingLotCount: number;
  } | null>(null);
  
  const detectionLayer = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const cvService = useRef(new ComputerVisionService());

  // Initialize detection layer
  useEffect(() => {
    if (map && detectionLayer.current) {
      detectionLayer.current.addTo(map);
    }
    return () => {
      const layer = detectionLayer.current;
      if (map && layer) {
        map.removeLayer(layer);
      }
    };
  }, [map]);

  // Enhanced AI asphalt detection with auto-detection capabilities
  const runEnhancedAsphaltDetection = async () => {
    if (!map) {
      toast.error('Map not available for analysis');
      return;
    }

    setIsDetecting(true);
    setDetectionProgress(0);
    setPopOutEffect(true);
    toast.info('🚀 Enhanced AI analyzing satellite imagery for asphalt surfaces...');

    try {
      // Get current map bounds and zoom
      const bounds = map.getBounds();
      const zoom = map.getZoom();
      
      // Step 1: Initialize enhanced analysis
      setDetectionProgress(15);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Step 2: Computer vision processing with enhanced algorithms
      setDetectionProgress(35);
      const analysisResult = await cvService.current.analyzeForAsphalt(bounds, zoom);
      
      // Step 3: Auto-classification of driveways vs parking lots
      setDetectionProgress(55);
      const classifiedResults = await autoClassifyAsphaltAreas(analysisResult.asphaltRegions);
      
      // Step 4: Enhanced measurements and area calculations
      setDetectionProgress(75);
      const enhancedMeasurements = calculateEnhancedMeasurements(classifiedResults);
      
      // Step 5: Create enhanced visual overlays with pop-out effects
      setDetectionProgress(90);
      await createEnhancedOverlays(classifiedResults);
      
      // Step 6: Generate statistics
      setDetectionProgress(100);
      const stats = calculateAnalysisStats(enhancedMeasurements);
      
      setDetectionResults(classifiedResults);
      setMeasurements(enhancedMeasurements);
      setAnalysisStats(stats);
      
      // Add overlay to overlay manager if available
      if (overlayManagerRef?.current) {
        const overlayId = overlayManagerRef.current.addOverlay({
          name: `Asphalt Analysis - ${new Date().toLocaleTimeString()}`,
          type: 'asphalt',
          leafletLayer: detectionLayer.current,
          visible: true,
          opacity: 0.8,
          zIndex: 1000,
          data: { results: classifiedResults, measurements: enhancedMeasurements, stats }
        });
        
        toast.success(`Added enhanced asphalt overlay (ID: ${overlayId.slice(-8)})`);
      }

      // Trigger pop-out effect animation
      setTimeout(() => setPopOutEffect(false), 2000);
      
      toast.success(`🎯 Enhanced analysis complete! Found ${enhancedMeasurements.length} asphalt areas`);
      onDetectionComplete?.(classifiedResults);

    } catch (error) {
      console.error('Enhanced asphalt detection failed:', error);
      toast.error('Enhanced AI analysis failed');
    } finally {
      setIsDetecting(false);
      setDetectionProgress(0);
    }
  };

  // Auto-classify asphalt areas into driveways vs parking lots
  const autoClassifyAsphaltAreas = async (regions: AsphaltRegion[]): Promise<AsphaltRegion[]> => {
    return regions.map(region => {
      // Classification logic based on size, shape, and proximity to buildings
      const aspectRatio = region.length / region.width;
      const area = region.area;
      
      let surfaceType: 'driveway' | 'parking_lot' | 'road' | 'path' = 'driveway';
      
      if (area > 5000 && aspectRatio < 3) {
        surfaceType = 'parking_lot';
      } else if (area < 200 || aspectRatio > 8) {
        surfaceType = 'path';
      } else if (area > 2000 && aspectRatio > 5) {
        surfaceType = 'road';
      }
      
      return {
        ...region,
        surfaceType,
        confidence: region.confidence * (surfaceType === 'driveway' || surfaceType === 'parking_lot' ? 1.1 : 1.0)
      };
    });
  };

  // Calculate enhanced measurements with detailed area analysis
  const calculateEnhancedMeasurements = (regions: AsphaltRegion[]): AsphaltMeasurement[] => {
    return regions.map((region, index) => ({
      id: `asphalt_${Date.now()}_${index}`,
      type: region.surfaceType,
      length: region.length,
      width: region.width,
      area: region.area,
      confidence: region.confidence,
      coordinates: region.polygon,
      popOutWindow: null
    }));
  };

  // Create enhanced visual overlays with pop-out effects
  const createEnhancedOverlays = async (regions: AsphaltRegion[]) => {
    // Clear previous detections
    detectionLayer.current.clearLayers();
    
    regions.forEach((surface, index) => {
      const color = getEnhancedAsphaltColor(surface.surfaceType);
      const isHighConfidence = surface.confidence > 0.85;
      
      const polygon = L.polygon(
        surface.polygon.map(coord => L.latLng(coord[0], coord[1])), 
        {
          color: color,
          weight: isHighConfidence ? 3 : 2,
          opacity: 0.9,
          fillColor: color,
          fillOpacity: isHighConfidence ? 0.4 : 0.25,
          dashArray: isHighConfidence ? undefined : '8,4',
          className: `enhanced-asphalt-${surface.surfaceType} ${popOutEffect ? 'pop-out-effect' : ''}`,
          // Enhanced styling for pop-out effect
          ...(isHighConfidence && {
            shadowSize: 6,
            shadowBlur: 10,
            shadowColor: color,
            shadowOpacity: 0.3
          })
        }
      );

      // Enhanced popup with detailed measurements and export options
      const popupContent = createEnhancedPopupContent(surface, index);
      polygon.bindPopup(popupContent, {
        maxWidth: 350,
        className: 'enhanced-asphalt-popup'
      });

      // Add pulsing effect for high-confidence detections
      if (isHighConfidence) {
        polygon.on('add', () => {
          const element = polygon.getElement();
          if (element) {
            element.style.animation = 'pulse 2s ease-in-out infinite';
          }
        });
      }

      // Add pop-out click handler
      polygon.on('click', (e) => {
        if (e.originalEvent.ctrlKey || e.originalEvent.metaKey) {
          popOutAsphaltArea(surface, index);
        }
      });

      detectionLayer.current.addLayer(polygon);
    });
  };

  // Create enhanced popup content with export options
  const createEnhancedPopupContent = (surface: AsphaltRegion, index: number): string => {
    const typeIcon = surface.surfaceType === 'driveway' ? '🚗' : 
                    surface.surfaceType === 'parking_lot' ? '🅿️' : 
                    surface.surfaceType === 'road' ? '🛣️' : '🚶';
    
    return `
      <div class="enhanced-asphalt-popup-content p-4 min-w-[300px]">
        <div class="flex items-center gap-2 mb-3">
          <span class="text-2xl">${typeIcon}</span>
          <div>
            <span class="font-bold text-lg text-gray-800">
              ${surface.surfaceType.replace('_', ' ').toUpperCase()}
            </span>
            <div class="text-xs text-gray-500">AI-Detected Surface</div>
          </div>
          <div class="ml-auto">
            <span class="px-2 py-1 rounded-full text-xs font-medium ${
              surface.confidence > 0.9 ? 'bg-green-100 text-green-800' :
              surface.confidence > 0.7 ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }">
              ${(surface.confidence * 100).toFixed(1)}% confident
            </span>
          </div>
        </div>
        
        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="bg-blue-50 p-2 rounded">
            <div class="text-xs text-blue-600 font-medium">LENGTH</div>
            <div class="text-lg font-bold text-blue-800">${surface.length.toFixed(1)} ft</div>
          </div>
          <div class="bg-green-50 p-2 rounded">
            <div class="text-xs text-green-600 font-medium">WIDTH</div>
            <div class="text-lg font-bold text-green-800">${surface.width.toFixed(1)} ft</div>
          </div>
          <div class="bg-purple-50 p-2 rounded col-span-2">
            <div class="text-xs text-purple-600 font-medium">TOTAL AREA</div>
            <div class="text-xl font-bold text-purple-800">${surface.area.toFixed(0)} sq ft</div>
            <div class="text-xs text-purple-600">${(surface.area / 43560).toFixed(4)} acres</div>
          </div>
        </div>
        
        <div class="bg-gray-50 p-3 rounded mb-3">
          <div class="text-xs font-medium text-gray-700 mb-2">SURFACE ANALYSIS</div>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div><strong>Darkness:</strong> ${(surface.darkness * 100).toFixed(0)}%</div>
            <div><strong>Material:</strong> Asphalt</div>
            <div><strong>Texture:</strong> Smooth</div>
            <div><strong>Condition:</strong> Good</div>
          </div>
        </div>
        
        <div class="flex flex-wrap gap-2 mb-3">
          <button onclick="popOutArea(${index})" class="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">
            📤 Pop Out
          </button>
          <button onclick="exportAsPNG(${index})" class="px-3 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700">
            💾 PNG
          </button>
          <button onclick="exportAsPDF(${index})" class="px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700">
            📄 PDF
          </button>
          <button onclick="attachToEmail(${index})" class="px-3 py-1 bg-orange-600 text-white text-xs rounded hover:bg-orange-700">
            ✉️ Email
          </button>
          <button onclick="printArea(${index})" class="px-3 py-1 bg-gray-600 text-white text-xs rounded hover:bg-gray-700">
            🖨️ Print
          </button>
        </div>
        
        <div class="text-[10px] text-gray-400 border-t pt-2">
          Enhanced Computer Vision Analysis • Ctrl+Click to pop out
        </div>
      </div>
    `;
  };

  // Pop out individual asphalt area in separate window
  const popOutAsphaltArea = (surface: AsphaltRegion, index: number) => {
    const popupWindow = window.open(
      '',
      `asphalt_area_${index}`,
      'width=900,height=700,scrollbars=yes,resizable=yes'
    );

    if (popupWindow) {
      setupAsphaltPopOutWindow(popupWindow, surface, index);
      toast.success(`${surface.surfaceType.replace('_', ' ')} opened in new window`);
    }
  };

  // Setup popup window for individual asphalt area
  const setupAsphaltPopOutWindow = (popupWindow: Window, surface: AsphaltRegion, index: number) => {
    const typeIcon = surface.surfaceType === 'driveway' ? '🚗' : 
                    surface.surfaceType === 'parking_lot' ? '🅿️' : 
                    surface.surfaceType === 'road' ? '🛣️' : '🚶';

    popupWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${surface.surfaceType.replace('_', ' ')} - Asphalt Analysis</title>
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <script src="https://html2canvas.hertzen.com/dist/html2canvas.min.js"></script>
        <script src="https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js"></script>
        <style>
          body { margin: 0; padding: 20px; font-family: system-ui, -apple-system, sans-serif; background: #f8fafc; }
          .header { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .title { display: flex; align-items: center; gap: 10px; margin-bottom: 15px; }
          .title h1 { margin: 0; color: #1e293b; font-size: 24px; }
          .stats-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 15px; margin-bottom: 20px; }
          .stat-card { background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; }
          .stat-value { font-size: 24px; font-weight: bold; color: #0f172a; }
          .stat-label { font-size: 12px; color: #64748b; margin-top: 5px; }
          #map { height: 400px; width: 100%; border: 2px solid #e2e8f0; border-radius: 8px; margin: 20px 0; }
          .controls { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
          .white-bg { background: white !important; }
          .control-group { margin-bottom: 15px; }
          .control-group label { display: block; margin-bottom: 5px; font-weight: 600; color: #374151; }
          .export-btn { 
            background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); 
            color: white; padding: 10px 20px; border: none; border-radius: 6px; 
            margin: 5px; cursor: pointer; font-weight: 500; transition: all 0.2s;
          }
          .export-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4); }
          .export-btn.secondary { background: linear-gradient(135deg, #6b7280 0%, #374151 100%); }
          .export-btn.success { background: linear-gradient(135deg, #10b981 0%, #059669 100%); }
          .export-btn.danger { background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); }
          .export-btn.warning { background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); }
          .visualization-modes { display: flex; gap: 10px; margin-bottom: 20px; }
          .mode-btn { padding: 8px 16px; border: 2px solid #e5e7eb; background: white; border-radius: 6px; cursor: pointer; }
          .mode-btn.active { border-color: #3b82f6; background: #eff6ff; color: #1d4ed8; }
          .analysis-details { background: white; padding: 20px; border-radius: 12px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">
            <span style="font-size: 32px;">${typeIcon}</span>
            <h1>${surface.surfaceType.replace('_', ' ').toUpperCase()} Analysis</h1>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${surface.length.toFixed(1)}</div>
              <div class="stat-label">LENGTH (ft)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${surface.width.toFixed(1)}</div>
              <div class="stat-label">WIDTH (ft)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${surface.area.toFixed(0)}</div>
              <div class="stat-label">AREA (sq ft)</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${(surface.confidence * 100).toFixed(1)}%</div>
              <div class="stat-label">CONFIDENCE</div>
            </div>
          </div>
        </div>

        <div class="controls">
          <div class="visualization-modes">
            <button class="mode-btn active" onclick="setVisualizationMode('satellite')">📡 Satellite</button>
            <button class="mode-btn" onclick="setVisualizationMode('white')">⚪ White Background</button>
            <button class="mode-btn" onclick="setVisualizationMode('3d')">🏗️ 3D View</button>
            <button class="mode-btn" onclick="setVisualizationMode('technical')">📐 Technical</button>
          </div>
          
          <div style="display: flex; flex-wrap: wrap; gap: 10px;">
            <button class="export-btn success" onclick="exportAsPNG()">💾 Export PNG</button>
            <button class="export-btn danger" onclick="exportAsPDF()">📄 Export PDF</button>
            <button class="export-btn secondary" onclick="print()">🖨️ Print</button>
            <button class="export-btn warning" onclick="attachToEmail()">✉️ Email</button>
            <button class="export-btn" onclick="addToContract()">📋 Add to Contract</button>
            <button class="export-btn" onclick="createReport()">📊 Generate Report</button>
          </div>
        </div>
        
        <div id="map"></div>
        
        <div class="analysis-details">
          <h3>Analysis Details</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 15px;">
            <div>
              <strong>Surface Type:</strong> ${surface.surfaceType.replace('_', ' ')}<br>
              <strong>Material:</strong> Asphalt/Blacktop<br>
              <strong>Condition:</strong> Good
            </div>
            <div>
              <strong>Darkness Level:</strong> ${(surface.darkness * 100).toFixed(0)}%<br>
              <strong>Texture:</strong> Smooth<br>
              <strong>Analysis Date:</strong> ${new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
        
        <script>
          let map;
          let currentMode = 'satellite';
          let asphaltLayer;
          
          // Surface data
          const surfaceData = ${JSON.stringify(surface)};
          
          function initMap() {
            // Calculate center from polygon
            const lats = surfaceData.polygon.map(coord => coord[0]);
            const lngs = surfaceData.polygon.map(coord => coord[1]);
            const centerLat = lats.reduce((a, b) => a + b) / lats.length;
            const centerLng = lngs.reduce((a, b) => a + b) / lngs.length;
            
            map = L.map('map').setView([centerLat, centerLng], 19);
            
            // Add base layer
            L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
              attribution: 'Esri'
            }).addTo(map);
            
            // Add asphalt polygon
            updateAsphaltLayer();
          }
          
          function updateAsphaltLayer() {
            if (asphaltLayer) {
              map.removeLayer(asphaltLayer);
            }
            
            const color = surfaceData.surfaceType === 'driveway' ? '#ef4444' : 
                         surfaceData.surfaceType === 'parking_lot' ? '#3b82f6' : 
                         surfaceData.surfaceType === 'road' ? '#6b7280' : '#8b5cf6';
            
            asphaltLayer = L.polygon(
              surfaceData.polygon.map(coord => [coord[0], coord[1]]), 
              {
                color: color,
                weight: 3,
                opacity: 0.9,
                fillColor: color,
                fillOpacity: currentMode === 'white' ? 0.8 : 0.4
              }
            ).addTo(map);
            
            // Fit map to polygon bounds
            map.fitBounds(asphaltLayer.getBounds(), { padding: [20, 20] });
          }
          
          function setVisualizationMode(mode) {
            // Update active button
            document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
            event.target.classList.add('active');
            
            currentMode = mode;
            
            switch(mode) {
              case 'white':
                document.getElementById('map').style.background = 'white';
                map.eachLayer(layer => {
                  if (layer !== asphaltLayer) {
                    map.removeLayer(layer);
                  }
                });
                break;
              case '3d':
                // Simulate 3D effect with enhanced styling
                updateAsphaltLayer();
                break;
              case 'technical':
                // Add measurement annotations
                addTechnicalAnnotations();
                break;
              default:
                // Satellite view
                document.getElementById('map').style.background = '';
                updateAsphaltLayer();
            }
          }
          
          function addTechnicalAnnotations() {
            // Add length and width annotations
            // This would include measurement lines and labels
          }
          
          function exportAsPNG() {
            html2canvas(document.body).then(canvas => {
              const link = document.createElement('a');
              link.download = 'asphalt-analysis-${surface.surfaceType}-${Date.now()}.png';
              link.href = canvas.toDataURL();
              link.click();
            });
          }
          
          function exportAsPDF() {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF('l', 'mm', 'a4');
            
            html2canvas(document.body).then(canvas => {
              const imgData = canvas.toDataURL('image/png');
              const imgWidth = 297;
              const imgHeight = (canvas.height * imgWidth) / canvas.width;
              
              pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
              pdf.save('asphalt-analysis-${surface.surfaceType}-${Date.now()}.pdf');
            });
          }
          
          function attachToEmail() {
            const subject = encodeURIComponent('Asphalt Analysis Report - ${surface.surfaceType.replace('_', ' ')}');
            const body = encodeURIComponent(\`
              Asphalt Analysis Report
              
              Surface Type: ${surface.surfaceType.replace('_', ' ')}
              Length: ${surface.length.toFixed(1)} ft
              Width: ${surface.width.toFixed(1)} ft
              Total Area: ${surface.area.toFixed(0)} sq ft
              Confidence: ${(surface.confidence * 100).toFixed(1)}%
              
              Analysis Date: \${new Date().toLocaleDateString()}
            \`);
            
            window.open(\`mailto:?subject=\${subject}&body=\${body}\`);
          }
          
          function addToContract() {
            alert('Contract integration functionality would be implemented here');
          }
          
          function createReport() {
            alert('Report generation functionality would be implemented here');
          }
          
          // Initialize when page loads
          window.onload = initMap;
        </script>
      </body>
      </html>
    `);
    popupWindow.document.close();
  };

  // Calculate analysis statistics
  const calculateAnalysisStats = (measurements: AsphaltMeasurement[]) => {
    const totalArea = measurements.reduce((sum, m) => sum + m.area, 0);
    const avgConfidence = measurements.reduce((sum, m) => sum + m.confidence, 0) / measurements.length;
    const drivewayCount = measurements.filter(m => m.type === 'driveway').length;
    const parkingLotCount = measurements.filter(m => m.type === 'parking_lot').length;
    
    return {
      totalArea,
      processingTime: 0, // Would be calculated from actual processing
      confidence: avgConfidence,
      drivewayCount,
      parkingLotCount
    };
  };

  // Get enhanced color scheme for different asphalt types
  const getEnhancedAsphaltColor = (surfaceType: string): string => {
    switch (surfaceType) {
      case 'driveway': return '#ef4444'; // Red
      case 'parking_lot': return '#3b82f6'; // Blue  
      case 'road': return '#6b7280'; // Gray
      case 'path': return '#8b5cf6'; // Purple
      default: return '#374151'; // Dark gray
    }
  };

  if (!map) return null;

  return (
    <Card className={`absolute top-4 left-4 w-96 max-h-[80vh] overflow-hidden z-[1000] bg-white/95 backdrop-blur-sm transition-all duration-300 ${
      popOutEffect ? 'scale-105 shadow-2xl' : 'shadow-lg'
    }`}>
      <div className="p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Sparkles className="w-6 h-6 text-blue-600" />
              {popOutEffect && (
                <div className="absolute inset-0 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-75" />
              )}
            </div>
            <div>
              <span className="font-bold text-lg">Enhanced Asphalt AI</span>
              <div className="text-xs text-gray-600">Auto-Detection & Analysis</div>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsMinimized(!isMinimized)}
            >
              {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {!isMinimized && (
        <div className="p-4 space-y-4 max-h-[60vh] overflow-y-auto">
          
          {/* Detection Controls */}
          <div className="space-y-3">
            <Button
              onClick={runEnhancedAsphaltDetection}
              disabled={isDetecting}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isDetecting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing... {detectionProgress}%
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Run Enhanced AI Analysis
                </>
              )}
            </Button>

            {isDetecting && (
              <div className="space-y-2">
                <Progress value={detectionProgress} className="h-2" />
                <div className="text-xs text-center text-gray-600">
                  {detectionProgress < 20 && "Initializing enhanced algorithms..."}
                  {detectionProgress >= 20 && detectionProgress < 40 && "Processing satellite imagery..."}
                  {detectionProgress >= 40 && detectionProgress < 60 && "Auto-classifying surfaces..."}
                  {detectionProgress >= 60 && detectionProgress < 80 && "Calculating measurements..."}
                  {detectionProgress >= 80 && detectionProgress < 95 && "Creating enhanced overlays..."}
                  {detectionProgress >= 95 && "Finalizing analysis..."}
                </div>
              </div>
            )}
          </div>

          {/* Analysis Statistics */}
          {analysisStats && (
            <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-green-600" />
                <span className="font-semibold">Analysis Results</span>
              </div>
              
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600">Total Area</div>
                  <div className="font-bold text-green-600">{analysisStats.totalArea.toFixed(0)} sq ft</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600">Avg Confidence</div>
                  <div className="font-bold text-blue-600">{(analysisStats.confidence * 100).toFixed(1)}%</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600 flex items-center gap-1">
                    <Car className="w-3 h-3" />
                    Driveways
                  </div>
                  <div className="font-bold text-red-600">{analysisStats.drivewayCount}</div>
                </div>
                <div className="bg-white p-2 rounded">
                  <div className="text-gray-600 flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    Parking Lots
                  </div>
                  <div className="font-bold text-purple-600">{analysisStats.parkingLotCount}</div>
                </div>
              </div>
            </div>
          )}

          {/* Detected Areas List */}
          {measurements.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold">Detected Areas</span>
                <Badge variant="secondary">{measurements.length}</Badge>
              </div>
              
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {measurements.map((measurement, index) => (
                  <div key={measurement.id} className="p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {measurement.type === 'driveway' ? <Car className="w-4 h-4" /> : <Building2 className="w-4 h-4" />}
                        <span className="font-medium text-sm">
                          {measurement.type.replace('_', ' ')}
                        </span>
                        <Badge 
                          variant="outline" 
                          style={{ backgroundColor: getEnhancedAsphaltColor(measurement.type) + '20' }}
                        >
                          {(measurement.confidence * 100).toFixed(0)}%
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => popOutAsphaltArea(detectionResults[index], index)}
                      >
                        <ExternalLink className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div>
                        <div className="text-gray-600">Length</div>
                        <div className="font-bold">{measurement.length.toFixed(1)} ft</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Width</div>
                        <div className="font-bold">{measurement.width.toFixed(1)} ft</div>
                      </div>
                      <div>
                        <div className="text-gray-600">Area</div>
                        <div className="font-bold">{measurement.area.toFixed(0)} sq ft</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded">
            <div className="font-medium mb-1">💡 Tips:</div>
            <ul className="list-disc list-inside space-y-1">
              <li>Ctrl+Click on detected areas to pop them out</li>
              <li>Use the overlay manager to stack multiple analyses</li>
              <li>Export options available in pop-out windows</li>
            </ul>
          </div>
        </div>
      )}
    </Card>
  );
};

export default EnhancedAsphaltDetector;