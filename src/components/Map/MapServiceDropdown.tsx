import React, { useState } from 'react';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Map, 
  Satellite, 
  Globe, 
  Layers, 
  Star, 
  Zap, 
  Info,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  BarChart3
} from 'lucide-react';

export interface MapService {
  id: string;
  name: string;
  description: string;
  type: 'free' | 'freemium' | 'limited';
  url?: string;
  apiKey?: boolean;
  icon?: React.ReactNode;
  features?: string[];
  quality?: 'high' | 'medium' | 'low';
}

export const mapServices: MapService[] = [
  {
    id: 'esri-satellite',
    name: 'ESRI World Imagery',
    description: 'High-resolution satellite imagery (FREE)',
    type: 'free',
    url: 'https://www.esri.com',
    apiKey: false,
    icon: <Satellite className="w-4 h-4" />,
    features: ['High Resolution', 'Global Coverage', 'Real-time Updates'],
    quality: 'high'
  },
  {
    id: 'google-satellite',
    name: 'Google Satellite',
    description: 'Google satellite imagery (FREE)',
    type: 'free',
    url: 'https://maps.google.com',
    apiKey: false,
    icon: <Globe className="w-4 h-4" />,
    features: ['Detailed Imagery', 'Street View Integration', '3D Buildings'],
    quality: 'high'
  },
  {
    id: 'leaflet-osm',
    name: 'OpenStreetMap',
    description: 'Open source street map tiles',
    type: 'free',
    url: 'https://www.openstreetmap.org',
    apiKey: false,
    icon: <Map className="w-4 h-4" />,
    features: ['Community Driven', 'Open Source', 'Detailed Streets'],
    quality: 'medium'
  },
  {
    id: 'qgis',
    name: 'QGIS Web Client',
    description: 'Professional open source GIS platform',
    type: 'free',
    url: 'https://qgis.org',
    apiKey: false,
    icon: <Layers className="w-4 h-4" />,
    features: ['GIS Analysis', 'Vector Data', 'Professional Tools'],
    quality: 'high'
  },
  {
    id: 'google-maps',
    name: 'Google Maps',
    description: 'Popular mapping service with free tier',
    type: 'freemium',
    url: 'https://maps.google.com',
    apiKey: true,
    icon: <Map className="w-4 h-4" />,
    features: ['Traffic Data', 'Directions', 'Business Info'],
    quality: 'high'
  },
  {
    id: 'google-earth',
    name: 'Google Earth Engine',
    description: 'Satellite imagery and geospatial analysis',
    type: 'freemium',
    url: 'https://earthengine.google.com',
    apiKey: true,
    icon: <Globe className="w-4 h-4" />,
    features: ['Time Series', 'Analysis Tools', 'Big Data'],
    quality: 'high'
  },
  {
    id: 'maplibre',
    name: 'MapLibre GL JS',
    description: 'Open source fork of Mapbox GL JS',
    type: 'free',
    url: 'https://maplibre.org',
    apiKey: false,
    icon: <Layers className="w-4 h-4" />,
    features: ['Vector Tiles', '3D Rendering', 'Custom Styles'],
    quality: 'high'
  },
  {
    id: 'openlayers',
    name: 'OpenLayers',
    description: 'High-performance library for interactive maps',
    type: 'free',
    url: 'https://openlayers.org',
    apiKey: false,
    icon: <Map className="w-4 h-4" />,
    features: ['High Performance', 'Multiple Formats', 'Advanced Controls'],
    quality: 'high'
  },
  {
    id: 'locationiq',
    name: 'LocationIQ',
    description: 'Affordable geocoding and mapping API',
    type: 'freemium',
    url: 'https://locationiq.com',
    apiKey: true,
    icon: <Zap className="w-4 h-4" />,
    features: ['Geocoding', 'Routing', 'Geofencing'],
    quality: 'medium'
  },
  {
    id: 'mapquest',
    name: 'MapQuest',
    description: 'Free mapping and geocoding services',
    type: 'freemium',
    url: 'https://developer.mapquest.com',
    apiKey: true,
    icon: <Map className="w-4 h-4" />,
    features: ['Free Tier', 'Geocoding', 'Directions'],
    quality: 'medium'
  },
  {
    id: 'jawg',
    name: 'Jawg Maps',
    description: 'Free and customizable mapping platform',
    type: 'freemium',
    url: 'https://www.jawg.io',
    apiKey: true,
    icon: <Globe className="w-4 h-4" />,
    features: ['Custom Styling', 'Vector Tiles', 'Mobile Optimized'],
    quality: 'medium'
  },
  {
    id: 'maphub',
    name: 'MapHub',
    description: 'Create and share interactive maps',
    type: 'freemium',
    url: 'https://maphub.net',
    apiKey: false,
    icon: <Layers className="w-4 h-4" />,
    features: ['Easy Creation', 'Sharing', 'Collaboration'],
    quality: 'medium'
  },
  {
    id: 'carto',
    name: 'CARTO',
    description: 'Location Intelligence platform',
    type: 'freemium',
    url: 'https://carto.com',
    apiKey: true,
    icon: <BarChart3 className="w-4 h-4" />,
    features: ['Analytics', 'Real-time Data', 'Machine Learning'],
    quality: 'high'
  },
  {
    id: 'here-maps',
    name: 'HERE Maps',
    description: 'Location services with free tier',
    type: 'freemium',
    url: 'https://developer.here.com',
    apiKey: true,
    icon: <Map className="w-4 h-4" />,
    features: ['Traffic', 'Routing', 'Indoor Maps'],
    quality: 'high'
  },
  {
    id: 'bing-maps',
    name: 'Bing Maps',
    description: 'Microsoft mapping services',
    type: 'freemium',
    url: 'https://www.bingmapsportal.com',
    apiKey: true,
    icon: <Globe className="w-4 h-4" />,
    features: ['Aerial Imagery', '3D Cities', 'Business Data'],
    quality: 'high'
  },
  {
    id: 'tomtom',
    name: 'TomTom Maps',
    description: 'Navigation and mapping APIs',
    type: 'freemium',
    url: 'https://developer.tomtom.com',
    apiKey: true,
    icon: <Map className="w-4 h-4" />,
    features: ['Navigation', 'Traffic', 'Fleet Management'],
    quality: 'high'
  },
  {
    id: 'arcgis-online',
    name: 'ArcGIS Online',
    description: 'ESRI web-based mapping platform',
    type: 'freemium',
    url: 'https://www.arcgis.com',
    apiKey: true,
    icon: <Layers className="w-4 h-4" />,
    features: ['Enterprise GIS', 'Analysis Tools', 'Data Management'],
    quality: 'high'
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
  const [isOpen, setIsOpen] = useState(false);
  const selectedServiceData = mapServices.find(service => service.id === selectedService);

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'high': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'free': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      case 'freemium': return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20';
      case 'limited': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label className="text-xs font-medium text-muted-foreground hidden md:block">
        Mapping Service
      </label>
      <Select value={selectedService} onValueChange={onServiceChange} onOpenChange={setIsOpen}>
        <SelectTrigger className="select-enhanced w-full h-11 text-base touch-manipulation">
          <SelectValue placeholder="Select mapping service">
            {selectedServiceData && (
              <div className="flex items-center gap-3">
                <div className={`p-1.5 rounded-lg ${selectedServiceData.type === 'free' ? 'bg-green-500/20' : 'bg-blue-500/20'}`}>
                  {selectedServiceData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate font-medium">{selectedServiceData.name}</span>
                    {selectedServiceData.type === 'free' && (
                      <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                        FREE
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {selectedServiceData.description}
                  </p>
                </div>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="menu-enhanced max-h-[400px] w-[380px] overflow-y-auto scrollbar-enhanced">
          <div className="p-2">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-foreground">Mapping Services</h3>
              <Badge variant="outline" className="text-xs">
                {mapServices.length} Services
              </Badge>
            </div>
            
            <div className="space-y-2">
              {mapServices.map((service) => (
                <SelectItem 
                  key={service.id} 
                  value={service.id}
                  className="text-foreground hover:bg-muted/50 focus:bg-muted/50 py-3 px-3 rounded-lg transition-all duration-200"
                >
                  <div className="flex items-start gap-3 w-full">
                    <div className={`p-2 rounded-lg ${service.type === 'free' ? 'bg-green-500/20' : 'bg-blue-500/20'} flex-shrink-0`}>
                      {service.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm">{service.name}</span>
                        <div className="flex gap-1">
                          {service.type === 'free' && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                              FREE
                            </Badge>
                          )}
                          {service.type === 'freemium' && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
                              FREE TIER
                            </Badge>
                          )}
                          <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${getQualityColor(service.quality || 'medium')}`}>
                            {service.quality?.toUpperCase() || 'MEDIUM'}
                          </Badge>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">
                        {service.description}
                      </p>
                      {service.features && (
                        <div className="flex flex-wrap gap-1">
                          {service.features.slice(0, 2).map((feature, index) => (
                            <span key={index} className="text-xs text-muted-foreground bg-muted/50 px-1.5 py-0.5 rounded">
                              {feature}
                            </span>
                          ))}
                          {service.features.length > 2 && (
                            <span className="text-xs text-muted-foreground">
                              +{service.features.length - 2} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                    {service.id === selectedService && (
                      <CheckCircle className="w-4 h-4 text-primary flex-shrink-0" />
                    )}
                  </div>
                </SelectItem>
              ))}
            </div>
          </div>
        </SelectContent>
      </Select>
      
      {selectedServiceData && (
        <div className="text-xs text-muted-foreground hidden lg:block space-y-1">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${selectedServiceData.type === 'free' ? 'bg-green-500' : 'bg-blue-500'}`} />
            <span className="font-medium">{selectedServiceData.name}</span>
          </div>
          <p className="text-xs">{selectedServiceData.description}</p>
          {selectedServiceData.url && (
            <a 
              href={selectedServiceData.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-primary hover:underline flex items-center gap-1 transition-colors duration-200"
            >
              <ExternalLink className="w-3 h-3" />
              Learn more
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default MapServiceDropdown;