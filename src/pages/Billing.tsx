import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const plans = [
  { id: 'community', name: 'Community', price: '$0', features: ['Public features', 'Basic tools'] },
  { id: 'pro', name: 'Pro', price: '$29/mo', features: ['AI jobs', 'Estimator v2', 'Export queue'] },
  { id: 'enterprise', name: 'Enterprise', price: 'Contact', features: ['SLA', 'Custom overlays', 'SSO'] },
];

const Billing: React.FC = () => {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Billing & Plans</h1>
      <p className="text-muted-foreground mb-6">Choose a plan. Stripe checkout enabled when VITE_STRIPE_PK is set.</p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map(p => (
          <Card key={p.id} className="p-4 flex flex-col">
            <div className="text-lg font-semibold">{p.name}</div>
            <div className="text-2xl font-bold mt-2">{p.price}</div>
            <ul className="mt-3 text-sm list-disc list-inside flex-1">
              {p.features.map((f, i) => <li key={i}>{f}</li>)}
            </ul>
            <Button className="mt-4" onClick={async () => {
              try {
                if (!import.meta.env.VITE_STRIPE_PK) {
                  toast.error('Stripe not configured');
                  return;
                }
                const { loadStripe } = await import('@stripe/stripe-js');
                const stripe = await loadStripe(import.meta.env.VITE_STRIPE_PK as string);
                const resp = await fetch('/api/create-checkout-session', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ plan: p.id }) });
                const session = await resp.json();
                if (!stripe) return;
                await stripe.redirectToCheckout({ sessionId: session.id });
              } catch (e) {
                toast.error('Checkout failed');
              }
            }}>Select</Button>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Billing;

