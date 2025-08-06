import React, { useState, useRef, Suspense, lazy } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import MapServiceDropdown from '@/components/Map/MapServiceDropdown';
import AddressSearchBar from '@/components/Map/AddressSearchBar';
import { MapPinIcon, Navigation } from 'lucide-react';
import { useGpsLocation } from '@/hooks/useGpsLocation';

// Lazy load heavy components
const FreeMapContainer = lazy(() => import('@/components/Map/FreeMapContainer'));
const MeasurementToolbar = lazy(() => import('@/components/Toolbar/MeasurementToolbar'));
const PropertyPanel = lazy(() => import('@/components/PropertyInfo/PropertyPanel'));
const AsphaltDetector = lazy(() => import('@/components/Map/AsphaltDetector'));
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
      {/* Enhanced Header with improved styling */}
      <div className="toolbar-gradient backdrop-blur-sm border-b border-border/20 z-50 flex-shrink-0 animate-[slide-up_0.5s_ease-out]">
        <div className="px-3 sm:px-4 lg:px-6 py-2 sm:py-3">
          {/* Top row with enhanced styling */}
          <div className="flex items-center justify-between mb-2 sm:mb-3">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-primary to-accent rounded-xl flex items-center justify-center flex-shrink-0 glow-effect animate-[float_3s_ease-in-out_infinite]">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.176v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="text-sm sm:text-base lg:text-lg font-bold text-foreground truncate bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text">
                    Patrick County GIS Pro
                  </h1>
                  <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block font-medium">
                    High-resolution mapping & measurement tools
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-muted-foreground flex-shrink-0">
              <div className="flex items-center gap-1 sm:gap-2 glass-effect px-2 py-1 rounded-md border border-border/30">
                <div className="w-2 h-2 bg-gradient-to-r from-primary to-accent rounded-full pulse-glow"></div>
                <span className="hidden xs:inline text-xs font-medium">Live</span>
                <span className="hidden sm:inline text-xs font-medium">Data</span>
              </div>
            </div>
          </div>

          {/* Enhanced Bottom row - Search and controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 lg:gap-4">
            <div className="flex-1 max-w-full sm:max-w-md">
              <AddressSearchBar onLocationSelect={handleLocationSearch} />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <MapServiceDropdown
                selectedService={selectedMapService}
                onServiceChange={setSelectedMapService}
                className="min-w-[120px] sm:min-w-[140px] lg:min-w-[180px]"
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
                className={`flex items-center gap-1 text-xs interactive-hover glass-effect border-primary/30 ${
                  gpsLocation ? 'bg-gradient-to-r from-gis-success/10 to-gis-success/5 text-gis-success' : ''
                }`}
                title={gpsSupported ? "Find my location" : "Location not supported"}
              >
                <Navigation className={`w-3 h-3 ${gpsLoading ? 'animate-spin' : gpsLocation ? 'text-gis-success' : ''}`} />
                <span className="hidden sm:inline font-medium">
                  {gpsLoading ? 'Locating...' : gpsLocation ? 'Located' : 'Locate Me'}
                </span>
              </Button>
              <div className="hidden xl:block text-xs text-muted-foreground max-w-xs truncate glass-effect px-3 py-1 rounded border border-border/30 font-medium">
                Patrick County, VA + Carroll, Floyd, Franklin, Henry Counties + Stokes & Surry Counties, NC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        <Suspense fallback={
          <div className="h-full w-full flex items-center justify-center bg-muted/20">
            <div className="flex flex-col items-center gap-3 animate-[scale-in_0.5s_ease-out]">
              <div className="relative">
                <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                <div className="absolute inset-0 w-8 h-8 border-2 border-primary/30 rounded-full animate-ping"></div>
              </div>
              <p className="text-sm text-muted-foreground font-medium animate-pulse">Loading map...</p>
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

          {/* Enhanced AI Asphalt Detection */}
          {showAsphaltDetector && (
            <div className="animate-[slide-up_0.4s_ease-out]">
              <AsphaltDetector 
                map={mapRef.current?.getMap?.() || null}
                onDetectionComplete={(results) => {
                  console.log('Asphalt detection results:', results);
                  toast.success(`AI analysis complete: ${results.length} surfaces detected`, {
                    description: "Check the map for highlighted asphalt areas"
                  });
                }}
              />
            </div>
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
