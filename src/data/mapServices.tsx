import React from 'react';
import { Map, Satellite, Globe, Layers, BarChart3, Zap } from 'lucide-react';

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
];