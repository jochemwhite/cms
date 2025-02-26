"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/types/supabase";
import { DataTableColumnHeader } from "./tenant-table-column-header";

export const columns: ColumnDef<Database["public"]["Tables"]["tenants"]["Row"]>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => <Checkbox checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "tenant_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant Name" />,
  },
  {
    accessorKey: "tenant_type",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant Type" />,
  },
  {
    accessorKey: "contact_email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact Email" />,
  },
  {
    accessorKey: "contact_name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact Name" />,
  },

  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "active" ? "secondary" : status === "inactive" ? "destructive" : "default"}>{status}</Badge>;
    },
  },
];
