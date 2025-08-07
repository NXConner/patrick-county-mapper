import React, { useState, useRef, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MapServiceDropdown from '@/components/Map/MapServiceDropdown';
import AddressSearchBar from '@/components/Map/AddressSearchBar';
import { MapPinIcon, Navigation, Globe, Signal, Wifi, Zap, Shield, Star, Layers, FileText } from 'lucide-react';
import { useGpsLocation } from '@/hooks/useGpsLocation';

// Lazy load heavy components
const FreeMapContainer = lazy(() => import('@/components/Map/FreeMapContainer'));
const MeasurementToolbar = lazy(() => import('@/components/Toolbar/MeasurementToolbar'));
const PropertyPanel = lazy(() => import('@/components/PropertyInfo/PropertyPanel'));
const AsphaltDetector = lazy(() => import('@/components/Map/AsphaltDetector'));
const EnhancedAsphaltDetector = lazy(() => import('@/components/Map/EnhancedAsphaltDetector'));
const OverlayManager = lazy(() => import('@/components/Map/OverlayManager'));

const ServiceInfo = lazy(() => import('@/components/ServiceInfo/ServiceInfo'));

const Index = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [currentMeasurement, setCurrentMeasurement] = useState<{ distance?: number; area?: number }>();
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [selectedMapService, setSelectedMapService] = useState('esri-satellite');
  const [layerStates, setLayerStates] = useState({
    satellite: true,
    roads: true,
    labels: true,
    property: false
  });

  const [showAsphaltDetector, setShowAsphaltDetector] = useState(false);


  // Map reference for communication with map component
  const mapRef = useRef(null);
  const overlayManagerRef = useRef(null);
  
  // GPS location hook
  const { location: gpsLocation, isLoading: gpsLoading, requestLocation, isSupported: gpsSupported } = useGpsLocation(true);

  const handleMeasurement = (measurement: { distance?: number; area?: number }) => {
    setCurrentMeasurement(measurement);
  };

  const handleLocationSearch = (lat: number, lng: number, address: string) => {
    // This will be handled by the map component
    if (mapRef.current && mapRef.current.handleLocationSearch) {
      mapRef.current.handleLocationSearch(lat, lng, address);
    }
  };

  const handleLayerToggle = (layerId: string) => {
    // Toggle layer in map component
    if (mapRef.current && mapRef.current.toggleLayer) {
      mapRef.current.toggleLayer(layerId);
      
      // Update local state
      setLayerStates(prev => ({
        ...prev,
        [layerId]: !prev[layerId]
      }));
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gis-satellite safe-area-inset-top safe-area-inset-left safe-area-inset-right">
      {/* Enhanced Header */}
      <div className="toolbar-enhanced z-50 flex-shrink-0">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Top row - Enhanced with better visual hierarchy */}
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-primary to-primary/80 rounded-xl flex items-center justify-center flex-shrink-0 shadow-success hover:shadow-glow transition-all duration-300 hover:scale-105">
                  <Globe className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-base sm:text-lg lg:text-xl font-bold text-foreground truncate">
                    Patrick County GIS Pro
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
                    High-resolution mapping & measurement tools
                  </p>
                </div>
              </div>
            </div>
            
            {/* Enhanced Status Indicators */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-full">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="hidden xs:inline text-xs font-medium text-green-600">Live</span>
                <span className="hidden sm:inline text-xs font-medium text-green-600">Data</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
                <Signal className="w-3 h-3 text-blue-600" />
                <span className="hidden sm:inline text-xs font-medium text-blue-600">Connected</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-full">
                <Zap className="w-3 h-3 text-purple-600" />
                <span className="hidden sm:inline text-xs font-medium text-purple-600">AI Ready</span>
              </div>
            </div>
          </div>

          {/* Bottom row - Enhanced Search and Controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4 lg:gap-6">
            <div className="flex-1 max-w-full sm:max-w-md">
              <AddressSearchBar onLocationSelect={handleLocationSearch} />
            </div>
            <div className="flex items-center gap-3 justify-between sm:justify-end">
              <MapServiceDropdown
                selectedService={selectedMapService}
                onServiceChange={setSelectedMapService}
                className="min-w-[140px] sm:min-w-[160px] lg:min-w-[200px]"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (gpsLocation && mapRef.current?.centerOnGpsLocation) {
                    mapRef.current.centerOnGpsLocation();
                  } else {
                    requestLocation();
                  }
                }}
                disabled={!gpsSupported || gpsLoading}
                className="btn-secondary-enhanced flex items-center gap-2 text-xs hover:shadow-panel"
                title={gpsSupported ? "Find my location" : "Location not supported"}
              >
                <Navigation className={`w-4 h-4 ${gpsLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">
                  {gpsLoading ? 'Locating...' : 'Locate Me'}
                </span>
              </Button>
              <div className="hidden xl:flex items-center gap-2 text-xs text-muted-foreground max-w-xs">
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3" />
                  <span>Patrick County, VA</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  <span>Carroll, Floyd, Franklin, Henry</span>
                </div>
                <span>+</span>
                <div className="flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  <span>Stokes & Surry Counties, NC</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-4">
              <div className="spinner-enhanced"></div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">Loading Patrick County GIS Pro...</p>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Wifi className="w-3 h-3" />
                  <span>Connecting to mapping services</span>
                </div>
              </div>
            </div>
          </div>
        }>
          {/* Map Component */}
          <FreeMapContainer
            ref={mapRef}
            activeTool={activeTool}
            onMeasurement={handleMeasurement}
            onPropertySelect={(property) => {
              setSelectedProperty(property);
              setPropertyPanelOpen(true);
            }}
            mapService={selectedMapService}
            layerStates={layerStates}
            onLayerToggle={handleLayerToggle}
            gpsLocation={gpsLocation}
          />


          {showAsphaltDetector && (
            <EnhancedAsphaltDetector 
              map={mapRef.current?.getMap?.() || null}
              onDetectionComplete={(results) => {
                console.log('Enhanced asphalt detection results:', results);
                toast.success(`Enhanced AI analysis complete: ${results.length} surfaces detected`, {
                  description: "Advanced computer vision analysis with measurements and cost estimates"
                });
              }}
              onClose={() => setShowAsphaltDetector(false)}
            />
          )}

          {/* Enhanced Measurement Tools */}
          <MeasurementToolbar
            activeTool={activeTool}
            onToolChange={setActiveTool}
            currentMeasurement={currentMeasurement}
            layerStates={layerStates}
            onLayerToggle={handleLayerToggle}
            onAsphaltDetection={() => setShowAsphaltDetector(!showAsphaltDetector)}
            showAsphaltDetector={showAsphaltDetector}

          />
          
          {/* Enhanced Property Information Panel */}
          <PropertyPanel
            isOpen={propertyPanelOpen}
            onToggle={() => setPropertyPanelOpen(!propertyPanelOpen)}
            propertyInfo={{
              parcelId: "Sample-123",
              owner: "John Doe",
              address: "123 Main St, Stuart, VA",
              acreage: 2.5,
              taxValue: 150000,
              zoning: "Residential"
            }}
          />
        </Suspense>
      </div>
    </div>
  );
};

export default Index;
