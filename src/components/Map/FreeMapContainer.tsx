import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';

// Fix for default markers in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
    <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface FreeMapContainerProps {
  onMeasurement?: (measurement: { distance?: number; area?: number }) => void;
  activeTool?: string;
  mapService?: string;
}

const FreeMapContainer: React.FC<FreeMapContainerProps> = ({ 
  onMeasurement, 
  activeTool,
  mapService = 'leaflet-osm'
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<L.TileLayer | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());

  // Patrick County, VA coordinates
  const patrickCountyCenter: [number, number] = [36.6837, -80.2876];

  // Map tile providers
  const getTileLayer = (serviceId: string): L.TileLayer => {
    const providers: Record<string, { url: string; attribution: string; maxZoom?: number }> = {
      'leaflet-osm': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      },
      'maplibre': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      },
      'openlayers': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors', 
        maxZoom: 19
      },
      'locationiq': {
        url: 'https://tiles.locationiq.com/v3/streets/r/{z}/{x}/{y}.png?key=YOUR_LOCATIONIQ_KEY',
        attribution: '© LocationIQ, © OpenStreetMap contributors',
        maxZoom: 18
      },
      'jawg': {
        url: 'https://tile.jawg.io/jawg-streets/{z}/{x}/{y}.png?access-token=YOUR_JAWG_TOKEN',
        attribution: '© Jawg, © OpenStreetMap contributors',
        maxZoom: 18
      },
      'carto': {
        url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
        attribution: '© CARTO, © OpenStreetMap contributors',
        maxZoom: 18
      }
    };

    const provider = providers[serviceId] || providers['leaflet-osm'];
    
    return L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom || 18
    });
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on Patrick County, VA
    map.current = L.map(mapContainer.current, {
      center: patrickCountyCenter,
      zoom: 11,
      zoomControl: true
    });

    // Add initial tile layer
    const initialLayer = getTileLayer(mapService);
    initialLayer.addTo(map.current);
    setCurrentLayer(initialLayer);

    // Add drawn items layer
    drawnItems.current.addTo(map.current);

    // Add scale control
    L.control.scale({
      imperial: true,
      metric: false,
      position: 'bottomleft'
    }).addTo(map.current);

    // Set map bounds to focus on Patrick County area
    const bounds = L.latLngBounds(
      L.latLng(36.0, -81.5), // Southwest corner
      L.latLng(37.2, -79.5)  // Northeast corner
    );
    map.current.setMaxBounds(bounds);

    setMapLoaded(true);
    toast.success(`Map loaded with ${mapService === 'leaflet-osm' ? 'OpenStreetMap' : mapService}! Focused on Patrick County, VA region`);

    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update tile layer when map service changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (currentLayer) {
      map.current.removeLayer(currentLayer);
    }

    const newLayer = getTileLayer(mapService);
    newLayer.addTo(map.current);
    setCurrentLayer(newLayer);

    toast.success(`Switched to ${mapService === 'leaflet-osm' ? 'OpenStreetMap' : mapService}`);
  }, [mapService, mapLoaded]);

  const clearDrawings = () => {
    if (drawnItems.current) {
      drawnItems.current.clearLayers();
      toast.success('All drawings cleared');
    }
  };

  const exportData = () => {
    if (drawnItems.current) {
      const data = drawnItems.current.toGeoJSON();
      const dataStr = JSON.stringify(data, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'measurements.geojson';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Measurements exported as GeoJSON');
    }
  };

  const addMarker = (latlng: L.LatLng) => {
    const marker = L.marker(latlng).addTo(drawnItems.current);
    marker.bindPopup('Sample location marker');
  };

  // Handle map clicks for drawing
  useEffect(() => {
    if (!map.current) return;

    const handleMapClick = (e: L.LeafletMouseEvent) => {
      if (activeTool === 'point') {
        addMarker(e.latlng);
      }
    };

    map.current.on('click', handleMapClick);

    return () => {
      if (map.current) {
        map.current.off('click', handleMapClick);
      }
    };
  }, [activeTool]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="w-full h-full" />
      
      {/* Floating action buttons */}
      <div className="absolute bottom-4 right-4 flex flex-col gap-2">
        <button
          onClick={clearDrawings}
          className="bg-gis-toolbar hover:bg-gis-panel text-foreground p-2 rounded-lg shadow-floating transition-fast"
          title="Clear all drawings"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <button
          onClick={exportData}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 rounded-lg shadow-floating transition-fast"
          title="Export measurements"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Service info overlay */}
      <div className="absolute top-4 left-4 bg-gis-panel/90 backdrop-blur-sm p-3 rounded-lg shadow-panel max-w-xs">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-sm font-medium text-foreground">
            {mapService === 'leaflet-osm' ? 'OpenStreetMap' : mapService}
          </span>
          <span className="text-xs text-green-600 font-medium px-1.5 py-0.5 bg-green-100 rounded">
            FREE
          </span>
        </div>
        <p className="text-xs text-muted-foreground">
          No API key required • Open source mapping
        </p>
      </div>
    </div>
  );
};

export default FreeMapContainer;