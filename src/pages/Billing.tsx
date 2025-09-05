import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const plans = [
  { id: 'community', name: 'Community', price: '$0', features: ['Public features', 'Basic tools'] },
  { id: 'pro', name: 'Pro', price: '$29/mo', features: ['AI jobs', 'Estimator v2', 'Export queue'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact', features: ['SLA', 'Custom overlays', 'SSO'] },
];

const Billing: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Billing & Plans</h1>
      <p className="text-muted-foreground mb-6">Choose a plan. Checkout integrates with Stripe (coming next).</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="p-4 flex flex-col">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-2xl font-bold mt-2">{p.price}</div>
            <ul className="mt-3 text-sm list-disc list-inside flex-1">
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Button className="mt-4" onClick={() => alert('Stripe checkout coming soon')}>Select</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Billing;

