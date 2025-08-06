import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';

export interface MapService {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'freemium' | 'limited';
  url?: string;
  apiKey?: boolean;
}

export const mapServices: MapService[] = [
  {
    id: 'esri-satellite',
    name: 'ESRI World Imagery',
    description: 'High-resolution satellite imagery (FREE)',
    cost: 'Free',
    url: 'https://www.esri.com',
    features: [
      '✓ High-resolution satellite imagery',
      '✓ Global coverage',
      '✓ No API key required',
      '✓ Up to zoom level 20',
      '✓ Recent imagery updates'
    ]
  },
  {
    id: 'google-satellite',
    name: 'Google Satellite',
    description: 'Google satellite imagery (FREE)',
    cost: 'Free',
    url: 'https://maps.google.com',
    features: [
      '✓ High-resolution satellite imagery',
      '✓ Global coverage',
      '✓ No API key required',
      '✓ Up to zoom level 20'
    ]
  },
  {
    id: 'leaflet-osm',
    name: 'OpenStreetMap',
    description: 'Open source street map tiles',
    cost: 'Free',
    url: 'https://www.openstreetmap.org',
    features: [
      '✓ Open source mapping',
      '✓ Community-driven data',
      '✓ No API key required',
      '✓ Street-level detail'
    ]
  },
  {
    id: 'qgis',
    name: 'QGIS Web Client',
    description: 'Professional open source GIS platform',
    type: 'free',
    url: 'https://qgis.org',
    apiKey: false
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Popular mapping service with free tier',
    type: 'freemium',
    url: 'https://maps.google.com',
    apiKey: true
  },
  {
    id: 'google-earth',
    name: 'Google Earth Engine',
    description: 'Satellite imagery and geospatial analysis',
    type: 'freemium',
    url: 'https://earthengine.google.com',
    apiKey: true
  },
  {
    id: 'maplibre',
    name: 'MapLibre GL JS',
    description: 'Open source fork of Mapbox GL JS',
    type: 'free',
    url: 'https://maplibre.org',
    apiKey: false
  },
  {
    id: 'openlayers',
    name: 'OpenLayers',
    description: 'High-performance library for interactive maps',
    type: 'free',
    url: 'https://openlayers.org',
    apiKey: false
  },
  {
    id: 'locationiq',
    name: 'LocationIQ',
    description: 'Affordable geocoding and mapping API',
    type: 'freemium',
    url: 'https://locationiq.com',
    apiKey: true
  },
  {
    id: 'mapquest',
    name: 'MapQuest',
    description: 'Free mapping and geocoding services',
    type: 'freemium',
    url: 'https://developer.mapquest.com',
    apiKey: true
  },
  {
    id: 'jawg',
    name: 'Jawg Maps',
    description: 'Free and customizable mapping platform',
    type: 'freemium',
    url: 'https://www.jawg.io',
    apiKey: true
  },
  {
    id: 'maphub',
    name: 'MapHub',
    description: 'Create and share interactive maps',
    type: 'freemium',
    url: 'https://maphub.net',
    apiKey: false
  },
  {
    id: 'carto',
    name: 'CARTO',
    description: 'Location Intelligence platform',
    type: 'freemium',
    url: 'https://carto.com',
    apiKey: true
  },
  {
    id: 'here-maps',
    name: 'HERE Maps',
    description: 'Location services with free tier',
    type: 'freemium',
    url: 'https://developer.here.com',
    apiKey: true
  },
  {
    id: 'bing-maps',
    name: 'Bing Maps',
    description: 'Microsoft mapping services',
    type: 'freemium',
    url: 'https://www.bingmapsportal.com',
    apiKey: true
  },
  {
    id: 'tomtom',
    name: 'TomTom Maps',
    description: 'Navigation and mapping APIs',
    type: 'freemium',
    url: 'https://developer.tomtom.com',
    apiKey: true
  },
  {
    id: 'arcgis-online',
    name: 'ArcGIS Online',
    description: 'ESRI web-based mapping platform',
    type: 'freemium',
    url: 'https://www.arcgis.com',
    apiKey: true
  }
];

interface MapServiceDropdownProps {
  selectedService: string;
  onServiceChange: (serviceId: string) => void;
  className?: string;
}

const MapServiceDropdown: React.FC<MapServiceDropdownProps> = ({
  selectedService,
  onServiceChange,
  className = ""
}) => {
  const selectedServiceData = mapServices.find(service => service.id === selectedService);

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground hidden md:block">
        Mapping Service
      </label>
      <Select value={selectedService} onValueChange={onServiceChange}>
        <SelectTrigger className="w-full bg-gis-toolbar/80 backdrop-blur-sm border-gis-border text-foreground h-8 text-sm">
          <SelectValue placeholder="Select mapping service">
            {selectedServiceData && (
              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full ${
                  selectedServiceData.type === 'free' ? 'bg-green-500' : 
                  selectedServiceData.type === 'freemium' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
                <span className="truncate">{selectedServiceData.name}</span>
                {selectedServiceData.type === 'free' && (
                  <span className="text-xs text-green-600 font-medium hidden sm:inline">FREE</span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-gis-panel border-gis-border max-h-[300px] w-[320px]">
          {mapServices.map((service) => (
            <SelectItem 
              key={service.id} 
              value={service.id}
              className="text-foreground hover:bg-gis-toolbar focus:bg-gis-toolbar py-2"
            >
              <div className="flex items-center gap-3 w-full">
                <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  service.type === 'free' ? 'bg-green-500' : 
                  service.type === 'freemium' ? 'bg-blue-500' : 'bg-yellow-500'
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{service.name}</span>
                    {service.type === 'free' && (
                      <span className="text-xs text-green-600 font-medium px-1.5 py-0.5 bg-green-100 rounded">
                        FREE
                      </span>
                    )}
                    {service.type === 'freemium' && (
                      <span className="text-xs text-blue-600 font-medium px-1.5 py-0.5 bg-blue-100 rounded">
                        FREE TIER
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {service.description}
                  </p>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {selectedServiceData && (
        <div className="text-xs text-muted-foreground hidden lg:block">
          <p className="truncate">{selectedServiceData.description}</p>
          {selectedServiceData.url && (
            <a 
              href={selectedServiceData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              Learn more →
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default MapServiceDropdown;