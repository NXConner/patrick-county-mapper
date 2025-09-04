import { supabase } from '@/integrations/supabase/client';

export interface CostItem {
  id: string;
  code: string;
  name: string;
  unit: string;
  unit_cost: number;
  material_type?: string | null;
  notes?: string | null;
}

export interface CostCatalog {
  id: string;
  region: string;
  is_default: boolean;
  items: CostItem[];
}

export class CostCatalogService {
  static async createCatalog(region: string, isDefault = false): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    const { data, error } = await supabase
      .from('cost_catalog')
      .insert({ region, is_default: isDefault, created_by: user?.id ?? null })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  static async addItem(catalogId: string, item: Omit<CostItem, 'id'>): Promise<string> {
    const { data, error } = await supabase
      .from('cost_items')
      .insert({ catalog_id: catalogId, ...item })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  static async getCatalog(id: string): Promise<CostCatalog | null> {
    const { data: cat, error: catErr } = await supabase.from('cost_catalog').select('*').eq('id', id).single();
    if (catErr || !cat) return null;
    const { data: items } = await supabase.from('cost_items').select('*').eq('catalog_id', id);
    return { id, region: cat.region, is_default: !!cat.is_default, items: (items || []) as any };
  }

  static async getDefault(): Promise<CostCatalog | null> {
    const { data: cats } = await supabase.from('cost_catalog').select('*').eq('is_default', true).limit(1);
    if (!cats || cats.length === 0) return null;
    return await this.getCatalog(cats[0].id as string);
  }
}

export default CostCatalogService;

