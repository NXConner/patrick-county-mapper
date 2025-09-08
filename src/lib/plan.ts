export type PlanId = 'community' | 'pro' | 'enterprise' | 'unknown';

export function planAllows(feature: 'ai' | 'export' | 'estimator' | 'collab', plan: PlanId): boolean {
  if (plan === 'enterprise') return true;
  if (plan === 'pro') return feature !== 'collab';
  if (plan === 'community') return feature === 'estimator';
  return false;
}

