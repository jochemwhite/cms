import { createClient } from "@/lib/supabase/supabaseServerClient";
import React from "react";
import TenantDetailsCard from "./TenantDetailsCard";
import AssignSubscriptionSection from "./AssignSubscriptionSection";
import stripe from "@/server/stripe";
import Stripe from "stripe";

// Type for the product/price structure
export interface ProductWithPrices {
  id: string;
  name: string;
  prices: {
    id: string;
    name: string;
    unit_amount: number;
    currency: string;
    recurringInterval: Stripe.Price.Recurring.Interval;
  }[];
}

async function getStripeProductsWithPrices(): Promise<ProductWithPrices[]> {
  try {
    const products = await stripe.products.list({ active: true, limit: 100 });
    const result: ProductWithPrices[] = [];
    for (const product of products.data) {
      const prices = await stripe.prices.list({
        product: product.id,
        active: true,
        type: "recurring",
        limit: 100,
      });
      const priceObjs = prices.data
        .filter((price) => price.unit_amount && price.currency && price.recurring)
        .map((price) => {
          const amount = (price.unit_amount! / 100).toFixed(2);
          const interval =
            price.recurring!.interval_count === 1
              ? price.recurring!.interval
              : `${price.recurring!.interval_count} ${price.recurring!.interval}s`;
          return {
            id: price.id,
            name: `$${amount}/${interval}` + (price.nickname ? ` (${price.nickname})` : ""),
            unit_amount: price.unit_amount!,
            currency: price.currency,
            recurringInterval: price.recurring!.interval,
          };
        });
      result.push({
        id: product.id,
        name: product.name,
        prices: priceObjs,
      });
    }
    return result;
  } catch (error) {
    console.error("Error fetching Stripe products/prices:", error);
    return [];
  }
}

export default async function TenantPage({ params }: { params: Promise<{ tenantId: string }> }) {
  const { tenantId } = await params;

  const supabase = await createClient();
  const { data, error } = await supabase.from("tenants").select("*").eq("id", tenantId).single();

  if (error || !data) {
    console.log(error);
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <h1 className="text-2xl font-bold mb-4">Tenant Not Found</h1>
        <p className="text-muted-foreground">{error ? error.message : "No tenant found for this ID."}</p>
      </div>
    );
  }

  const availableProducts = await getStripeProductsWithPrices();

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Tenant Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <TenantDetailsCard tenant={data} />
        <AssignSubscriptionSection
          tenantId={data.id}
          tenantName={data.name}
          availableProducts={availableProducts || []}
        />
      </div>
    </div>
  );
}
