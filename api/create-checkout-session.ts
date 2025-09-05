// Vercel serverless function: create Stripe Checkout session
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
    const { plan } = req.body || {};
    const secret = process.env.STRIPE_SECRET_KEY;
    if (!secret) return res.status(500).send('Stripe not configured');
    const stripe = require('stripe')(secret);
    const priceMap: Record<string, string> = {
      pro: process.env.STRIPE_PRICE_PRO || '',
      community: process.env.STRIPE_PRICE_COMMUNITY || '',
      enterprise: process.env.STRIPE_PRICE_ENTERPRISE || ''
    };
    const price = priceMap[plan as string] || priceMap['pro'];
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price, quantity: 1 }],
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'}/billing?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173'}/billing?canceled=1`
    });
    res.status(200).json({ id: session.id });
  } catch (e: any) {
    res.status(500).send(e?.message || 'Error');
  }
}

