import { supabase } from '@/integrations/supabase/client';
import type { WorkspaceState } from './WorkspaceService';

export interface WorkspaceVersion {
  id: string;
  workspace_name: string;
  version: number;
  payload: WorkspaceState;
  created_at: string;
}

export class WorkspaceVersionsService {
  static async createVersion(workspaceName: string, payload: WorkspaceState): Promise<number> {
    const current = await this.getLatestVersion(workspaceName);
    const next = (current?.version ?? 0) + 1;
    const { error } = await supabase
      .from('workspace_versions')
      .insert({ workspace_name: workspaceName, version: next, payload });
    if (error) throw error;
    return next;
  }

  static async getLatestVersion(workspaceName: string): Promise<WorkspaceVersion | null> {
    const { data } = await supabase
      .from('workspace_versions')
      .select('*')
      .eq('workspace_name', workspaceName)
      .order('version', { ascending: false })
      .limit(1);
    if (!data || data.length === 0) return null;
    return data[0] as unknown as WorkspaceVersion;
  }

  static async list(workspaceName: string): Promise<WorkspaceVersion[]> {
    const { data } = await supabase
      .from('workspace_versions')
      .select('*')
      .eq('workspace_name', workspaceName)
      .order('version', { ascending: false });
    return (data || []) as unknown as WorkspaceVersion[];
  }
}

export default WorkspaceVersionsService;

