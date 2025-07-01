"use client";
import { TenantForm } from "@/components/admin/forms/tenant-form";

export default function NewTenantPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">New Tenant</h1>
      <TenantForm  />
    </div>
  );
} 