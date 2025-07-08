import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import stripe from '@/lib/stripe';
import { createClient } from '@/lib/supabase/supabaseServerClient';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(request: NextRequest) {
  const body = await request.text();
  const headersList = await headers();
  const signature = headersList.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as any);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as any);
        break;
      case 'invoice.payment_succeeded':
        await handleInvoicePaymentSucceeded(event.data.object as any);
        break;
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  console.log('Checkout session completed:', session.id);
  
  if (session.mode === 'subscription' && session.subscription) {
    console.log('Subscription checkout completed:', session.subscription);
    
    // The subscription should be created automatically by Stripe
    // We'll handle the database sync in the subscription.created webhook
  }
}

async function handleSubscriptionCreated(subscription: any) {
  console.log('Subscription created:', subscription.id);
  
  const supabase = await createClient();
  
  try {
    // Get tenant ID from metadata
    const tenantId = subscription.metadata?.supabase_tenant_id;
    
    if (!tenantId) {
      console.error('No tenant ID found in subscription metadata');
      return;
    }
    
    // Get product and price info
    let stripeProductId: string | null = null;
    let stripePriceId: string | null = null;
    
    if (subscription.items?.data?.length > 0) {
      const firstItem = subscription.items.data[0];
      stripePriceId = firstItem.price?.id || null;
      
      const productField = firstItem.price?.product;
      if (typeof productField === "object" && productField !== null) {
        stripeProductId = productField.id;
      } else if (typeof productField === "string") {
        stripeProductId = productField;
      }
    }
    
    // Convert timestamps
    const currentPeriodStartISO = new Date(subscription.current_period_start * 1000).toISOString();
    const currentPeriodEndISO = new Date(subscription.current_period_end * 1000).toISOString();
    const canceledAtISO = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;
    const endedAtISO = subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null;
    const trialStartISO = subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null;
    const trialEndISO = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    
    // Insert subscription into database
    const { error: insertError } = await supabase.from("subscriptions").insert({
      stripe_subscription_id: subscription.id,
      tenant_id: tenantId,
      stripe_price_id: stripePriceId,
      stripe_product_id: stripeProductId,
      status: subscription.status,
      current_period_start: currentPeriodStartISO,
      current_period_end: currentPeriodEndISO,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: canceledAtISO,
      ended_at: endedAtISO,
      trial_start: trialStartISO,
      trial_end: trialEndISO,
      metadata: subscription.metadata,
    });

    if (insertError) {
      console.error('Error inserting subscription into database:', insertError);
    } else {
      console.log('Subscription synced to database:', subscription.id);
    }
    
  } catch (error) {
    console.error('Error handling subscription created:', error);
  }
}

async function handleSubscriptionUpdated(subscription: any) {
  console.log('Subscription updated:', subscription.id);
  
  const supabase = await createClient();
  
  const currentPeriodStartISO = new Date(subscription.current_period_start * 1000).toISOString();
  const currentPeriodEndISO = new Date(subscription.current_period_end * 1000).toISOString();
  const canceledAtISO = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;
  const endedAtISO = subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null;
  
  const { error } = await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      current_period_start: currentPeriodStartISO,
      current_period_end: currentPeriodEndISO,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: canceledAtISO,
      ended_at: endedAtISO,
      updated_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
    
  if (error) {
    console.error('Error updating subscription in database:', error);
  } else {
    console.log('Subscription updated in database:', subscription.id);
  }
}

async function handleInvoicePaymentSucceeded(invoice: any) {
  console.log('Invoice payment succeeded:', invoice.id);
  
  // For iDEAL + SEPA subscriptions, this confirms the payment went through
  // Stripe automatically handles the SEPA setup after successful iDEAL payment
  if (invoice.subscription) {
    console.log('Payment succeeded for subscription:', invoice.subscription);
  }
} 