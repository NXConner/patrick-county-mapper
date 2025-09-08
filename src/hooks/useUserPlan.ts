import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PlanId } from '@/lib/plan';

export function useUserPlan(): { plan: PlanId; loading: boolean } {
  const [plan, setPlan] = useState<PlanId>('unknown');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const u = (await supabase.auth.getUser()).data.user;
        if (!u) { if (mounted) setPlan('community'); return; }
        const { data } = (await (supabase.from('profiles' as any) as any).select('plan').eq('id', u.id).limit(1)) as any;
        const p = (data && data[0]?.plan) as PlanId | undefined;
        if (mounted) setPlan(p || 'community');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, []);

  return { plan, loading };
}

