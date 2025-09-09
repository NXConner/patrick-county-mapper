import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const secret = process.env.STRIPE_SECRET_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!secret || !supabaseServiceKey || !supabaseUrl) {
      return res.status(202).send('Webhook not configured');
    }
    const stripe = require('stripe')(secret);
    const sig = req.headers['stripe-signature'] as string | undefined;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event: any = req.body;
    if (endpointSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    }
    const { createClient } = require('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const email = session.customer_details?.email as string | undefined;
      const plan = 'pro';
      if (email) {
        await admin.from('profiles').update({ plan }).eq('email', email);
      }
    }
    return res.status(200).send('ok');
  } catch (e: any) {
    return res.status(500).send(e?.message || 'Error');
  }
}

