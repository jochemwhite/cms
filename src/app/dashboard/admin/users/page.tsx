import { columns } from "@/components/admin/tables/user-table/columns";
import { DataTable } from "@/components/admin/tables/user-table/user-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function UsersTable() {
  


  return (
    <div className="container mx-auto py-10">
      <div className="flex justify-between items-center">
        <div className="mb-8">
          <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
          <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create User
        </Button>
      </div>
      <DataTable />
    </div>
  );
}
