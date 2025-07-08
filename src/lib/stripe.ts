// src/lib/stripe.ts
import Stripe from "stripe";

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error("STRIPE_SECRET_KEY is not defined in environment variables");
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  // IMPORTANT: Set this to your actual Stripe API version.
  // You can find it in your Stripe Dashboard under Developers > API keys.
  // Using an older/newer version than your keys are configured for can lead to unexpected behavior.
  apiVersion: "2025-05-28.basil", // Example: '2024-06-20'
  typescript: true, // This enables better type inference for Stripe objects
});

export default stripe;
