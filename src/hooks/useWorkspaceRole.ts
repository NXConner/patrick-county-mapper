import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useWorkspaceRole(workspaceName: string | null) {
  const [role, setRole] = useState<'owner' | 'editor' | 'viewer'>('owner');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!workspaceName) return;
    setLoading(true);
    (async () => {
      try {
        const user = (await supabase.auth.getUser()).data.user;
        if (!user) { if (mounted) setRole('viewer'); return; }
        const { data } = await supabase
          .from('workspace_members')
          .select('role')
          .eq('workspace_name', workspaceName)
          .eq('user_id', user.id)
          .limit(1);
        if (!mounted) return;
        if (data && data.length > 0) setRole((data[0].role as any) || 'viewer');
        else setRole('owner');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [workspaceName]);

  return { role, loading, isViewer: role === 'viewer', isEditor: role === 'editor' || role === 'owner' };
}

