// src/pages/api/create-payment-intent.ts
// Server-side Stripe PaymentIntent creation
import Stripe from "stripe";

import type { APIRoute } from "astro";

export const POST: APIRoute = async ({ request }) => {
  const stripeSecretKey = import.meta.env.STRIPE_SECRET_KEY as string | undefined;

  if (!stripeSecretKey || stripeSecretKey.includes("REPLACE_WITH")) {
    return new Response(
      JSON.stringify({ error: "Stripe secret key not configured. Add STRIPE_SECRET_KEY to your .env file." }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const body = await request.json() as { amount: number; currency?: string; metadata?: Record<string, string> };
    const { amount, currency = "usd", metadata = {} } = body;

    if (!amount || amount < 50) {
      return new Response(
        JSON.stringify({ error: "Invalid amount. Minimum is $0.50." }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const stripe = new Stripe(stripeSecretKey);

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount), // amount in cents
      currency,
      // Enable all payment methods including Apple Pay, Google Pay, Link
      automatic_payment_methods: {
        enabled: true,
      },
      metadata,
    });

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
