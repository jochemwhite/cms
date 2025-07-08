// Supabase Edge Function for Stripe Webhooks
// Copy-paste this entire code into your Supabase Edge Function editor

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import Stripe from 'https://esm.sh/stripe@14.25.0?target=deno'

const stripe = Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

// Helper function to map Stripe subscription status to Supabase ENUM
function mapStripeStatusToSupabase(stripeStatus: string): string {
  const statusMap: Record<string, string> = {
    'trialing': 'trialing',
    'active': 'active', 
    'past_due': 'past_due',
    'canceled': 'canceled',
    'unpaid': 'unpaid',
    'incomplete': 'incomplete',
    'incomplete_expired': 'incomplete_expired',
    'paused': 'paused'
  }
  
  return statusMap[stripeStatus] || 'incomplete'
}

serve(async (req: Request) => {
  try {
    // Only allow POST requests
    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Get the raw body for signature verification
    const body = await req.text()
    const signature = req.headers.get('stripe-signature')

    if (!signature) {
      console.error('Missing stripe-signature header')
      return new Response('Missing signature', { status: 400 })
    }

    // Verify webhook signature
    let event
    try {
      const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')
      if (!webhookSecret) {
        throw new Error('Missing STRIPE_WEBHOOK_SECRET')
      }
      
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return new Response('Invalid signature', { status: 400 })
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    console.log('Processing webhook event:', event.type, 'ID:', event.id)

    // Handle different webhook events
    switch (event.type) {
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object
        console.log('Invoice payment succeeded:', invoice.id)

        // If this invoice belongs to a subscription, update our records
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id

          // Get the updated subscription from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Update subscription in our database
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: mapStripeStatusToSupabase(subscription.status),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
              canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
              ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
              trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
              trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (updateError) {
            console.error('Error updating subscription after payment:', updateError)
            return new Response('Database update error', { status: 500 })
          }

          console.log('✅ Subscription updated after successful payment:', subscriptionId)
          
          // Check if this was an iDEAL payment that should trigger SEPA setup
          if (invoice.payment_intent) {
            const paymentIntent = await stripe.paymentIntents.retrieve(
              typeof invoice.payment_intent === 'string' 
                ? invoice.payment_intent 
                : invoice.payment_intent.id
            )
            
            if (paymentIntent.payment_method) {
              const paymentMethod = await stripe.paymentMethods.retrieve(
                typeof paymentIntent.payment_method === 'string'
                  ? paymentIntent.payment_method
                  : paymentIntent.payment_method.id
              )
              
              if (paymentMethod.type === 'ideal') {
                console.log('🎉 iDEAL payment detected! SEPA should be automatically set up for future payments.')
                
                // Optionally, you could update subscription to use automatic collection
                // But Stripe should handle the iDEAL → SEPA transition automatically
                // Uncomment below if you want to explicitly switch to automatic collection:
                
                /*
                await stripe.subscriptions.update(subscriptionId, {
                  collection_method: 'charge_automatically'
                })
                console.log('✅ Subscription switched to automatic collection after iDEAL payment')
                */
              }
            }
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object
        console.log('Subscription updated:', subscription.id)

        // Update subscription in our database
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: mapStripeStatusToSupabase(subscription.status),
            current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            cancel_at_period_end: subscription.cancel_at_period_end,
            canceled_at: subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null,
            ended_at: subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null,
            trial_start: subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null,
            trial_end: subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null,
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating subscription:', updateError)
          return new Response('Database update error', { status: 500 })
        }

        console.log('✅ Subscription updated:', subscription.id)
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object
        console.log('Subscription deleted:', subscription.id)

        // Update subscription status to canceled
        const { error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'canceled',
            canceled_at: new Date().toISOString(),
            ended_at: new Date().toISOString(),
          })
          .eq('stripe_subscription_id', subscription.id)

        if (updateError) {
          console.error('Error updating deleted subscription:', updateError)
          return new Response('Database update error', { status: 500 })
        }

        console.log('✅ Subscription marked as deleted:', subscription.id)
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object
        console.log('Invoice payment failed:', invoice.id)

        // If this invoice belongs to a subscription, you might want to handle failed payments
        if (invoice.subscription) {
          const subscriptionId = typeof invoice.subscription === 'string' 
            ? invoice.subscription 
            : invoice.subscription.id

          // Get the updated subscription status from Stripe
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Update subscription status (likely will be 'past_due' or 'unpaid')
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: mapStripeStatusToSupabase(subscription.status),
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (updateError) {
            console.error('Error updating subscription after failed payment:', updateError)
            return new Response('Database update error', { status: 500 })
          }

          console.log('⚠️ Subscription updated after failed payment:', subscriptionId, 'Status:', subscription.status)
        }
        break
      }

      case 'checkout.session.completed': {
        const session = event.data.object
        console.log('Checkout session completed:', session.id)

        // Handle completed checkout sessions (if you still use any)
        if (session.subscription) {
          const subscriptionId = typeof session.subscription === 'string'
            ? session.subscription
            : session.subscription.id

          // Get the subscription details
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          // Update subscription status to active
          const { error: updateError } = await supabase
            .from('subscriptions')
            .update({
              status: mapStripeStatusToSupabase(subscription.status),
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_subscription_id', subscriptionId)

          if (updateError) {
            console.error('Error updating subscription after checkout:', updateError)
            return new Response('Database update error', { status: 500 })
          }

          console.log('✅ Subscription activated after checkout:', subscriptionId)
        }
        break
      }

      default:
        console.log('Unhandled event type:', event.type)
    }

    // Return success response
    return new Response(
      JSON.stringify({ received: true, event_type: event.type }), 
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }), 
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}) 