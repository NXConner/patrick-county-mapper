import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';

export interface PropertyInfo {
  parcelId: string;
  owner: string;
  address: string;
  acreage: number;
  taxValue: number;
  zoning: string;
  coordinates?: [number, number];
  area?: number;
  // Enhanced property details
  legalDescription?: string;
  taxYear?: number;
  assessedValue?: number;
  landValue?: number;
  improvementValue?: number;
  exemptions?: string[];
  propertyType?: 'residential' | 'commercial' | 'industrial' | 'agricultural' | 'vacant';
  yearBuilt?: number;
  squareFootage?: number;
  lotSize?: string;
  schoolDistrict?: string;
  utilities?: string[];
  easements?: string[];
  restrictions?: string[];
  floodZone?: string;
  soilType?: string;
  topography?: string;
  accessRights?: string;
  waterRights?: string[];
  mineralRights?: string;
  lastSaleDate?: Date;
  lastSalePrice?: number;
  marketValue?: number;
  rentalValue?: number;
  notes?: string;
  images?: string[];
  documents?: PropertyDocument[];
  history?: PropertyHistory[];
}

export interface PropertyDocument {
  id: string;
  name: string;
  type: 'deed' | 'survey' | 'plat' | 'permit' | 'inspection' | 'other';
  url?: string;
  uploadDate: Date;
  size?: number;
  description?: string;
}

export interface PropertyHistory {
  id: string;
  date: Date;
  event: 'sale' | 'transfer' | 'subdivision' | 'zoning_change' | 'permit' | 'assessment' | 'other';
  description: string;
  value?: number;
  party?: string;
}

export interface PropertySearchFilters {
  minAcreage?: number;
  maxAcreage?: number;
  minValue?: number;
  maxValue?: number;
  zoning?: string[];
  propertyType?: string[];
  owner?: string;
  address?: string;
  hasImprovements?: boolean;
  floodZone?: string[];
}

// Mock data for demonstration - In production, this would connect to real property APIs
const MOCK_PROPERTY_DATA: PropertyInfo[] = [
  {
    parcelId: "12345",
    owner: "John Smith",
    address: "123 Main St, Stuart, VA 24171",
    acreage: 2.5,
    taxValue: 150000,
    zoning: "Residential",
    coordinates: [36.6885, -80.2735],
    area: 108900, // square feet
    legalDescription: "LOT 1, BLOCK A, PATRICK COUNTY SUBDIVISION",
    taxYear: 2024,
    assessedValue: 150000,
    landValue: 50000,
    improvementValue: 100000,
    propertyType: "residential",
    yearBuilt: 1995,
    squareFootage: 2400,
    schoolDistrict: "Patrick County Public Schools",
    utilities: ["Electric", "Water", "Sewer", "Natural Gas"],
    floodZone: "Zone X",
    soilType: "Clay Loam",
    lastSaleDate: new Date("2020-05-15"),
    lastSalePrice: 135000,
    marketValue: 160000
  },
  {
    parcelId: "12346",
    owner: "Patrick County",
    address: "456 County Rd, Stuart, VA 24171",
    acreage: 0.75,
    taxValue: 85000,
    zoning: "Commercial",
    coordinates: [36.6875, -80.2745],
    area: 32670,
    propertyType: "commercial",
    yearBuilt: 2010,
    squareFootage: 1800,
    utilities: ["Electric", "Water", "Sewer"]
  }
];

export const usePropertyData = () => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyInfo | null>(null);
  const [searchFilters, setSearchFilters] = useState<PropertySearchFilters>({});

  // Query for property by parcel ID
  const usePropertyByParcel = (parcelId: string) => {
    return useQuery({
      queryKey: ['property', parcelId],
      queryFn: async () => {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const property = MOCK_PROPERTY_DATA.find(p => p.parcelId === parcelId);
        if (!property) {
          throw new Error('Property not found');
        }
        return property;
      },
      enabled: !!parcelId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  };

  // Query for properties by coordinates (nearby properties)
  const usePropertiesByLocation = (coordinates: [number, number], radius: number = 0.01) => {
    return useQuery({
      queryKey: ['properties', 'location', coordinates, radius],
      queryFn: async () => {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Find properties within radius (simplified calculation)
        const [targetLat, targetLng] = coordinates;
        return MOCK_PROPERTY_DATA.filter(property => {
          if (!property.coordinates) return false;
          const [lat, lng] = property.coordinates;
          const distance = Math.sqrt(
            Math.pow(lat - targetLat, 2) + Math.pow(lng - targetLng, 2)
          );
          return distance <= radius;
        });
      },
      enabled: !!coordinates,
      staleTime: 5 * 60 * 1000
    });
  };

  // Search properties with filters
  const searchProperties = useCallback(async (filters: PropertySearchFilters) => {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 600));
    
    let results = [...MOCK_PROPERTY_DATA];

    if (filters.minAcreage) {
      results = results.filter(p => p.acreage >= filters.minAcreage!);
    }
    if (filters.maxAcreage) {
      results = results.filter(p => p.acreage <= filters.maxAcreage!);
    }
    if (filters.minValue) {
      results = results.filter(p => p.taxValue >= filters.minValue!);
    }
    if (filters.maxValue) {
      results = results.filter(p => p.taxValue <= filters.maxValue!);
    }
    if (filters.zoning && filters.zoning.length > 0) {
      results = results.filter(p => filters.zoning!.includes(p.zoning));
    }
    if (filters.propertyType && filters.propertyType.length > 0) {
      results = results.filter(p => p.propertyType && filters.propertyType!.includes(p.propertyType));
    }
    if (filters.owner) {
      results = results.filter(p => 
        p.owner.toLowerCase().includes(filters.owner!.toLowerCase())
      );
    }
    if (filters.address) {
      results = results.filter(p => 
        p.address.toLowerCase().includes(filters.address!.toLowerCase())
      );
    }

    return results;
  }, []);

  // Calculate property statistics
  const calculatePropertyStats = useCallback((properties: PropertyInfo[]) => {
    if (properties.length === 0) return null;

    const stats = {
      totalProperties: properties.length,
      totalAcreage: properties.reduce((sum, p) => sum + p.acreage, 0),
      totalValue: properties.reduce((sum, p) => sum + p.taxValue, 0),
      averageValue: 0,
      averageAcreage: 0,
      zoningBreakdown: {} as Record<string, number>,
      propertyTypeBreakdown: {} as Record<string, number>
    };

    stats.averageValue = stats.totalValue / stats.totalProperties;
    stats.averageAcreage = stats.totalAcreage / stats.totalProperties;

    // Calculate breakdowns
    properties.forEach(property => {
      stats.zoningBreakdown[property.zoning] = 
        (stats.zoningBreakdown[property.zoning] || 0) + 1;
      
      if (property.propertyType) {
        stats.propertyTypeBreakdown[property.propertyType] = 
          (stats.propertyTypeBreakdown[property.propertyType] || 0) + 1;
      }
    });

    return stats;
  }, []);

  // Generate property report
  const generatePropertyReport = useCallback((property: PropertyInfo) => {
    const report = {
      basicInfo: {
        parcelId: property.parcelId,
        owner: property.owner,
        address: property.address,
        acreage: property.acreage,
        taxValue: property.taxValue,
        zoning: property.zoning
      },
      financialInfo: {
        assessedValue: property.assessedValue,
        landValue: property.landValue,
        improvementValue: property.improvementValue,
        marketValue: property.marketValue,
        lastSalePrice: property.lastSalePrice,
        lastSaleDate: property.lastSaleDate
      },
      physicalInfo: {
        propertyType: property.propertyType,
        yearBuilt: property.yearBuilt,
        squareFootage: property.squareFootage,
        lotSize: property.lotSize,
        floodZone: property.floodZone,
        soilType: property.soilType
      },
      utilities: property.utilities || [],
      restrictions: property.restrictions || [],
      notes: property.notes || ''
    };

    return report;
  }, []);

  // Export property data
  const exportPropertyData = useCallback((
    properties: PropertyInfo[], 
    format: 'json' | 'csv' | 'pdf' = 'csv'
  ) => {
    if (properties.length === 0) {
      toast.error('No properties to export');
      return;
    }

    try {
      let data: string;
      let filename: string;
      let mimeType: string;

      if (format === 'json') {
        data = JSON.stringify(properties, null, 2);
        filename = 'properties.json';
        mimeType = 'application/json';
      } else if (format === 'csv') {
        const headers = [
          'Parcel ID', 'Owner', 'Address', 'Acreage', 'Tax Value', 'Zoning',
          'Property Type', 'Year Built', 'Square Footage', 'Last Sale Price', 'Last Sale Date'
        ];
        const csvRows = [
          headers.join(','),
          ...properties.map(p => [
            p.parcelId,
            `"${p.owner}"`,
            `"${p.address}"`,
            p.acreage,
            p.taxValue,
            p.zoning,
            p.propertyType || '',
            p.yearBuilt || '',
            p.squareFootage || '',
            p.lastSalePrice || '',
            p.lastSaleDate?.toISOString().split('T')[0] || ''
          ].join(','))
        ];
        data = csvRows.join('\n');
        filename = 'properties.csv';
        mimeType = 'text/csv';
      } else {
        throw new Error('PDF export not yet implemented');
      }

      // Download file
      const blob = new Blob([data], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setTimeout(() => URL.revokeObjectURL(url), 100);
      toast.success(`Property data exported as ${format.toUpperCase()}`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export property data');
    }
  }, []);

  return {
    selectedProperty,
    setSelectedProperty,
    searchFilters,
    setSearchFilters,
    usePropertyByParcel,
    usePropertiesByLocation,
    searchProperties,
    calculatePropertyStats,
    generatePropertyReport,
    exportPropertyData
  };
};