"use client";

import { DeleteUser, UpdateUserRole } from "@/actions/authentication/user-management";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUserSession } from "@/providers/session-provider";
import { useUsers } from "@/providers/users-providers";
import { AvailableRole, UserForProvider } from "@/types/custom-supabase-types";
import type { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, Copy, Edit, MoreHorizontal, Trash2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import UserSheet from "../../sheets/user-sheet";
import { Modal } from "@/components/ui/modal";
import UserTableActions from "./user-table-actions";
import { GlobalRoleSelect } from "@/components/form-components/global-role-select";

// Helper function to format dates, handles null gracefully
const formatDate = (dateString: string | null) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

// Returns the role_type_id of the user's first role, or "no_role" if no roles are assigned
const getCurrentRole = (user: UserForProvider) => {
  return user.roles.length > 0 ? user.roles[0].role_type_id : "no_role";
};

// Utility to copy text to clipboard
const copyToClipboard = (text: string, label: string) => {
  navigator.clipboard.writeText(text);
  console.log(`${label} copied: ${text}`);
};

export const columns: ColumnDef<UserForProvider>[] = [
  {
    accessorKey: "avatar",
    header: () => <div className="text-right"></div>,
    cell: ({ row }) => {
      const user = row.original;
      return (
        <div className="text-right">
          <Avatar>
            <AvatarImage src={user.avatar || undefined} />
            <AvatarFallback>{user.first_name?.charAt(0) || "U"}</AvatarFallback>
          </Avatar>
        </div>
      );
    },
  },
  {
    accessorKey: "user",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold">
          User
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      const user = row.original;
      const { userSession } = useUserSession();
      const isUser = user.id === userSession?.user_info?.id;

      return (
        <div className="flex items-center space-x-2">
          <div className="font-medium">
            {user.first_name || user.last_name ? `${user.first_name || ""} ${user.last_name || ""}`.trim() : "Name not set"}
            {isUser && (
              <Badge variant="secondary" className="ml-2 w-fit">
                You
              </Badge>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "email",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold ">
          Email
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div>{row.getValue("email")}</div>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => {
      const { availableRoles } = useUsers();

      // Options for the role filter dropdown in the table header
      const rolesFilterOptions = [
        { id: "all", role_name: "All Roles", description: "Filter for all roles" },
        ...availableRoles, // Existing roles with their IDs and names
        { id: "no_role", role_name: "No Role", description: "Filter for users with no assigned role" },
      ];

      return (
        <div className="flex flex-col space-y-2">
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            className="h-auto p-0 font-semibold justify-start"
          >
            Role
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
          <Select
            value={(column.getFilterValue() as string) ?? "all"}
            onValueChange={(value) => column.setFilterValue(value === "all" ? undefined : value)}
          >
            <SelectTrigger className="h-8 w-[180px]">
              <SelectValue placeholder="Filter roles" />
            </SelectTrigger>
            <SelectContent>
              {rolesFilterOptions.map((role: AvailableRole, index: number) => (
                <SelectItem key={role.id} value={role.id}>
                  <div className="flex flex-col">
                    <span>{role.role_name}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    },
    cell: ({ row, table }) => {
      const user = row.original;
      const currentRoleTypeId = getCurrentRole(user); // Get the ID of the user's current role
      const { availableRoles } = useUsers();
      const { userSession } = useUserSession();
      // Example: Prevent editing a specific user's role (e.g., a hardcoded admin)
      const canEditRole = user.id !== userSession?.user_info?.id;

      const handleRoleChange = (newRoleTypeId: string) => {
        toast.promise(async() => {
          const response = await UpdateUserRole(user.id, newRoleTypeId);
          if (response.success) {
            return "Role updated successfully";
          }
          return response.error;
        }, {
          loading: "Updating role...",
          success: "Role updated successfully",
          error: "Failed to update role",
        });
      };

      return (
        <div className="flex flex-col space-y-2">
          {canEditRole ? (
            <GlobalRoleSelect
              value={currentRoleTypeId}
              onChange={handleRoleChange}
              placeholder="Select role"
            />
          ) : (
            <Badge variant="secondary" className="w-fit">
              {user.roles[0].role_name}
            </Badge>
          )}
        </div>
      );
    },
    filterFn: (row, id, value) => {
      // Filter function uses the role_type_id for comparison
      const user = row.original;
      const currentRole = getCurrentRole(user);
      return currentRole === value;
    },
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => {
      return (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")} className="h-auto p-0 font-semibold">
          Created
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
    cell: ({ row }) => {
      return <div className="text-sm">{formatDate(row.getValue("created_at"))}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Actions</div>,
    cell: ({ row, table }) => {
      const [open, setOpen] = useState(false);
      const user = row.original;
      const { userSession } = useUserSession();
      const { handleDeleteUser } = useUsers();
      const [showDeleteModal, setShowDeleteModal] = useState(false);

 

      const canEdit = user.id !== userSession?.user_info?.id;

      const handleCopy = (text: string, label: string) => {
        navigator.clipboard.writeText(text);
        toast.success(`${label} copied to clipboard`);
      };

      return (
        <UserTableActions user={user} canEdit={canEdit} />
      );
    },
  },
];


