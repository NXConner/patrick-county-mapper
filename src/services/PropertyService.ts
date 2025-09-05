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
    const { data } = await supabase
      .from('properties')
      .select('parcel_id, owner_name, property_address, acreage, tax_value, zoning, latitude, longitude')
      .eq('parcel_id', parcelId)
      .single();
    return (data as unknown as PropertyRecord) || null;
  }
}

export default PropertyService;

