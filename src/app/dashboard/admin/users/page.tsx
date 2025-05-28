import OpenUserSheetButton from "@/components/admin/buttons/open-user-sheet";
import { DataTable } from "@/components/admin/tables/user-table/user-table";
import { createClient } from "@/lib/supabase/supabaseServerClient";

export default async function UsersTable() {
  const supabase = await createClient();
  const { data: users, error } = await supabase.auth.getUser();

  if (error) {
    console.error(error);
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>
        </div>
        <OpenUserSheetButton />
      </div>
      <DataTable />
    </div>
  );
}
