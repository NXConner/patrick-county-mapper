import React, { useState, useRef } from 'react';
import FreeMapContainer from '@/components/Map/FreeMapContainer';
import MapServiceDropdown from '@/components/Map/MapServiceDropdown';
import MeasurementToolbar from '@/components/Toolbar/MeasurementToolbar';
import PropertyPanel from '@/components/PropertyInfo/PropertyPanel';
import AddressSearchBar from '@/components/Map/AddressSearchBar';

const Index = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [currentMeasurement, setCurrentMeasurement] = useState<{ distance?: number; area?: number }>();
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [selectedMapService, setSelectedMapService] = useState('esri-satellite');
  const mapRef = useRef<any>(null);

  const handleMeasurement = (measurement: { distance?: number; area?: number }) => {
    setCurrentMeasurement(measurement);
  };

  const handleLocationSearch = (lat: number, lng: number, address: string) => {
    // This will be handled by the map component
    if (mapRef.current && mapRef.current.handleLocationSearch) {
      mapRef.current.handleLocationSearch(lat, lng, address);
    }
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gis-satellite">
      {/* Header */}
      <div className="bg-gradient-toolbar backdrop-blur-sm border-b border-border/20 z-50 flex-shrink-0">
        <div className="px-3 sm:px-6 py-2 sm:py-3">
          {/* Top row */}
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 sm:w-8 sm:h-8 bg-primary rounded-lg flex items-center justify-center">
                  <svg className="w-3 h-3 sm:w-5 sm:h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.176v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-sm sm:text-lg font-bold text-foreground">Patrick County GIS Pro</h1>
                  <p className="text-[10px] sm:text-xs text-muted-foreground hidden sm:block">High-resolution mapping & measurement tools</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-1 sm:gap-2 text-[10px] sm:text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-primary rounded-full animate-pulse"></div>
                <span className="hidden sm:inline">Live Data</span>
              </div>
            </div>
          </div>

          {/* Bottom row - Search and controls */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4">
            <div className="flex-1 max-w-md">
              <AddressSearchBar onLocationSelect={handleLocationSearch} />
            </div>
            <div className="flex items-center gap-2 justify-between sm:justify-end">
              <MapServiceDropdown
                selectedService={selectedMapService}
                onServiceChange={setSelectedMapService}
                className="min-w-[140px] sm:min-w-[180px]"
              />
              <div className="hidden lg:block text-[10px] text-muted-foreground">
                Patrick County, VA + Carroll, Floyd, Franklin, Henry Counties + Stokes & Surry Counties, NC
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Main Map Container */}
        <FreeMapContainer 
          onMeasurement={handleMeasurement}
          activeTool={activeTool}
          mapService={selectedMapService}
          ref={mapRef}
        />
        
        {/* Measurement Toolbar */}
        <MeasurementToolbar
          activeTool={activeTool}
          onToolChange={setActiveTool}
          currentMeasurement={currentMeasurement}
        />
        
        {/* Property Information Panel */}
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
      </div>
    </div>
  );
};

export default Index;
