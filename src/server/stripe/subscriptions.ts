"use server";

// 1. Supabase Client Import
import { createClient } from "@/lib/supabase/supabaseServerClient";

// 2. Stripe Client Import (from your lib folder)
import stripe from "@/lib/stripe";

// 3. Stripe Types Import (crucial for type safety)
import Stripe from "stripe";

// Removed crypto import - no longer needed since we're using invoice method

// Define a type for your Supabase subscription table's 'status' column.
// Ensure this matches your `public.subscription_status` ENUM in Supabase,
// especially if you've added 'paused' or other statuses.
type SupabaseSubscriptionStatus =
  | "trialing"
  | "active"
  | "past_due"
  | "canceled"
  | "unpaid"
  | "incomplete"
  | "incomplete_expired"
  | "ended"
  | "paused"; // Make sure 'paused' is in your DB ENUM if used

// Helper function to map Stripe's subscription status to your Supabase ENUM.
// This handles cases where Stripe might have statuses your DB doesn't yet.
function mapStripeStatusToSupabase(stripeStatus: Stripe.Subscription.Status): SupabaseSubscriptionStatus {
  switch (stripeStatus) {
    case "trialing":
    case "active":
    case "past_due":
    case "canceled":
    case "unpaid":
    case "incomplete":
    case "incomplete_expired":
    case "paused": // Direct match - ensure this is in your Supabase ENUM
      return stripeStatus as SupabaseSubscriptionStatus;
    default:
      // Log a warning if an unhandled Stripe status is encountered
      console.warn(`Unhandled Stripe subscription status: ${stripeStatus}. Defaulting to 'incomplete'.`);
      return "incomplete"; // Provide a fallback status for your database
  }
}

/**
 * Assigns a Stripe subscription to a tenant and generates an initial payment link (invoice).
 * Email sending for the payment link is handled externally by your application logic.
 *
 * @param tenantId The internal ID of the tenant from your Supabase database (UUID).
 * @param options Object containing either priceId or (productId, recurringInterval, overridePriceAmount, currency)
 * @returns An object indicating success/error, the Stripe Subscription ID, the invoice payment URL,
 * and tenant contact details for external email handling.
 */
export async function assignStripeSubscriptionToTenant(
  tenantId: string,
  options: {
    priceId?: string;
    productId?: string;
    recurringInterval?: Stripe.Price.Recurring.Interval;
    overridePriceAmount?: number;
    currency?: string;
  }
) {
  const supabase = await createClient();

  try {
    // 1. Fetch the tenant's Stripe Customer ID and contact details from Supabase.
    const { data: tenant, error: dbError } = await supabase
      .from("tenants")
      .select("stripe_customer_id, contact_email, name")
      .eq("id", tenantId)
      .single();

    console.log("tenant data:", tenant);
    console.log("tenant db error:", dbError);

    if (dbError || !tenant || !tenant.stripe_customer_id || !tenant.contact_email) {
      console.error("Database error or tenant not found/missing Stripe Customer ID/contact_email:", dbError?.message || "Tenant data missing");
      return { success: false, error: "Tenant not found or incomplete data." };
    }

    const stripeCustomerId = tenant.stripe_customer_id;
    const clientEmail = tenant.contact_email;
    const clientName = tenant.name || "Client";

    let subscription;
    let usedPriceId: string | null = null;
    let usedProductId: string | null = null;

    if (options.overridePriceAmount && options.productId && options.recurringInterval && options.currency) {
      // Use price_data for custom price
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [
          {
            price_data: {
              currency: options.currency,
              product: options.productId,
              unit_amount: Math.round(options.overridePriceAmount * 100),
              recurring: {
                interval: options.recurringInterval,
                interval_count: 1,
              },
            },
          },
        ],
        collection_method: "send_invoice",
        days_until_due: 7,
        metadata: {
          supabase_tenant_id: tenantId,
          assigned_by_portal: "true",
          custom_price: "true",
        },
      });
      usedPriceId = null; // Custom price, not a standard priceId
      usedProductId = options.productId;
    } else if (options.priceId) {
      // Use standard priceId
      subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: options.priceId }],
        collection_method: "send_invoice",
        days_until_due: 7,
        metadata: {
          supabase_tenant_id: tenantId,
          assigned_by_portal: "true",
        },
      });
      usedPriceId = options.priceId;
      // Try to get productId from the price
      const priceObj = await stripe.prices.retrieve(options.priceId);
      usedProductId = typeof priceObj.product === "string" ? priceObj.product : priceObj.product.id;
    } else {
      return { success: false, error: "Insufficient data: must provide either priceId or (productId, recurringInterval, overridePriceAmount, currency)." };
    }

    // Get the invoice for the subscription - it might be in draft status
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 1,
    });
    
    let invoice = invoices.data[0];
    if (!invoice) {
      console.error("Could not find any invoice for the new subscription.");
      return { success: false, error: "Failed to find invoice for subscription." };
    }

    // If the invoice is in draft status, finalize it to get the hosted URL
    if (invoice.status === "draft") {
      console.log("Invoice is in draft status, finalizing...");
      try {
        if (!invoice.id) {
          console.error("Invoice ID is missing");
          return { success: false, error: "Invoice ID is missing." };
        }
        invoice = await stripe.invoices.finalizeInvoice(invoice.id);
        console.log("Invoice finalized successfully");
      } catch (error) {
        console.error("Error finalizing invoice:", error);
        return { success: false, error: "Failed to finalize invoice." };
      }
    }

    if (!invoice.hosted_invoice_url) {
      console.error("Could not find hosted invoice URL for the new subscription.");
      return { success: false, error: "Failed to generate invoice payment link." };
    }

    let stripeProductId: string | null = null;
    if (subscription.items.data.length > 0) {
      const productField = subscription.items.data[0].price?.product;
      if (typeof productField === "object" && productField !== null) {
        stripeProductId = (productField as Stripe.Product).id;
      } else if (typeof productField === "string") {
        stripeProductId = productField;
      }
    }
    // If we used a custom productId, prefer that
    if (!stripeProductId && usedProductId) {
      stripeProductId = usedProductId;
    }

    const firstSubscriptionItem = subscription.items.data[0];
    if (!firstSubscriptionItem) {
      console.error("Subscription created but no items found. Cannot extract billing period dates.");
      return { success: false, error: "Subscription created but no items found." };
    }

    const currentPeriodStartISO = new Date(firstSubscriptionItem.current_period_start * 1000).toISOString();
    const currentPeriodEndISO = new Date(firstSubscriptionItem.current_period_end * 1000).toISOString();
    const canceledAtISO = subscription.canceled_at ? new Date(subscription.canceled_at * 1000).toISOString() : null;
    const endedAtISO = subscription.ended_at ? new Date(subscription.ended_at * 1000).toISOString() : null;
    const trialStartISO = subscription.trial_start ? new Date(subscription.trial_start * 1000).toISOString() : null;
    const trialEndISO = subscription.trial_end ? new Date(subscription.trial_end * 1000).toISOString() : null;
    // 4. INSERT the new subscription record into your Supabase 'public.subscriptions' table.

    if(!stripeProductId) {
      return { success: false, error: "Could not determine product ID for subscription." };
    }

    const { error: insertError } = await supabase.from("subscriptions").insert({
      stripe_subscription_id: subscription.id,
      tenant_id: tenantId,
      stripe_price_id: usedPriceId, // null if custom price
      stripe_product_id: stripeProductId || null, // Store the product ID for easier lookup/analysis
      status: mapStripeStatusToSupabase(subscription.status),
      current_period_start: currentPeriodStartISO,
      current_period_end: currentPeriodEndISO,
      cancel_at_period_end: subscription.cancel_at_period_end,
      canceled_at: canceledAtISO,
      ended_at: endedAtISO,
      trial_start: trialStartISO,
      trial_end: trialEndISO,
      metadata: subscription.metadata as Record<string, any>,
      
    });

    if (insertError) {
      console.error("Error inserting subscription into Supabase:", insertError.message);
      return { success: false, error: `Database sync failed: ${insertError.message}. Stripe subscription created.` };
    }


    console.log("invoice:", invoice.hosted_invoice_url);
    return {
      success: true,
      subscriptionId: subscription.id,
      invoicePaymentUrl: invoice.hosted_invoice_url,
      clientEmail: clientEmail,
      clientName: clientName,
      message: "Subscription assigned, DB updated, and invoice generated. Payment link ready for external email.",
    };
  } catch (error: any) {
    console.error("Error in assignStripeSubscriptionToTenant Server Action:", error);
    return { success: false, error: error.message || "An unknown error occurred while assigning the subscription." };
  }
}

// Removed createSubscriptionWithActivationLink - using invoice method as recommended by Stripe support

export async function createSubscriptionWithInvoice(
  customerId: string,
  priceId: string | null,
  customPrice?: number,
  metadata?: Record<string, string>
): Promise<{
  subscription: Stripe.Subscription;
  hostedInvoiceUrl: string;
}> {
  try {
    // Create subscription with send_invoice collection method
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: priceId
        ? [{ price: priceId }]
        : [
            {
              price_data: {
                currency: "eur",
                product: process.env.STRIPE_PRODUCT_ID!,
                unit_amount: customPrice! * 100,
                recurring: { interval: "month" },
              },
            },
          ],
      collection_method: "send_invoice",
      days_until_due: 30,
      metadata: metadata || {},
    });

    // Get the latest invoice
    const invoices = await stripe.invoices.list({
      subscription: subscription.id,
      limit: 1,
    });

    if (invoices.data.length === 0) {
      throw new Error("No invoice found for subscription");
    }

    let invoice = invoices.data[0];

    // If invoice is draft, finalize it
    if (invoice.status === "draft" && invoice.id) {
      invoice = await stripe.invoices.finalizeInvoice(invoice.id);
    }

    if (!invoice.hosted_invoice_url) {
      throw new Error("Could not find hosted invoice URL");
    }

    console.log("invoice:", invoice.hosted_invoice_url);

    return {
      subscription,
      hostedInvoiceUrl: invoice.hosted_invoice_url,
    };
  } catch (error) {
    console.error("Error creating subscription with invoice:", error);
    throw error;
  }
}
