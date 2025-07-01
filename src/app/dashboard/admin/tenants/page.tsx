import { columns } from "@/components/tables/tenants/table-columns";
import { DataTable } from "@/components/tables/tenants/tenant-table";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { Button, buttonVariants } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export default async function TenantsPage() {
  const supabase = await createClient();
  const { data: tenants } = await supabase.from("tenants").select("*").order("created_at", { ascending: false });

  return (
    <div className="p-6">
      <div className="flex justify-between items-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Tenants Management</h1>
          <p className="text-muted-foreground">Manage tenants and their settings.</p>
        </div>
        <Link href="/dashboard/admin/tenants/new" className={buttonVariants({ variant: "outline" })}>
          <PlusIcon className="w-4 h-4" />
          Add Tenant
        </Link>
      </div>
      <DataTable columns={columns} data={(tenants ?? []).map(tenant => ({
        ...tenant,
        billing_slug: tenant.billing_slug ?? '',
        name: tenant.name ?? '',
        contact_email: tenant.contact_email,
        logo_url: tenant.logo_url,
        created_at: tenant.created_at ?? '',
        id: tenant.id
      }))} />
    </div>
  );
}