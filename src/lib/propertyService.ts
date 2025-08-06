import { supabase } from '@/integrations/supabase/client';
import { PropertyInfo } from '@/hooks/usePropertyData';

// Type definitions for Supabase property data
export interface DatabaseProperty {
  id: string;
  parcel_id: string;
  owner_name: string | null;
  property_address: string | null;
  acreage: number | null;
  tax_value: number | null;
  assessed_value: number | null;
  land_value: number | null;
  improvement_value: number | null;
  market_value: number | null;
  zoning: string | null;
  property_type: string | null;
  year_built: number | null;
  square_footage: number | null;
  school_district: string | null;
  flood_zone: string | null;
  soil_type: string | null;
  last_sale_date: string | null;
  last_sale_price: number | null;
  legal_description: string | null;
  tax_year: number | null;
  latitude: number | null;
  longitude: number | null;
  area_sqft: number | null;
  created_at: string;
  updated_at: string;
}

export interface PropertyUtility {
  id: string;
  property_id: string;
  utility_name: string;
}

export interface PropertySale {
  id: string;
  property_id: string;
  sale_date: string;
  sale_price: number;
  buyer_name: string | null;
  seller_name: string | null;
  deed_book: string | null;
  deed_page: string | null;
}

// Convert database property to PropertyInfo format
export function convertToPropertyInfo(
  dbProperty: DatabaseProperty,
  utilities: PropertyUtility[] = [],
  salesHistory: PropertySale[] = []
): PropertyInfo {
  return {
    parcelId: dbProperty.parcel_id,
    owner: dbProperty.owner_name || undefined,
    address: dbProperty.property_address || undefined,
    acreage: dbProperty.acreage || 0,
    taxValue: dbProperty.tax_value || 0,
    zoning: dbProperty.zoning || undefined,
    coordinates: dbProperty.latitude && dbProperty.longitude 
      ? [dbProperty.latitude, dbProperty.longitude] 
      : undefined,
    area: dbProperty.area_sqft || undefined,
    legalDescription: dbProperty.legal_description || undefined,
    taxYear: dbProperty.tax_year || undefined,
    assessedValue: dbProperty.assessed_value || undefined,
    landValue: dbProperty.land_value || undefined,
    improvementValue: dbProperty.improvement_value || undefined,
    propertyType: dbProperty.property_type || undefined,
    yearBuilt: dbProperty.year_built || undefined,
    squareFootage: dbProperty.square_footage || undefined,
    schoolDistrict: dbProperty.school_district || undefined,
    utilities: utilities.map(u => u.utility_name),
    floodZone: dbProperty.flood_zone || undefined,
    soilType: dbProperty.soil_type || undefined,
    lastSaleDate: dbProperty.last_sale_date ? new Date(dbProperty.last_sale_date) : undefined,
    lastSalePrice: dbProperty.last_sale_price || undefined,
    marketValue: dbProperty.market_value || undefined,
    salesHistory: salesHistory.map(sale => ({
      date: new Date(sale.sale_date),
      price: sale.sale_price,
      buyer: sale.buyer_name || undefined,
      seller: sale.seller_name || undefined,
      deedReference: sale.deed_book && sale.deed_page 
        ? `${sale.deed_book}, ${sale.deed_page}` 
        : undefined
    }))
  };
}

// Fetch property by parcel ID
export async function fetchPropertyByParcelId(parcelId: string): Promise<PropertyInfo | null> {
  try {
    const { data: property, error: propertyError } = await supabase
      .from('properties')
      .select('*')
      .eq('parcel_id', parcelId)
      .single();

    if (propertyError) {
      if (propertyError.code === 'PGRST116') {
        // No rows returned
        return null;
      }
      throw propertyError;
    }

    // Fetch utilities
    const { data: utilities, error: utilitiesError } = await supabase
      .from('property_utilities')
      .select('*')
      .eq('property_id', property.id);

    if (utilitiesError) {
      console.warn('Error fetching utilities:', utilitiesError);
    }

    // Fetch sales history
    const { data: salesHistory, error: salesError } = await supabase
      .from('property_sales')
      .select('*')
      .eq('property_id', property.id)
      .order('sale_date', { ascending: false });

    if (salesError) {
      console.warn('Error fetching sales history:', salesError);
    }

    return convertToPropertyInfo(property, utilities || [], salesHistory || []);
  } catch (error) {
    console.error('Error fetching property by parcel ID:', error);
    throw error;
  }
}

// Fetch properties by location (within radius)
export async function fetchPropertiesByLocation(
  coordinates: [number, number], 
  radiusKm: number = 1
): Promise<PropertyInfo[]> {
  try {
    const [lat, lng] = coordinates;
    
    // Use PostGIS ST_DWithin for geographic distance calculation
    const { data: properties, error } = await supabase
      .rpc('get_properties_within_radius', {
        center_lat: lat,
        center_lng: lng,
        radius_km: radiusKm
      });

    if (error) {
      // Fallback to simpler coordinate-based search if RPC doesn't exist
      console.warn('RPC function not available, using coordinate bounds:', error);
      return await fetchPropertiesByCoordinateBounds(coordinates, radiusKm);
    }

    if (!properties) return [];

    // Fetch utilities and sales for all properties
    const propertyIds = properties.map((p: DatabaseProperty) => p.id);
    
    const [utilitiesResult, salesResult] = await Promise.all([
      supabase
        .from('property_utilities')
        .select('*')
        .in('property_id', propertyIds),
      supabase
        .from('property_sales')
        .select('*')
        .in('property_id', propertyIds)
        .order('sale_date', { ascending: false })
    ]);

    const utilities = utilitiesResult.data || [];
    const sales = salesResult.data || [];

    return properties.map((property: DatabaseProperty) => {
      const propertyUtilities = utilities.filter(u => u.property_id === property.id);
      const propertySales = sales.filter(s => s.property_id === property.id);
      return convertToPropertyInfo(property, propertyUtilities, propertySales);
    });
  } catch (error) {
    console.error('Error fetching properties by location:', error);
    throw error;
  }
}

// Fallback function for coordinate bounds search
async function fetchPropertiesByCoordinateBounds(
  coordinates: [number, number], 
  radiusKm: number
): Promise<PropertyInfo[]> {
  const [lat, lng] = coordinates;
  
  // Approximate coordinate bounds (1 degree ≈ 111km)
  const latBounds = radiusKm / 111;
  const lngBounds = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
  
  const { data: properties, error } = await supabase
    .from('properties')
    .select('*')
    .gte('latitude', lat - latBounds)
    .lte('latitude', lat + latBounds)
    .gte('longitude', lng - lngBounds)
    .lte('longitude', lng + lngBounds)
    .not('latitude', 'is', null)
    .not('longitude', 'is', null);

  if (error) throw error;
  if (!properties) return [];

  return properties.map(property => convertToPropertyInfo(property));
}

// Search properties with filters
export async function searchProperties(filters: {
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
}): Promise<PropertyInfo[]> {
  try {
    let query = supabase.from('properties').select('*');

    // Apply filters
    if (filters.minAcreage) {
      query = query.gte('acreage', filters.minAcreage);
    }
    if (filters.maxAcreage) {
      query = query.lte('acreage', filters.maxAcreage);
    }
    if (filters.minValue) {
      query = query.gte('tax_value', filters.minValue);
    }
    if (filters.maxValue) {
      query = query.lte('tax_value', filters.maxValue);
    }
    if (filters.zoning && filters.zoning.length > 0) {
      query = query.in('zoning', filters.zoning);
    }
    if (filters.propertyType && filters.propertyType.length > 0) {
      query = query.in('property_type', filters.propertyType);
    }
    if (filters.owner) {
      query = query.ilike('owner_name', `%${filters.owner}%`);
    }
    if (filters.address) {
      query = query.ilike('property_address', `%${filters.address}%`);
    }
    if (filters.hasImprovements !== undefined) {
      if (filters.hasImprovements) {
        query = query.gt('improvement_value', 0);
      } else {
        query = query.or('improvement_value.is.null,improvement_value.eq.0');
      }
    }
    if (filters.floodZone && filters.floodZone.length > 0) {
      query = query.in('flood_zone', filters.floodZone);
    }

    const { data: properties, error } = await query.limit(100);

    if (error) throw error;
    if (!properties) return [];

    return properties.map(property => convertToPropertyInfo(property));
  } catch (error) {
    console.error('Error searching properties:', error);
    throw error;
  }
}

// Get property analytics
export async function getPropertyAnalytics(): Promise<{
  totalProperties: number;
  totalValue: number;
  totalAcreage: number;
  averageValue: number;
  averageAcreage: number;
  zoningBreakdown: Array<{ zoning: string; count: number; totalValue: number }>;
  propertyTypeBreakdown: Array<{ type: string; count: number; percentage: number }>;
  salesTrend: Array<{ month: string; averagePrice: number; salesCount: number }>;
}> {
  try {
    // Get basic statistics
    const { data: stats, error: statsError } = await supabase
      .rpc('get_property_statistics');

    if (statsError) {
      console.warn('RPC function not available, calculating manually:', statsError);
    }

    // Get all properties for analysis
    const { data: properties, error: propertiesError } = await supabase
      .from('properties')
      .select('*');

    if (propertiesError) throw propertiesError;

    const totalProperties = properties?.length || 0;
    const totalValue = properties?.reduce((sum, p) => sum + (p.tax_value || 0), 0) || 0;
    const totalAcreage = properties?.reduce((sum, p) => sum + (p.acreage || 0), 0) || 0;
    const averageValue = totalProperties > 0 ? totalValue / totalProperties : 0;
    const averageAcreage = totalProperties > 0 ? totalAcreage / totalProperties : 0;

    // Zoning breakdown
    const zoningMap = properties?.reduce((acc, p) => {
      const zoning = p.zoning || 'Unknown';
      if (!acc[zoning]) {
        acc[zoning] = { count: 0, totalValue: 0 };
      }
      acc[zoning].count++;
      acc[zoning].totalValue += p.tax_value || 0;
      return acc;
    }, {} as Record<string, { count: number; totalValue: number }>) || {};

    const zoningBreakdown = Object.entries(zoningMap).map(([zoning, data]) => ({
      zoning,
      count: data.count,
      totalValue: data.totalValue
    }));

    // Property type breakdown
    const typeMap = properties?.reduce((acc, p) => {
      const type = p.property_type || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>) || {};

    const propertyTypeBreakdown = Object.entries(typeMap).map(([type, count]) => ({
      type,
      count,
      percentage: totalProperties > 0 ? (count / totalProperties) * 100 : 0
    }));

    // Sales trend (last 6 months)
    const { data: recentSales, error: salesError } = await supabase
      .from('property_sales')
      .select('sale_date, sale_price')
      .gte('sale_date', new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000).toISOString())
      .order('sale_date', { ascending: true });

    const salesTrend = generateSalesTrend(recentSales || []);

    return {
      totalProperties,
      totalValue,
      totalAcreage,
      averageValue,
      averageAcreage,
      zoningBreakdown,
      propertyTypeBreakdown,
      salesTrend
    };
  } catch (error) {
    console.error('Error getting property analytics:', error);
    throw error;
  }
}

// Helper function to generate sales trend data
function generateSalesTrend(sales: Array<{ sale_date: string; sale_price: number }>) {
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const now = new Date();
  const trend = [];

  for (let i = 5; i >= 0; i--) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    
    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= monthDate && saleDate < nextMonthDate;
    });

    const salesCount = monthSales.length;
    const averagePrice = salesCount > 0 
      ? monthSales.reduce((sum, sale) => sum + sale.sale_price, 0) / salesCount 
      : 0;

    trend.push({
      month: monthNames[monthDate.getMonth()],
      averagePrice: Math.round(averagePrice),
      salesCount
    });
  }

  return trend;
}