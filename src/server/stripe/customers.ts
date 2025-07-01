"use server";

import { createClient } from "@/lib/supabase/supabaseServerClient";
import stripe from ".";

interface CreateStripeCustomerProps {
  email: string;
  name: string;
  phone: string;
  address: {
    line1: string;
    line2: string;
    city: string;
    state: string;
    postal_code: string;
    country: string;
  };
  tenantId: string;
}

export async function createStripeCustomer(props: CreateStripeCustomerProps) {
  const supabase = await createClient();
  let stripeCustomerId: string | null = null;

  try {
    const res = await stripe.customers.create({
      email: props.email,
      name: props.name,
      phone: props.phone,
      address: {
        line1: props.address.line1,
        line2: props.address.line2,
        city: props.address.city,
        state: props.address.state,
        postal_code: props.address.postal_code,
        country: props.address.country,
      },
    });

    stripeCustomerId = res.id;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to create Stripe customer");
  }

  const { data, error } = await supabase
    .from("tenants")
    .update({
      stripe_customer_id: stripeCustomerId,
    })
    .eq("id", props.tenantId);

  if (error) {
    throw new Error(error.message);
  }

  return data;
}
