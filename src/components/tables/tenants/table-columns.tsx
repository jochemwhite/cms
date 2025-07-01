"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { DataTableColumnHeader } from "@/components/tables/tenants/tenant-table-column-header";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export type Tenant = {
  id: string;
  name: string;
  billing_slug: string;
  logo_url: string | null;
  contact_email: string | null;
  created_at: string;
};

export const columns: ColumnDef<Tenant>[] = [
  {
    accessorKey: "logo_url",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Logo" />,
    cell: ({ row }) =>
      row.getValue("logo_url") ? (
        <img src={row.getValue("logo_url")} alt="Logo" className="h-8 w-8 rounded" />
      ) : null,
    enableSorting: false,
    enableHiding: true,
  },
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tenant Name" />,
    cell: ({ row }) => (
      <Link href={`/dashboard/tenants/${row.original.id}`}>{row.getValue("name")}</Link>
    ),
  },
  {
    accessorKey: "billing_slug",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Billing Slug" />,
  },
  {
    accessorKey: "contact_email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Contact Email" />,
    cell: ({ row }) => {
      const email = row.getValue("contact_email") as string | null;
      return email ? <Link href={`mailto:${email}`}>{email}</Link> : <span className="text-muted-foreground">No email</span>;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created At" />,
    cell: ({ row }) => {
      const createdAt = row.getValue("created_at");
      return createdAt ? new Date(createdAt as string).toLocaleDateString() : "N/A";
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
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
    ),
  },
];
