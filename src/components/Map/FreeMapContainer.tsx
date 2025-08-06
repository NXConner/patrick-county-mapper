import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
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
  onLocationSearch?: (lat: number, lng: number, address: string) => void;
  selectedMapService?: string;
  layerStates?: any;
  onLayerToggle?: (layerId: string) => void;
  onPropertySelect?: (property: any) => void;
}

interface FreeMapContainerRef {
  handleLocationSearch: (lat: number, lng: number, address: string) => void;
  toggleLayer: (layerId: string) => void;
  getLayerStates: () => { satellite: boolean; roads: boolean; labels: boolean; property: boolean };
  getMap: () => L.Map | null;
}

const FreeMapContainer = forwardRef<FreeMapContainerRef, FreeMapContainerProps>(({ 
  onMeasurement, 
  activeTool,
  mapService = 'esri-satellite',
  onLocationSearch
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [currentLayer, setCurrentLayer] = useState<L.TileLayer | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const searchMarker = useRef<L.Marker | null>(null);

  // Layer state management
  const [layerStates, setLayerStates] = useState({
    satellite: true,
    roads: true,
    labels: true,
    property: false
  });

  const [propertyLoading, setPropertyLoading] = useState(false);

  // Layer references
  const roadsLayer = useRef<L.TileLayer | null>(null);
  const labelsLayer = useRef<L.TileLayer | null>(null);
  const propertyLayer = useRef<L.GeoJSON | null>(null);

  // Expanded coverage area including all surrounding counties
  const coverageCenter: [number, number] = [36.6837, -80.2876]; // Patrick County center
  
  // Handle location search from address search bar
  const handleLocationSearch = (lat: number, lng: number, address: string) => {
    if (!map.current) return;

    // Remove previous search marker
    if (searchMarker.current) {
      map.current.removeLayer(searchMarker.current);
    }

    // Create new search marker
    const marker = L.marker([lat, lng], {
      icon: L.divIcon({
        html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#10b981" stroke="#ffffff" stroke-width="2"/>
          <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
        </svg>`,
        className: 'search-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      })
    }).addTo(map.current);

    searchMarker.current = marker;

    // Add popup with address
    marker.bindPopup(`
      <div class="p-2">
        <div class="font-semibold text-sm">Search Result</div>
        <div class="text-xs text-gray-600 mt-1">${address}</div>
      </div>
    `).openPopup();

    // Pan to location
    map.current.setView([lat, lng], 16);

    // Call parent callback if provided
    if (onLocationSearch) {
      onLocationSearch(lat, lng, address);
    }
  };

  // Create overlay layers
  const createOverlayLayers = () => {
    // Roads overlay using CartoDB Positron (roads only) 
    roadsLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '© CARTO, © OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.7,
      className: 'roads-overlay'
    });

    // Labels overlay using CartoDB Labels
    labelsLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '© CARTO, © OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.8,
      className: 'labels-overlay'
    });
  };

  // Toggle layer visibility
  const toggleLayer = (layerId: string) => {
    if (!map.current) return;

    const newStates = { ...layerStates, [layerId]: !layerStates[layerId] };
    setLayerStates(newStates);

    switch (layerId) {
      case 'roads':
        if (newStates.roads && roadsLayer.current) {
          roadsLayer.current.addTo(map.current);
        } else if (roadsLayer.current) {
          map.current.removeLayer(roadsLayer.current);
        }
        break;
      
      case 'labels':
        if (newStates.labels && labelsLayer.current) {
          labelsLayer.current.addTo(map.current);
        } else if (labelsLayer.current) {
          map.current.removeLayer(labelsLayer.current);
        }
        break;
        
      case 'satellite':
        // Toggle base satellite layer
        if (currentLayer) {
          if (newStates.satellite) {
            currentLayer.setOpacity(1);
          } else {
            currentLayer.setOpacity(0.3);
          }
        }
        break;
        
      case 'property':
        if (newStates.property) {
          // Load property boundaries if not already loaded
          if (!propertyLayer.current) {
            loadPropertyBoundaries();
          } else if (map.current) {
            propertyLayer.current.addTo(map.current);
          }
        } else if (propertyLayer.current && map.current) {
          map.current.removeLayer(propertyLayer.current);
        }
        break;
    }

    toast.success(`${layerId.charAt(0).toUpperCase() + layerId.slice(1)} layer ${newStates[layerId] ? 'enabled' : 'disabled'}`);
  };

  // Expose layer controls to parent components
  useImperativeHandle(ref, () => ({
    handleLocationSearch,
    toggleLayer,
    getLayerStates: () => layerStates,
    getMap: () => map.current
  }), [layerStates]);

  // Patrick County, VA coordinates
  const patrickCountyCenter: [number, number] = [36.6837, -80.2876];

  // Map tile providers
  const getTileLayer = (serviceId: string): L.TileLayer => {
    const providers: Record<string, { url: string; attribution: string; maxZoom?: number }> = {
      'esri-satellite': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 20
      },
      'leaflet-osm': {
        url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        attribution: '© OpenStreetMap contributors',
        maxZoom: 19
      },
      'maplibre': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 20
      },
      'openlayers': {
        url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        attribution: '© Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 20
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
      },
      'google-satellite': {
        url: 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}',
        attribution: '© Google',
        maxZoom: 20
      },
      'bing-satellite': {
        url: 'https://ecn.t3.tiles.virtualearth.net/tiles/a{q}.jpeg?g=1',
        attribution: '© Microsoft Bing',
        maxZoom: 19
      }
    };

    const provider = providers[serviceId] || providers['esri-satellite'];
    
    return L.tileLayer(provider.url, {
      attribution: provider.attribution,
      maxZoom: provider.maxZoom || 18
    });
  };

  // Load property boundaries (building footprints as property indicators)
  const loadPropertyBoundaries = async () => {
    try {
      if (!map.current) return;
      
      setPropertyLoading(true);
      toast.info('Loading property boundaries...');

      // Use Overpass API to get building outlines for the current view
      const bounds = map.current.getBounds();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();

      const overpassQuery = `
        [out:json][timeout:25];
        (
          way["building"](${south},${west},${north},${east});
          relation["building"](${south},${west},${north},${east});
        );
        out geom;
      `;

      const overpassUrl = 'https://overpass-api.de/api/interpreter';
      const response = await fetch(overpassUrl, {
        method: 'POST',
        body: overpassQuery
      });

      if (!response.ok) {
        throw new Error('Property data service unavailable');
      }

      const data = await response.json();
      
      // Convert Overpass data to GeoJSON
      const geojsonFeatures = data.elements
        .filter(element => element.type === 'way' && element.geometry)
        .map(element => ({
          type: 'Feature',
          properties: {
            id: element.id,
            building: element.tags?.building || 'yes',
            addr_street: element.tags?.['addr:street'],
            addr_housenumber: element.tags?.['addr:housenumber']
          },
          geometry: {
            type: 'Polygon',
            coordinates: [element.geometry.map(coord => [coord.lon, coord.lat])]
          }
        }));

      const geojson = {
        type: 'FeatureCollection',
        features: geojsonFeatures
      };

      // Remove existing property layer
      if (propertyLayer.current && map.current.hasLayer(propertyLayer.current)) {
        map.current.removeLayer(propertyLayer.current);
      }

      // Create new property layer
      propertyLayer.current = L.geoJSON(geojson as any, {
        style: {
          color: '#ff6b35',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ff6b35',
          fillOpacity: 0.1,
          dashArray: '5,5',
          className: 'property-boundary'
        },
        onEachFeature: (feature, layer) => {
          const props = feature.properties;
          const address = props.addr_street && props.addr_housenumber 
            ? `${props.addr_housenumber} ${props.addr_street}`
            : 'Building';
          
          layer.bindPopup(`
            <div class="p-2">
              <div class="font-semibold text-sm">Property Boundary</div>
              <div class="text-xs text-gray-600 mt-1">${address}</div>
              <div class="text-xs text-gray-500">Building ID: ${props.id}</div>
            </div>
          `);
        }
      });

      if (layerStates.property) {
        propertyLayer.current.addTo(map.current);
      }

      toast.success(`Loaded ${geojsonFeatures.length} property boundaries`);

    } catch (error) {
      console.error('Error loading property boundaries:', error);
      toast.error('Property boundaries temporarily unavailable');
    } finally {
      setPropertyLoading(false);
    }
  };

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Initialize map centered on Patrick County, VA
    map.current = L.map(mapContainer.current, {
      center: coverageCenter,
      zoom: 10, // Zoom out slightly to show more area
      zoomControl: true
    });

    // Add initial tile layer
    const initialLayer = getTileLayer(mapService);
    initialLayer.addTo(map.current);
    setCurrentLayer(initialLayer);

    // Add drawn items layer
    drawnItems.current.addTo(map.current);

    // Create and add overlay layers
    createOverlayLayers();
    
    // Add initial overlay layers based on state
    if (layerStates.roads && roadsLayer.current) {
      roadsLayer.current.addTo(map.current);
    }
    if (layerStates.labels && labelsLayer.current) {
      labelsLayer.current.addTo(map.current);
    }

    // Add scale control
    L.control.scale({
      imperial: true,
      metric: false,
      position: 'bottomleft'
    }).addTo(map.current);

    // Expanded map bounds to include all surrounding counties:
    // Patrick County and surrounding: Carroll, Floyd, Franklin, Henry, Stokes County NC, Surry County NC
    const bounds = L.latLngBounds(
      L.latLng(35.8, -81.8), // Southwest corner (includes Surry County, NC)
      L.latLng(37.3, -79.2)  // Northeast corner (includes Franklin & Floyd Counties)
    );
    map.current.setMaxBounds(bounds);

    setMapLoaded(true);
    toast.success(`Map loaded with ${mapService === 'esri-satellite' ? 'ESRI World Imagery (Satellite)' : mapService}! Covering Patrick County, VA + surrounding areas`);

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

    toast.success(`Switched to ${mapService === 'esri-satellite' ? 'ESRI World Imagery (Satellite)' : mapService}`);
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
      <div ref={mapContainer} className="w-full h-full z-10" />
      
      {/* Floating action buttons */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={clearDrawings}
          className="bg-gis-toolbar hover:bg-gis-panel text-foreground p-2 sm:p-3 rounded-lg shadow-floating transition-fast"
          title="Clear all drawings"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
        
        <button
          onClick={exportData}
          className="bg-primary hover:bg-primary/90 text-primary-foreground p-2 sm:p-3 rounded-lg shadow-floating transition-fast"
          title="Export measurements"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </button>
      </div>

      {/* Service info overlay */}
      <div className="absolute top-4 right-4 z-30 bg-gis-panel/90 backdrop-blur-sm p-2 sm:p-3 rounded-lg shadow-panel max-w-[180px] sm:max-w-xs">
        <div className="flex items-center gap-1 sm:gap-2 mb-1">
          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-green-500 rounded-full"></div>
          <span className="text-[10px] sm:text-xs font-medium text-foreground">
            {mapService === 'esri-satellite' ? 'ESRI Satellite' : mapService === 'leaflet-osm' ? 'OpenStreetMap' : mapService}
          </span>
          <span className="text-[8px] sm:text-[10px] text-green-600 font-medium px-1 py-0.5 bg-green-100 rounded">
            FREE
          </span>
        </div>
        <p className="text-[8px] sm:text-[10px] text-muted-foreground">
          {mapService === 'esri-satellite' ? 'High-res satellite imagery' : 'Open source mapping'}
        </p>
      </div>
    </div>
  );
});

export default FreeMapContainer;