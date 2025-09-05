import { supabase } from '@/integrations/supabase/client';
import type { PropertyInfo } from '@/hooks/usePropertyData';

export async function fetchPropertyByParcelId(parcelId: string): Promise<PropertyInfo | null> {
  const { data: prop } = await supabase
    .from('properties')
    .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude, id')
    .eq('parcel_id', parcelId)
    .single();
  if (!prop) return null;
  const { data: sales } = await supabase
    .from('property_sales')
    .select('sale_date, sale_price, buyer_name, seller_name, deed_book, deed_page')
    .eq('property_id', (prop as any).id)
    .order('sale_date', { ascending: false });
  const { data: assessments } = await supabase
    .from('property_assessments')
    .select('assessment_year, land_value, improvement_value, total_value, exemptions, taxable_value')
    .eq('property_id', (prop as any).id)
    .order('assessment_year', { ascending: false });
  const { data: utilities } = await supabase
    .from('property_utilities')
    .select('utility_name')
    .eq('property_id', (prop as any).id);
  return {
    parcelId: (prop as any).parcel_id,
    owner: (prop as any).owner_name || undefined,
    address: (prop as any).property_address || undefined,
    acreage: (prop as any).acreage || 0,
    taxValue: (prop as any).tax_value || 0,
    zoning: (prop as any).zoning || 'Unknown',
    coordinates: (prop as any).latitude && (prop as any).longitude ? [(prop as any).latitude, (prop as any).longitude] : undefined,
    salesHistory: (sales || []).map((s: any) => ({ date: new Date(s.sale_date), price: s.sale_price, buyer: s.buyer_name, seller: s.seller_name, deedReference: s.deed_book ? `${s.deed_book}-${s.deed_page || ''}` : undefined })),
    utilities: (utilities || []).map((u: any) => u.utility_name)
  } as PropertyInfo;
}

export async function fetchPropertiesByLocation(coords: [number, number], radiusMiles = 1): Promise<PropertyInfo[]> {
  const [lat, lng] = coords;
  const { data } = await supabase
    .rpc('properties_within_radius', { p_lat: lat, p_lng: lng, p_radius_miles: radiusMiles })
    .select('*');
  return (data || []).map((p: any) => ({
    parcelId: p.parcel_id,
    owner: p.owner_name || undefined,
    address: p.property_address || undefined,
    acreage: p.acreage || 0,
    taxValue: p.tax_value || 0,
    zoning: p.zoning || 'Unknown',
    coordinates: (p.latitude && p.longitude) ? [p.latitude, p.longitude] : undefined,
  } as PropertyInfo));
}

export async function searchProperties(filters: { address?: string; owner?: string; minAcreage?: number; maxAcreage?: number; zoning?: string[]; }): Promise<PropertyInfo[]> {
  let query = supabase
    .from('properties')
    .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude')
    .limit(50);
  if (filters.address) query = query.ilike('property_address', `%${filters.address}%`);
  if (filters.owner) query = query.ilike('owner_name', `%${filters.owner}%`);
  if (filters.minAcreage) query = query.gte('acreage', filters.minAcreage);
  if (filters.maxAcreage) query = query.lte('acreage', filters.maxAcreage);
  if (filters.zoning && filters.zoning.length > 0) query = query.in('zoning', filters.zoning as any);
  const { data } = await query;
  return (data || []).map((p: any) => ({
    parcelId: p.parcel_id,
    owner: p.owner_name || undefined,
    address: p.property_address || undefined,
    acreage: p.acreage || 0,
    taxValue: p.tax_value || 0,
    zoning: p.zoning || 'Unknown',
    coordinates: (p.latitude && p.longitude) ? [p.latitude, p.longitude] : undefined,
  } as PropertyInfo));
}

export async function getPropertyAnalytics() {
  const { count } = await supabase.from('properties').select('*', { count: 'exact', head: true });
  return { totalProperties: count || 0 };
}

export default { fetchPropertyByParcelId, fetchPropertiesByLocation, searchProperties, getPropertyAnalytics };