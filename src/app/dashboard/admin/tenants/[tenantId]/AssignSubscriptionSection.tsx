// app/dashboard/tenants/[tenantId]/AssignSubscriptionSection.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { assignStripeSubscriptionToTenant } from "@/server/stripe/subscriptions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import type { ProductWithPrices } from "./page";

interface AssignSubscriptionSectionProps {
  tenantId: string;
  tenantName: string;
  availableProducts: ProductWithPrices[];
}

export default function AssignSubscriptionSection({ tenantId, tenantName, availableProducts }: AssignSubscriptionSectionProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [selectedPriceId, setSelectedPriceId] = useState<string>("");
  const [overridePrice, setOverridePrice] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [paymentUrl, setPaymentUrl] = useState<string>("");
  const [showPaymentUrl, setShowPaymentUrl] = useState<boolean>(false);
  const router = useRouter();

  // Find selected product and price objects
  const selectedProduct = availableProducts.find((p) => p.id === selectedProductId);
  const selectedPrice = selectedProduct?.prices.find((pr) => pr.id === selectedPriceId);

  // Reset price and override when product changes
  const handleProductChange = (value: string) => {
    setSelectedProductId(value);
    setSelectedPriceId("");
    setOverridePrice("");
  };

  // Reset override when price changes
  const handlePriceChange = (value: string) => {
    setSelectedPriceId(value);
    setOverridePrice("");
  };

  // If override changes, clear selectedPriceId
  const handleOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setOverridePrice(e.target.value);
    setSelectedPriceId("");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedProductId) {
      toast.error("Product Required", { description: "Please select a product." });
      return;
    }
    if (!selectedPriceId && !overridePrice) {
      toast.error("Price Required", { description: "Please select a price or enter an override." });
      return;
    }
    if (overridePrice) {
      const parsed = parseFloat(overridePrice);
      if (isNaN(parsed) || parsed <= 0) {
        toast.error("Invalid Override", { description: "Override price must be a positive number." });
        return;
      }
      if (!selectedProduct || !selectedPrice) {
        toast.error("Selection Error", { description: "Please select a product and a base price for override." });
        return;
      }
    }

    setIsLoading(true);
    const loadingToast = toast.loading("Creating Subscription", { description: "Please wait..." });
    try {
      let result;
      
      if (overridePrice && selectedProduct && selectedPrice) {
        // Use override pricing
        result = await assignStripeSubscriptionToTenant(tenantId, {
          productId: selectedProduct.id,
          recurringInterval: selectedPrice.recurringInterval,
          overridePriceAmount: parseFloat(overridePrice),
          currency: selectedPrice.currency,
        });
      } else if (selectedPriceId) {
        // Use standard price
        result = await assignStripeSubscriptionToTenant(tenantId, {
          priceId: selectedPriceId,
        });
      } else {
        toast.dismiss(loadingToast);
        toast.error("Selection Error", { description: "Please select a valid price or enter an override." });
        setIsLoading(false);
        return;
      }
      
      toast.dismiss(loadingToast);
      if (result.success) {
        toast.success("Subscription Assigned!", { description: result.message });
        if (result.invoicePaymentUrl) {
          setPaymentUrl(result.invoicePaymentUrl);
          setShowPaymentUrl(true);
        }
        router.refresh();
      } else {
        toast.error("Assignment Failed", { description: result.error || "An unknown error occurred." });
      }
    } catch (error: any) {
      toast.dismiss(loadingToast);
      toast.error("Error", { description: error.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Assign New Subscription</CardTitle>
        <CardDescription>
          Select a Stripe product and price to assign to {tenantName}. Customer will receive an invoice email where they can pay with iDEAL. Future charges will automatically use SEPA Direct Debit.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid w-full items-center gap-1.5">
            <Label htmlFor="product-select">Product</Label>
            <Select onValueChange={handleProductChange} value={selectedProductId}>
              <SelectTrigger id="product-select" className="w-full">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {availableProducts.length > 0 ? (
                  availableProducts.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No active products found
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="price-select">Price</Label>
              <Select onValueChange={handlePriceChange} value={selectedPriceId}>
                <SelectTrigger id="price-select" className="w-full">
                  <SelectValue placeholder="Select a price" />
                </SelectTrigger>
                <SelectContent>
                  {selectedProduct.prices.length > 0 ? (
                    selectedProduct.prices.map((price) => (
                      <SelectItem key={price.id} value={price.id}>
                        {price.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="" disabled>
                      No recurring prices found
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedProduct && selectedPrice && (
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="override-price">Override Price (optional)</Label>
              <Input
                id="override-price"
                type="number"
                min="0"
                step="0.01"
                placeholder={`e.g. ${(selectedPrice.unit_amount / 100).toFixed(2)}`}
                value={overridePrice}
                onChange={handleOverrideChange}
                disabled={!selectedProduct || !selectedPrice}
              />
              <span className="text-xs text-muted-foreground">Leave blank to use the selected price.</span>
            </div>
          )}
          
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>How it works:</strong> Customer receives an invoice email where they can pay with iDEAL. 
              Stripe automatically sets up SEPA Direct Debit during the iDEAL payment for future recurring charges.
            </p>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={
              isLoading ||
              !selectedProductId ||
              (!selectedPriceId && !overridePrice) ||
              (overridePrice ? isNaN(parseFloat(overridePrice)) || parseFloat(overridePrice) <= 0 : false)
            }
          >
            {isLoading ? "Creating Subscription..." : "Create Subscription & Send Invoice"}
          </Button>
        </form>
      </CardContent>
      
      {showPaymentUrl && (
        <CardContent className="border-t">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-green-600">✅ Subscription Created Successfully!</h3>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => {
                  setShowPaymentUrl(false);
                  setPaymentUrl("");
                }}
              >
                Close
              </Button>
            </div>
            
            <div className="bg-green-50 border border-green-200 rounded-md p-4">
              <div className="space-y-2">
                <p><strong>Customer:</strong> {tenantName}</p>
                <p><strong>Payment Invoice:</strong></p>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => navigator.clipboard.writeText(paymentUrl)}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📋 Copy Invoice URL
                    </button>
                    <a
                      href={`mailto:?subject=Your Subscription Invoice&body=Please pay your subscription invoice: ${paymentUrl}`}
                      className="text-blue-600 hover:text-blue-800 text-sm"
                    >
                      📧 Email Invoice
                    </a>
                  </div>
                  <p className="text-sm text-gray-600">
                    Invoice URL: <a href={paymentUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">{paymentUrl}</a>
                  </p>
                  <p className="text-sm text-gray-500">
                    Customer can pay with iDEAL. Future charges will be automatically processed via SEPA Direct Debit.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
