import { supabase } from '@/integrations/supabase/client';

export interface PropertyRecord {
  parcel_id: string;
  owner_name: string | null;
  property_address: string | null;
  acreage: number | null;
  tax_value: number | null;
  zoning: string | null;
  latitude: number | null;
  longitude: number | null;
}

export class PropertyService {
  static async search(term: string): Promise<PropertyRecord[]> {
    const { data } = await supabase
      .from('properties')
      .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude')
      .or(`parcel_id.ilike.%${term}%,owner_name.ilike.%${term}%,property_address.ilike.%${term}%`)
      .limit(20);
    return (data || []) as unknown as PropertyRecord[];
  }

  static async getByParcel(parcelId: string): Promise<PropertyRecord | null> {
    const { data: prop } = await supabase
      .from('properties')
      .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude, id')
      .eq('parcel_id', parcelId)
      .single();
    if (!prop) return null as any;
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
      ...(prop as any),
      sales: sales || [],
      assessments: assessments || [],
      utilities: (utilities || []).map((u: any) => u.utility_name)
    } as any;
  }
}

export default PropertyService;

