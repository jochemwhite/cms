"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreVertical, Settings2, Trash2, Eye, EyeOff, Calendar } from "lucide-react";
import { DataTableColumnHeader } from "@/components/cms/pages/table/page-table-column-header";
import { CmsForm } from "@/actions/cms/form-actions";
import { useUserSession } from "@/providers/session-provider";

interface FormTableActionsProps {
  form: CmsForm;
  onTogglePublish: (form: CmsForm) => void;
  onArchive: (form: CmsForm) => void;
  onOpenBuilder: (formId: string) => void;
}

function FormTableActions({ form, onTogglePublish, onArchive, onOpenBuilder }: FormTableActionsProps) {
  const { userSession } = useUserSession();
  const isSystemAdmin = userSession?.global_roles?.some((role) => role === "system_admin");

  if (!isSystemAdmin) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onOpenBuilder(form.id)}>
          <Settings2 className="mr-2 h-4 w-4" />
          Open Builder
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onTogglePublish(form)}>
          {form.published ? (
            <>
              <EyeOff className="mr-2 h-4 w-4" />
              Unpublish
            </>
          ) : (
            <>
              <Eye className="mr-2 h-4 w-4" />
              Publish
            </>
          )}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Archive
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Archive Form</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to archive &quot;{form.name}&quot;? This will hide the form and its submissions.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onArchive(form)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Archive
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export const createFormColumns = (
  onTogglePublish: (form: CmsForm) => void,
  onArchive: (form: CmsForm) => void,
  onOpenBuilder: (formId: string) => void,
): ColumnDef<CmsForm>[] => [
  {
    accessorKey: "name",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Name" />,
    cell: ({ row }) => (
      <div>
        <div className="font-medium">{row.getValue("name")}</div>
        {row.original.description && (
          <div className="text-sm text-muted-foreground truncate max-w-[250px]">
            {row.original.description}
          </div>
        )}
      </div>
    ),
  },
  {
    accessorKey: "published",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    cell: ({ row }) => {
      const published = row.getValue("published") as boolean;
      return (
        <Badge variant={published ? "default" : "secondary"}>
          {published ? "Published" : "Draft"}
        </Badge>
      );
    },
    filterFn: (row, id, value) => {
      if (value === "all") return true;
      const published = row.getValue(id) as boolean;
      return value === "published" ? published : !published;
    },
  },
  {
    accessorKey: "submissions",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Submissions" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.getValue("submissions") as number}</span>
    ),
  },
  {
    accessorKey: "visits",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Visits" />,
    cell: ({ row }) => (
      <span className="tabular-nums">{row.getValue("visits") as number}</span>
    ),
  },
  {
    accessorKey: "created_at",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Created" />,
    cell: ({ row }) => {
      const date = row.getValue("created_at") as string;
      return (
        <div className="flex items-center text-sm text-muted-foreground">
          <Calendar className="mr-1.5 h-3.5 w-3.5" />
          {new Date(date).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <div onClick={(e) => e.stopPropagation()}>
        <FormTableActions
          form={row.original}
          onTogglePublish={onTogglePublish}
          onArchive={onArchive}
          onOpenBuilder={onOpenBuilder}
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
];
