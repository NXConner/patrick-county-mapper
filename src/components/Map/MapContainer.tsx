import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import { toast } from 'sonner';

interface MapContainerProps {
  onMeasurement?: (measurement: { distance?: number; area?: number }) => void;
  activeTool?: string;
}

const MapContainer: React.FC<MapContainerProps> = ({ onMeasurement, activeTool }) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const draw = useRef<MapboxDraw | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Patrick County, VA coordinates
  const patrickCountyCenter: [number, number] = [-80.2876, 36.6837];

  useEffect(() => {
    if (!mapContainer.current) return;

    // You'll need to add your Mapbox token here
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN_HERE';
    
    // Initialize map centered on Patrick County, VA
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: patrickCountyCenter,
      zoom: 11,
      pitch: 0,
      bearing: 0,
      maxBounds: [
        [-81.5, 36.0], // Southwest corner (including surrounding counties)
        [-79.5, 37.2]  // Northeast corner
      ]
    });

    // Initialize drawing tools
    draw.current = new MapboxDraw({
      displayControlsDefault: false,
      controls: {
        polygon: true,
        line_string: true,
        point: true,
        trash: true
      },
      defaultMode: 'draw_polygon'
    });

    map.current.addControl(draw.current, 'top-left');

    // Add navigation controls
    map.current.addControl(
      new mapboxgl.NavigationControl({
        visualizePitch: true,
      }),
      'top-right'
    );

    // Add scale control
    map.current.addControl(new mapboxgl.ScaleControl({
      maxWidth: 100,
      unit: 'imperial'
    }), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      
      // Add road overlay for better visibility
      map.current?.addSource('roads', {
        type: 'vector',
        url: 'mapbox://mapbox.mapbox-streets-v8'
      });

      map.current?.addLayer({
        id: 'roads',
        source: 'roads',
        'source-layer': 'road',
        type: 'line',
        paint: {
          'line-color': '#ffffff',
          'line-width': {
            base: 1.5,
            stops: [
              [12, 0.5],
              [20, 8]
            ]
          },
          'line-opacity': 0.8
        }
      });

      toast.success('Map loaded! Focused on Patrick County, VA region');
    });

    // Handle drawing events for measurements
    map.current.on('draw.create', handleDrawCreate);
    map.current.on('draw.update', handleDrawUpdate);

    return () => {
      map.current?.remove();
    };
  }, []);

  const handleDrawCreate = (e: any) => {
    calculateMeasurements(e.features[0]);
  };

  const handleDrawUpdate = (e: any) => {
    calculateMeasurements(e.features[0]);
  };

  const calculateMeasurements = (feature: any) => {
    if (feature.geometry.type === 'Polygon') {
      // Calculate area in square feet
      const area = turf.area(feature);
      const areaInSqFt = area * 10.764; // Convert square meters to square feet
      
      // Calculate perimeter
      const perimeter = turf.length(turf.polygonToLine(feature), { units: 'feet' });
      
      onMeasurement?.({ area: areaInSqFt });
      toast.success(`Area: ${areaInSqFt.toFixed(2)} sq ft, Perimeter: ${perimeter.toFixed(2)} ft`);
    } else if (feature.geometry.type === 'LineString') {
      // Calculate distance in feet
      const distance = turf.length(feature, { units: 'feet' });
      
      onMeasurement?.({ distance });
      toast.success(`Distance: ${distance.toFixed(2)} ft`);
    }
  };

  const clearDrawings = () => {
    if (draw.current) {
      draw.current.deleteAll();
      toast.success('All drawings cleared');
    }
  };

  const exportData = () => {
    if (draw.current) {
      const data = draw.current.getAll();
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

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainer} className="absolute inset-0" />
      
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

      {/* Map token warning */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-background/90 flex items-center justify-center">
          <div className="bg-card p-6 rounded-lg shadow-panel max-w-md text-center">
            <div className="text-gis-warning mb-2">⚠️</div>
            <h3 className="text-lg font-semibold mb-2">Mapbox Token Required</h3>
            <p className="text-muted-foreground mb-4">
              Please add your Mapbox access token to display the map. 
              Get one free at <a href="https://mapbox.com" target="_blank" rel="noopener noreferrer" className="text-primary underline">mapbox.com</a>
            </p>
            <p className="text-sm text-muted-foreground">
              Replace 'YOUR_MAPBOX_TOKEN_HERE' in MapContainer.tsx with your token.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapContainer;