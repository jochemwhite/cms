import { TenantForm } from "@/components/admin/forms/tenant-form";

export default function CreateTenantPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Create New Tenant</h1>
      <TenantForm />
    </div>
  )
}

