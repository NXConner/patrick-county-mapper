import { supabase } from '@/integrations/supabase/client';
import type { MapUrlState } from '@/lib/urlState';

export interface Bookmark {
  id: string;
  title: string;
  state: MapUrlState;
  created_at: string;
}

export class BookmarksService {
  static async add(title: string, state: MapUrlState): Promise<string> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) throw new Error('Not authenticated');
    const { data, error } = await supabase
      .from('bookmarks')
      .insert({ title, state, user_id: user.id })
      .select('id')
      .single();
    if (error) throw error;
    return data.id as string;
  }

  static async list(): Promise<Bookmark[]> {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return [];
    const { data } = await supabase
      .from('bookmarks')
      .select('id, title, state, created_at')
      .order('created_at', { ascending: false });
    return (data || []) as unknown as Bookmark[];
  }

  static async remove(id: string): Promise<void> {
    await supabase.from('bookmarks').delete().eq('id', id);
  }
}

export default BookmarksService;

