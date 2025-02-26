import { columns } from "@/components/tables/tenants/table-columns";
import { DataTable } from "@/components/tables/tenants/tenant-table";
import { Button } from "@/components/ui/button";
import { createClient } from "@/lib/supabase/supabaseServerClient";
import { checkPagePermissions } from "@/server/auth/checkPagePermissions";
import Link from "next/link";
import React from "react";

export default async function page() {
  await checkPagePermissions({
    requiredRole: "system_admin",
    unauthorizedRedirectPath: "/dashboard",
  });

  const supabase = await createClient();

  const { data, error } = await supabase.from("tenants").select("*");

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold">Tenants</h1>

        <Link href="/dashboard/tenants/create">
          <Button>Create Tenant</Button>
        </Link>
      </div>

      <DataTable columns={columns} data={data ?? []} />
    </div>
  );
}
