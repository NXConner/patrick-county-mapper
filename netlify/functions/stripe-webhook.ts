import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const secret = process.env.STRIPE_SECRET_KEY;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE;
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    if (!secret || !supabaseServiceKey || !supabaseUrl) {
      return { statusCode: 202, body: 'Webhook not configured' };
    }
    const stripe = require('stripe')(secret);
    const sig = event.headers['stripe-signature'] as string | undefined;
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let payload: any = event.body;
    if (endpointSecret && sig) {
      payload = stripe.webhooks.constructEvent(event.body, sig, endpointSecret);
    } else if (typeof payload === 'string') {
      try { payload = JSON.parse(payload); } catch {}
    }
    const { createClient } = require('@supabase/supabase-js');
    const admin = createClient(supabaseUrl, supabaseServiceKey);
    if (payload.type === 'checkout.session.completed') {
      const session = payload.data.object;
      const email = session.customer_details?.email as string | undefined;
      const plan = 'pro';
      if (email) {
        await admin.from('profiles').update({ plan }).eq('email', email);
      }
    }
    return { statusCode: 200, body: 'ok' };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Error' };
  }
};

