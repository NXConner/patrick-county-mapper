import { supabase } from '@/integrations/supabase/client';

export type WorkspaceRole = 'owner' | 'editor' | 'viewer';

export interface WorkspaceMember {
  id: string;
  workspace_name: string;
  user_id: string;
  role: WorkspaceRole;
  created_at: string;
}

export class WorkspaceMembersService {
  static async add(workspaceName: string, userId: string, role: WorkspaceRole): Promise<void> {
    const { error } = await supabase.from('workspace_members').insert({ workspace_name: workspaceName, user_id: userId, role });
    if (error) throw error;
  }

  static async list(workspaceName: string): Promise<WorkspaceMember[]> {
    const { data } = await supabase.from('workspace_members').select('*').eq('workspace_name', workspaceName);
    return (data || []) as unknown as WorkspaceMember[];
  }

  static async remove(id: string): Promise<void> {
    await supabase.from('workspace_members').delete().eq('id', id);
  }
}

export default WorkspaceMembersService;

