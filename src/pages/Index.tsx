import React, { useState } from 'react';
import FreeMapContainer from '@/components/Map/FreeMapContainer';
import MapServiceDropdown from '@/components/Map/MapServiceDropdown';
import MeasurementToolbar from '@/components/Toolbar/MeasurementToolbar';
import PropertyPanel from '@/components/PropertyInfo/PropertyPanel';

const Index = () => {
  const [activeTool, setActiveTool] = useState('select');
  const [currentMeasurement, setCurrentMeasurement] = useState<{ distance?: number; area?: number }>();
  const [propertyPanelOpen, setPropertyPanelOpen] = useState(false);
  const [selectedMapService, setSelectedMapService] = useState('leaflet-osm');

  const handleMeasurement = (measurement: { distance?: number; area?: number }) => {
    setCurrentMeasurement(measurement);
  };

  return (
    <div className="h-screen w-full relative overflow-hidden bg-gis-satellite">
      {/* Main Map Container */}
      <FreeMapContainer 
        onMeasurement={handleMeasurement}
        activeTool={activeTool}
        mapService={selectedMapService}
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
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 bg-gradient-toolbar backdrop-blur-sm border-b border-border/20 z-10">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V7.618a1 1 0 01.553-.894L9 4l6 3 5.447-2.724A1 1 0 0121 5.176v8.764a1 1 0 01-.553.894L15 17l-6-3z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-foreground">Patrick County GIS Pro</h1>
                <p className="text-xs text-muted-foreground">High-resolution mapping & measurement tools</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4 flex-wrap">
            <MapServiceDropdown
              selectedService={selectedMapService}
              onServiceChange={setSelectedMapService}
              className="min-w-[180px] md:min-w-[200px]"
            />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                Live Data
              </div>
              <span className="hidden sm:inline">•</span>
              <span className="hidden sm:inline">Patrick County, VA + Surrounding Areas</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
