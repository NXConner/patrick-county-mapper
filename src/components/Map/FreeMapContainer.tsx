import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle, useCallback, useMemo } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { toast } from 'sonner';
import { idbGet, idbSet } from '@/lib/idbCache';
import 'esri-leaflet/dist/esri-leaflet';
import { COUNTY_SOURCES } from '@/data/countySources';

// Fix for default markers in Leaflet
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = L.divIcon({
  html: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" fill="#ef4444" stroke="#ffffff" stroke-width="2"/>
    <circle cx="12" cy="9" r="2.5" fill="#ffffff"/>
  </svg>`,
  className: 'custom-div-icon',
  iconSize: [24, 24],
  iconAnchor: [12, 24],
});

L.Marker.prototype.options.icon = DefaultIcon;

interface LayerStates {
  satellite: boolean;
  roads: boolean;
  labels: boolean;
  property: boolean;
  parcels?: boolean;
}

export interface PropertyInfo {
  parcelId: string;
  owner: string;
  address: string;
  acreage: number;
  taxValue: number;
  zoning: string;
  coordinates?: [number, number];
  area?: number;
}

export interface FreeMapContainerProps {
  onMeasurement?: (measurement: { distance?: number; area?: number }) => void;
  activeTool?: string;
  mapService?: string;
  onLocationSearch?: (lat: number, lng: number, address: string) => void;
  selectedMapService?: string;
  layerStates?: LayerStates;
  onLayerToggle?: (layerId: string) => void;
  onPropertySelect?: (property: PropertyInfo) => void;
  gpsLocation?: { latitude: number; longitude: number } | null;
}

export interface FreeMapContainerRef {
  handleLocationSearch: (lat: number, lng: number, address: string) => void;
  toggleLayer: (layerId: string) => void;
  getLayerStates: () => LayerStates;
  getMap: () => L.Map | null;
  centerOnGpsLocation: () => void;
}

const FreeMapContainer = forwardRef<FreeMapContainerRef, FreeMapContainerProps>(({ 
  onMeasurement, 
  activeTool,
  mapService = 'esri-satellite',
  onLocationSearch,
  gpsLocation
}, ref) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const currentLayerRef = useRef<L.TileLayer | null>(null);
  const drawnItems = useRef<L.FeatureGroup>(new L.FeatureGroup());
  const searchMarker = useRef<L.Marker | null>(null);
  const gpsMarker = useRef<L.Marker | null>(null);

  // Layer state management
  const [layerStates, setLayerStates] = useState({
    satellite: true,
    roads: true,
    labels: true,
    property: false,
    parcels: false
  });

  const [propertyLoading, setPropertyLoading] = useState(false);

  // Layer references
  const roadsLayer = useRef<L.TileLayer | null>(null);
  const labelsLayer = useRef<L.TileLayer | null>(null);
  const propertyLayer = useRef<L.GeoJSON | null>(null);
  const parcelsGroup = useRef<L.LayerGroup | null>(null);
  const overpassAbortController = useRef<AbortController | null>(null);

  // Expanded coverage area including all surrounding counties
  const coverageCenter = useMemo<[number, number]>(() => [36.6837, -80.2876], []); // Patrick County center
  const initialMapServiceRef = useRef(mapService);

  // Center map on GPS location and add/update GPS marker
  const centerOnGpsLocation = useCallback(() => {
    if (!map.current || !gpsLocation) return;

    const { latitude, longitude } = gpsLocation;

    // Remove previous GPS marker
    if (gpsMarker.current) {
      map.current.removeLayer(gpsMarker.current);
    }

    // Create GPS location marker with distinctive blue icon
    const marker = L.marker([latitude, longitude], {
      icon: L.divIcon({
        html: `<svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="8" fill="#3b82f6" stroke="#ffffff" stroke-width="3"/>
          <circle cx="12" cy="12" r="4" fill="#ffffff"/>
          <circle cx="12" cy="12" r="2" fill="#3b82f6"/>
        </svg>`,
        className: 'gps-marker-icon',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
      })
    }).addTo(map.current);

    gpsMarker.current = marker;

    // Add popup with GPS info
    marker.bindPopup(`
      <div class="p-2">
        <div class="font-semibold text-sm flex items-center gap-1">
          <svg class="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <circle cx="12" cy="12" r="3"></circle>
            <path d="m12 1 0 6m0 6 0 6m11-7-6 0m-6 0-6 0"></path>
          </svg>
          Your Location
        </div>
        <div class="text-xs text-gray-600 mt-1">
          Lat: ${latitude.toFixed(6)}<br/>
          Lng: ${longitude.toFixed(6)}
        </div>
      </div>
    `);

    // Center map on GPS location with appropriate zoom
    map.current.setView([latitude, longitude], 15);
  }, [gpsLocation]);

  // Handle location search from address search bar
  const handleLocationSearch = useCallback((lat: number, lng: number, address: string) => {
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
  }, [onLocationSearch]);

  // Create overlay layers
  const createOverlayLayers = useCallback(() => {
    // Roads overlay without labels (Carto light_nolabels)
    roadsLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}.png', {
      attribution: '© CARTO, © OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.7,
      className: 'roads-overlay'
    });

    // Labels overlay using CartoDB Labels only
    labelsLayer.current = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}.png', {
      attribution: '© CARTO, © OpenStreetMap contributors',
      maxZoom: 19,
      opacity: 0.8,
      className: 'labels-overlay'
    });

    // Parcels overlay (group) - endpoints will be added dynamically if available
    parcelsGroup.current = new L.LayerGroup();
  }, []);

  // Toggle layer visibility
  const toggleLayer = useCallback((layerId: string) => {
    if (!map.current) return;

    const newStates = { ...layerStates, [layerId]: !layerStates[layerId as keyof LayerStates] } as LayerStates;
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
        if (currentLayerRef.current) {
          if (newStates.satellite) {
            currentLayerRef.current.setOpacity(1);
          } else {
            currentLayerRef.current.setOpacity(0.3);
          }
        }
        break;
      case 'property':
        if (newStates.property) {
          if (!propertyLayer.current) {
            // defer to allow bounds to settle
            schedulePropertyBoundaryLoad();
          } else if (map.current) {
            propertyLayer.current.addTo(map.current);
          }
        } else {
          if (overpassAbortController.current) {
            overpassAbortController.current.abort();
            overpassAbortController.current = null;
          }
          if (propertyLayer.current && map.current) {
            map.current.removeLayer(propertyLayer.current);
          }
        }
        break;
      case 'parcels':
        if (newStates.parcels) {
          // Lazy-load configured county parcel layers (ArcGIS/WMS) if any portal endpoints are defined
          if (parcelsGroup.current && !map.current.hasLayer(parcelsGroup.current)) {
            parcelsGroup.current.addTo(map.current);
          }

          // Remove any existing layers in the group before re-adding
          if (parcelsGroup.current) {
            parcelsGroup.current.clearLayers();
          }

          let addedCount = 0;
          // Iterate configured sources and attach known parcel endpoints if present
          COUNTY_SOURCES.forEach((src) => {
            if (!parcelsGroup.current) return;
            const endpoint = src.parcelEndpoint;
            if (!endpoint) return;

            if (endpoint.type === 'arcgis') {
              // @ts-ignore esri-leaflet global factory
              const layer = (L as any).esri?.featureLayer({
                url: endpoint.url,
                pane: 'overlayPane',
                style: {
                  color: '#10b981',
                  weight: 1.5,
                  opacity: 0.8,
                  fillColor: '#10b981',
                  fillOpacity: 0.05
                }
              });
              if (layer) {
                parcelsGroup.current.addLayer(layer);
                addedCount += 1;
              }
            } else if (endpoint.type === 'wms') {
              const wms = L.tileLayer.wms(endpoint.url, {
                layers: endpoint.layers,
                format: 'image/png',
                transparent: true,
                opacity: 0.7
              });
              parcelsGroup.current.addLayer(wms);
              addedCount += 1;
            }
          });

          if (addedCount === 0) {
            toast.info('No county parcel services configured yet. External GIS links are available in the Sources tab.');
          }
        } else {
          if (parcelsGroup.current && map.current?.hasLayer(parcelsGroup.current)) {
            map.current.removeLayer(parcelsGroup.current);
          }
        }
        break;
    }

    toast.success(`${layerId.charAt(0).toUpperCase() + layerId.slice(1)} layer ${newStates[layerId as keyof LayerStates] ? 'enabled' : 'disabled'}`);
  }, [layerStates, schedulePropertyBoundaryLoad]);

  // Expose layer controls to parent components
  useImperativeHandle(ref, () => ({
    handleLocationSearch,
    toggleLayer,
    getLayerStates: () => layerStates,
    getMap: () => map.current,
    centerOnGpsLocation
  }), [handleLocationSearch, toggleLayer, centerOnGpsLocation, layerStates]);

  // Patrick County, VA coordinates
  const patrickCountyCenter: [number, number] = [36.6837, -80.2876];

  // Map tile providers
  const getTileLayer = useCallback((serviceId: string): L.TileLayer => {
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
  }, []);

  // Load property boundaries (building footprints as property indicators)
  const loadPropertyBoundaries = useCallback(async () => {
    try {
      if (!map.current) return;
      
      // Abort any previous request
      if (overpassAbortController.current) {
        overpassAbortController.current.abort();
      }
      overpassAbortController.current = new AbortController();
      const signal = overpassAbortController.current.signal;

      setPropertyLoading(true);
      toast.info('Loading property boundaries...');

      // Use Overpass API to get building outlines for the current view
      const bounds = map.current.getBounds();
      const south = bounds.getSouth();
      const west = bounds.getWest();
      const north = bounds.getNorth();
      const east = bounds.getEast();

      const cacheKey = `overpass:buildings:${south.toFixed(4)}:${west.toFixed(4)}:${north.toFixed(4)}:${east.toFixed(4)}`;
      const cached = await idbGet<GeoJSON.FeatureCollection>(cacheKey);
      if (cached) {
        // Render from cache
        if (propertyLayer.current && map.current?.hasLayer(propertyLayer.current)) {
          map.current.removeLayer(propertyLayer.current);
        }
        propertyLayer.current = L.geoJSON(cached, {
          style: {
            color: '#ff6b35',
            weight: 2,
            opacity: 0.8,
            fillColor: '#ff6b35',
            fillOpacity: 0.1,
            dashArray: '5,5',
            className: 'property-boundary'
          },
          onEachFeature: (
            feature: GeoJSON.Feature<GeoJSON.Polygon, { id: number | string; building: string; addr_street?: string; addr_housenumber?: string }>,
            layer
          ) => {
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
        if (layerStates.property && map.current) {
          propertyLayer.current.addTo(map.current);
        }
        toast.success('Loaded property boundaries (cached)');
        setPropertyLoading(false);
        return;
      }

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
        body: overpassQuery,
        signal,
        // Safer referrer policy
        referrerPolicy: 'strict-origin-when-cross-origin'
      });

      if (!response.ok) {
        throw new Error('Property data service unavailable');
      }

      type OverpassPoint = { lat: number; lon: number };
      type OverpassElement = {
        type: 'way' | 'relation' | string;
        id: number | string;
        geometry?: OverpassPoint[];
        tags?: Record<string, string>;
      };

      const data = (await response.json()) as { elements: OverpassElement[] };
      
      // Convert Overpass data to GeoJSON
      const geojsonFeatures = data.elements
        .filter((element): element is OverpassElement & { type: 'way'; geometry: OverpassPoint[] } => element.type === 'way' && Array.isArray(element.geometry))
        .map((element) => ({
          type: 'Feature' as const,
          properties: {
            id: element.id,
            building: element.tags?.building || 'yes',
            addr_street: element.tags?.['addr:street'],
            addr_housenumber: element.tags?.['addr:housenumber']
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [element.geometry.map((coord) => [coord.lon, coord.lat] as [number, number])]
          }
        }));

      const geojson: GeoJSON.FeatureCollection<GeoJSON.Polygon, { id: number | string; building: string; addr_street?: string; addr_housenumber?: string }> = {
        type: 'FeatureCollection',
        features: geojsonFeatures
      };

      // Cache for 10 minutes
      idbSet(cacheKey, geojson, 10 * 60 * 1000).catch(() => {});

      // Remove existing property layer
      if (propertyLayer.current && map.current?.hasLayer(propertyLayer.current)) {
        map.current.removeLayer(propertyLayer.current);
      }

      // Create new property layer
      propertyLayer.current = L.geoJSON(geojson, {
        style: {
          color: '#ff6b35',
          weight: 2,
          opacity: 0.8,
          fillColor: '#ff6b35',
          fillOpacity: 0.1,
          dashArray: '5,5',
          className: 'property-boundary'
        },
        onEachFeature: (feature: GeoJSON.Feature<GeoJSON.Polygon, { id: number | string; building: string; addr_street?: string; addr_housenumber?: string }>, layer) => {
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

      if (layerStates.property && map.current) {
        propertyLayer.current.addTo(map.current);
      }

      toast.success(`Loaded ${geojsonFeatures.length} property boundaries`);

    } catch (error) {
      const err = error as unknown;
      // ignore aborted requests silently
      // @ts-expect-error: DOMException may not be available in all TS libs
      const isAbort = (err as { name?: string })?.name === 'AbortError' || (typeof DOMException !== 'undefined' && err instanceof DOMException && err.name === 'AbortError');
      if (!isAbort) {
        console.error('Error loading property boundaries:', err);
        toast.error('Property boundaries temporarily unavailable');
      }
    } finally {
      setPropertyLoading(false);
      overpassAbortController.current = null;
    }
  }, [layerStates.property]);

  const loadPropertyBoundariesThrottled = useRef<number | null>(null);

  const schedulePropertyBoundaryLoad = useCallback(() => {
    if (!layerStates.property || !map.current) return;
    if (loadPropertyBoundariesThrottled.current) {
      window.clearTimeout(loadPropertyBoundariesThrottled.current);
    }
    loadPropertyBoundariesThrottled.current = window.setTimeout(() => {
      loadPropertyBoundaries();
      loadPropertyBoundariesThrottled.current = null;
    }, 500);
  }, [layerStates.property, loadPropertyBoundaries]);

  useEffect(() => {
    if (!map.current) return;
    map.current.on('moveend', schedulePropertyBoundaryLoad);
    return () => {
      map.current?.off('moveend', schedulePropertyBoundaryLoad);
    };
  }, [schedulePropertyBoundaryLoad]);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Determine initial center - use GPS location if available, otherwise Patrick County
    const initialCenter: [number, number] = gpsLocation 
      ? [gpsLocation.latitude, gpsLocation.longitude]
      : coverageCenter;
    const initialZoom = gpsLocation ? 15 : 10;

    // Initialize map
    map.current = L.map(mapContainer.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: true
    });

    // Add initial tile layer
    const initialLayer = getTileLayer(initialMapServiceRef.current);
    initialLayer.addTo(map.current);
    currentLayerRef.current = initialLayer;

    // Add drawn items layer
    drawnItems.current.addTo(map.current);

    // Create and add overlay layers
    createOverlayLayers();
    
    // Add initial overlay layers based on state
    if (roadsLayer.current) {
      roadsLayer.current.addTo(map.current);
    }
    if (labelsLayer.current) {
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
    
    // Add GPS marker if GPS location is available
    if (gpsLocation) {
      centerOnGpsLocation();
      toast.success(`Map loaded with your current location using ${initialMapServiceRef.current === 'esri-satellite' ? 'ESRI World Imagery (Satellite)' : initialMapServiceRef.current}`);
    } else {
      toast.success(`Map loaded with ${initialMapServiceRef.current === 'esri-satellite' ? 'ESRI World Imagery (Satellite)' : initialMapServiceRef.current}! Covering Patrick County, VA + surrounding areas`);
    }

    return () => {
      // Abort any in-flight Overpass requests
      if (overpassAbortController.current) {
        overpassAbortController.current.abort();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [gpsLocation, coverageCenter, getTileLayer, createOverlayLayers, centerOnGpsLocation]);

  // Update tile layer when map service changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    if (currentLayerRef.current) {
      map.current.removeLayer(currentLayerRef.current);
    }

    const newLayer = getTileLayer(mapService);
    newLayer.addTo(map.current);
    currentLayerRef.current = newLayer;

    toast.success(`Switched to ${mapService === 'esri-satellite' ? 'ESRI World Imagery (Satellite)' : mapService}`);
  }, [mapService, mapLoaded, getTileLayer]);

  // Update GPS marker when GPS location changes
  useEffect(() => {
    if (mapLoaded && gpsLocation) {
      centerOnGpsLocation();
    }
  }, [gpsLocation, mapLoaded, centerOnGpsLocation]);

  // Long-press to copy coordinates
  useEffect(() => {
    if (!map.current) return;
    let pressTimer: number | null = null;

    const handleMouseDown = (e: L.LeafletMouseEvent) => {
      if (pressTimer) window.clearTimeout(pressTimer);
      const latlng = e.latlng;
      pressTimer = window.setTimeout(async () => {
        try {
          await navigator.clipboard.writeText(`${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`);
          toast.success('Coordinates copied to clipboard');
        } catch {
          toast.error('Failed to copy coordinates');
        }
      }, 600);
    };
    const clearTimer = () => {
      if (pressTimer) {
        window.clearTimeout(pressTimer);
        pressTimer = null;
      }
    };

    map.current.on('mousedown', handleMouseDown);
    map.current.on('mouseup', clearTimer);
    map.current.on('mouseout', clearTimer);
    map.current.on('dragstart', clearTimer);

    return () => {
      map.current?.off('mousedown', handleMouseDown);
      map.current?.off('mouseup', clearTimer);
      map.current?.off('mouseout', clearTimer);
      map.current?.off('dragstart', clearTimer);
    };
  }, [mapLoaded]);

  const [batterySaver, setBatterySaver] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('battery-saver');
      if (stored) setBatterySaver(stored === '1');
    } catch {
      // ignore persistence errors
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('battery-saver', batterySaver ? '1' : '0');
    } catch {
      // ignore persistence errors
    }
  }, [batterySaver]);

  useEffect(() => {
    if (!map.current) return;
    const opacity = batterySaver ? 0.6 : 0.8;
    if (labelsLayer.current) labelsLayer.current.setOpacity(opacity);
    if (roadsLayer.current) roadsLayer.current.setOpacity(batterySaver ? 0.5 : 0.7);
  }, [batterySaver]);

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
      <div ref={mapContainer} data-testid="map-container" className="w-full h-full z-10" />
      
      {/* Floating action buttons */}
      <div className="absolute bottom-4 right-4 z-40 flex flex-col gap-2">
        <button
          onClick={() => setBatterySaver((v) => !v)}
          className={`p-2 sm:p-3 rounded-lg shadow-floating transition-fast ${batterySaver ? 'bg-yellow-500 text-black' : 'bg-gis-toolbar text-foreground hover:bg-gis-panel'}`}
          title="Battery saver mode"
          data-testid="battery-saver-toggle"
        >
          {batterySaver ? (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2v3H7a2 2 0 00-2 2v8a2 2 0 002 2h4v3l6-5-6-5V2z"/></svg>
          ) : (
            <svg className="w-4 h-4 sm:w-5 sm:h-5" viewBox="0 0 24 24" fill="currentColor"><path d="M11 2v3H7a2 2 0 00-2 2v8a2 2 0 002 2h4v3l6-5-6-5V2z" opacity=".6"/></svg>
          )}
        </button>
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
export type { LayerStates };