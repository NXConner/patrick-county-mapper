// Netlify Function: create Stripe Checkout session
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const body = JSON.parse(event.body || '{}');
    const plan = body.plan as string;
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return { statusCode: 500, body: 'Stripe not configured' };
    const stripe = require('stripe')(secret);
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      community: process.env.STRIPE_PRICE_COMMUNITY || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || ''
    };
    const price = priceMap[plan] || priceMap['pro'];
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.URL || 'http://localhost:5173'}/billing?success=1`,
      cancel_url: `${process.env.URL || 'http://localhost:5173'}/billing?canceled=1`
    });
    return { statusCode: 200, body: JSON.stringify({ id: session.id }) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message || 'Error' };
  }
};

