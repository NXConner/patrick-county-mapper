import { useState, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { 
  fetchPropertyByParcelId, 
  fetchPropertiesByLocation, 
  searchProperties as searchPropertiesService 
} from '@/lib/propertyService';

export interface PropertyInfo {
  parcelId: string;
  owner?: string;
  address?: string;
  acreage: number;
  taxValue: number;
  zoning?: string;
  coordinates?: [number, number];
  area?: number;
  // Enhanced property details
  legalDescription?: string;
  taxYear?: number;
  assessedValue?: number;
  landValue?: number;
  improvementValue?: number;
  exemptions?: string[];
  propertyType?: string;
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
  salesHistory?: Array<{
    date: Date;
    price: number;
    buyer?: string;
    seller?: string;
    deedReference?: string;
  }>;
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

export const usePropertyData = () => {
  const [selectedProperty, setSelectedProperty] = useState<PropertyInfo | null>(null);
  const [searchFilters, setSearchFilters] = useState<PropertySearchFilters>({});

  // Query for property by parcel ID
  const usePropertyByParcel = (parcelId: string) => {
    return useQuery({
      queryKey: ['property', parcelId],
      queryFn: async () => {
        try {
          const property = await fetchPropertyByParcelId(parcelId);
          if (!property) {
            throw new Error('Property not found');
          }
          return property;
        } catch (error) {
          console.error('Error fetching property:', error);
          toast.error('Failed to fetch property data');
          throw error;
        }
      },
      enabled: !!parcelId,
      staleTime: 5 * 60 * 1000 // 5 minutes
    });
  };

  // Query for properties by coordinates (nearby properties)
  const usePropertiesByLocation = (coordinates: [number, number], radius: number = 1) => {
    return useQuery({
      queryKey: ['properties', 'location', coordinates, radius],
      queryFn: async () => {
        try {
          return await fetchPropertiesByLocation(coordinates, radius);
        } catch (error) {
          console.error('Error fetching properties by location:', error);
          toast.error('Failed to fetch nearby properties');
          throw error;
        }
      },
      enabled: !!coordinates && coordinates.length === 2,
      staleTime: 5 * 60 * 1000
    });
  };

  // Search properties with filters
  const searchProperties = useCallback(async (filters: PropertySearchFilters) => {
    try {
      return await searchPropertiesService(filters);
    } catch (error) {
      console.error('Error searching properties:', error);
      toast.error('Failed to search properties');
      throw error;
    }
  }, []);

  // Get property statistics
  const getPropertyStatistics = useCallback(async (properties: PropertyInfo[]) => {
    const totalProperties = properties.length;
    const totalValue = properties.reduce((sum, p) => sum + (p.taxValue || 0), 0);
    const totalAcreage = properties.reduce((sum, p) => sum + (p.acreage || 0), 0);
    const averageValue = totalProperties > 0 ? totalValue / totalProperties : 0;
    const averageAcreage = totalProperties > 0 ? totalAcreage / totalProperties : 0;

    // Zoning breakdown
    const zoningMap = properties.reduce((acc, p) => {
      const zoning = p.zoning || 'Unknown';
      acc[zoning] = (acc[zoning] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const zoningBreakdown = Object.entries(zoningMap).map(([zoning, count]) => ({
      zoning,
      count,
      percentage: (count / totalProperties) * 100
    }));

    // Property type breakdown
    const typeMap = properties.reduce((acc, p) => {
      const type = p.propertyType || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const propertyTypeBreakdown = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
      percentage: (count / totalProperties) * 100
    }));

    return {
      totalProperties,
      totalValue,
      totalAcreage,
      averageValue,
      averageAcreage,
      zoningBreakdown,
      propertyTypeBreakdown
    };
  }, []);

  // Format currency
  const formatCurrency = useCallback((amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  // Format number with commas
  const formatNumber = useCallback((num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  }, []);

  // Calculate property value per acre
  const getValuePerAcre = useCallback((property: PropertyInfo) => {
    if (!property.acreage || property.acreage === 0) return 0;
    return property.taxValue / property.acreage;
  }, []);

  // Calculate property age
  const getPropertyAge = useCallback((property: PropertyInfo) => {
    if (!property.yearBuilt) return null;
    return new Date().getFullYear() - property.yearBuilt;
  }, []);

  // Get property type color for UI
  const getPropertyTypeColor = useCallback((type: string = '') => {
    const colors: Record<string, string> = {
      'residential': 'bg-blue-100 text-blue-800',
      'commercial': 'bg-green-100 text-green-800',
      'industrial': 'bg-purple-100 text-purple-800',
      'agricultural': 'bg-yellow-100 text-yellow-800',
      'vacant': 'bg-gray-100 text-gray-800',
      'Single Family': 'bg-blue-100 text-blue-800',
      'Retail': 'bg-green-100 text-green-800',
      'Vacant Land': 'bg-gray-100 text-gray-800',
      'Manufactured Home': 'bg-orange-100 text-orange-800',
      'Government': 'bg-red-100 text-red-800'
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  }, []);

  // Get zoning color for UI
  const getZoningColor = useCallback((zoning: string = '') => {
    const colors: Record<string, string> = {
      'Residential': 'bg-blue-50 text-blue-700',
      'Commercial': 'bg-green-50 text-green-700',
      'Industrial': 'bg-purple-50 text-purple-700',
      'Agricultural': 'bg-yellow-50 text-yellow-700',
      'Institutional': 'bg-red-50 text-red-700'
    };
    return colors[zoning] || 'bg-gray-50 text-gray-700';
  }, []);

  // Export property data
  const exportPropertyData = useCallback((properties: PropertyInfo[], format: 'csv' | 'json' = 'csv') => {
    if (format === 'json') {
      const dataStr = JSON.stringify(properties, null, 2);
      const dataBlob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patrick-county-properties-${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
    } else {
      // CSV export
      const headers = [
        'Parcel ID', 'Owner', 'Address', 'Acreage', 'Tax Value', 'Zoning', 
        'Property Type', 'Year Built', 'Square Footage', 'Last Sale Price'
      ];
      
      const rows = properties.map(p => [
        p.parcelId,
        p.owner || '',
        p.address || '',
        p.acreage?.toString() || '',
        p.taxValue?.toString() || '',
        p.zoning || '',
        p.propertyType || '',
        p.yearBuilt?.toString() || '',
        p.squareFootage?.toString() || '',
        p.lastSalePrice?.toString() || ''
      ]);

      const csvContent = [headers, ...rows]
        .map(row => row.map(field => `"${field}"`).join(','))
        .join('\n');

      const dataBlob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `patrick-county-properties-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
    }
    
    toast.success(`Property data exported as ${format.toUpperCase()}`);
  }, []);

  return {
    selectedProperty,
    setSelectedProperty,
    searchFilters,
    setSearchFilters,
    usePropertyByParcel,
    usePropertiesByLocation,
    searchProperties,
    getPropertyStatistics,
    formatCurrency,
    formatNumber,
    getValuePerAcre,
    getPropertyAge,
    getPropertyTypeColor,
    getZoningColor,
    exportPropertyData
  };
};