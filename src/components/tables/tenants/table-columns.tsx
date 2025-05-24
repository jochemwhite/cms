"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Database } from "@/types/supabase";
import { DataTableColumnHeader } from "./tenant-table-column-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type TenantWithUserEmail = Database["public"]["Tables"]["tenants"]["Row"] & {
  users: Pick<Database["public"]["Tables"]["users"]["Row"], "email"> | null;
};

export const columns: ColumnDef<TenantWithUserEmail>[] = [
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
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant Name" />,
    cell: ({ row }) => {
      const tenantName = row.getValue("name") as string;
      return <Link href={`/dashboard/tenants/${row.original.id}`}>{tenantName}</Link>;
    },
  },
  {
    accessorKey: "plan",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Plan" />,
    cell: ({ row }) => {
      const plan = row.getValue("plan") as string;
      return <Badge variant={plan === "free" ? "secondary" : "default"}>{plan}</Badge>;
    },
  },
  {
    accessorKey: "contact_email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Primary Contact" />,
    cell: ({ row }) => {
      const email = row.original.users?.email;

      if (!email) {
        return <span className="text-muted-foreground">No email found</span>;
      }

      return <Link href={`mailto:${email}`}>{email}</Link>;
    },
  },

  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const createdAt = row.original.created_at;
      return <span>{createdAt ? new Date(createdAt).toLocaleDateString() : 'N/A'}</span>;
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return <Badge variant={status === "active" ? "secondary" : status === "inactive" ? "destructive" : "default"}>{status}</Badge>;
    },
  },

  {
    accessorKey: "actions",
    header: "Actions",
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Link href={`/dashboard/tenants/${row.original.id}`}>View details</Link>
            </DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
