import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';

interface TenantDetailsCardProps {
  tenant: any;
}

const TenantDetailsCard: React.FC<TenantDetailsCardProps> = ({ tenant }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tenant Information</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 space-y-1">
          <div><strong>ID:</strong> {tenant.id}</div>
          <div><strong>Name:</strong> {tenant.name}</div>
          <div><strong>Contact Email:</strong> {tenant.contact_email}</div>
          <div><strong>Stripe Customer ID:</strong> {tenant.stripe_customer_id}</div>
        </div>
        {tenant.subscriptions && tenant.subscriptions.length > 0 && (
          <div className="mt-4">
            <div className="font-semibold mb-2">Current Subscriptions:</div>
            <div className="space-y-2">
              {tenant.subscriptions.map((sub: any) => (
                <div key={sub.id} className="border rounded p-2">
                  <div><strong>Stripe Subscription ID:</strong> {sub.stripe_subscription_id}</div>
                  <div><strong>Status:</strong> {sub.status}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TenantDetailsCard; 