
import { columns } from "@/components/admin/tables/user-table/columns"
import { DataTable } from "@/components/admin/tables/user-table/user-table"

export default function UsersTable() {
  

  return (
    <div className="container mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Users Management</h1>
        <p className="text-muted-foreground">Manage user accounts, roles, and permissions.</p>
      </div>
      <DataTable

      />
    </div>
  )
}
