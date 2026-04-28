"use client";

import type { ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/cms/pages/table/page-table-column-header";
import { CmsFormSubmission } from "@/actions/cms/form-actions";
import { Calendar } from "lucide-react";

interface FormField {
  key?: string;
  label?: string;
  type?: string;
}

export type FieldLabelMap = Map<string, FormField>;

export function buildFieldLabelMap(formContent: unknown): FieldLabelMap {
  const map = new Map<string, FormField>();
  if (!Array.isArray(formContent)) return map;
  for (const field of formContent) {
    if (field && typeof field === "object" && field.key) {
      map.set(field.key, field as FormField);
    }
  }
  return map;
}

function resolveLabel(key: string, fieldMap: FieldLabelMap): string {
  const field = fieldMap.get(key);
  if (field?.label) return field.label;
  return key
    .replace(/([A-Z])/g, " $1")
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .trim();
}

function extractContentPreview(content: unknown, fieldMap: FieldLabelMap): string {
  if (!content || typeof content !== "object") return "-";

  const entries = Object.entries(content as Record<string, unknown>);
  if (entries.length === 0) return "-";

  const preview = entries
    .slice(0, 3)
    .map(([key, value]) => {
      const label = resolveLabel(key, fieldMap);
      const val = typeof value === "string" ? value : JSON.stringify(value);
      const truncated = val && val.length > 40 ? val.slice(0, 40) + "..." : val;
      return `${label}: ${truncated || "-"}`;
    })
    .join(" · ");

  return entries.length > 3 ? `${preview} (+${entries.length - 3} more)` : preview;
}

function getContentFieldCount(content: unknown): number {
  if (!content || typeof content !== "object") return 0;
  return Object.keys(content as Record<string, unknown>).length;
}

export function createSubmissionColumns(fieldMap: FieldLabelMap): ColumnDef<CmsFormSubmission>[] {
  return [
    {
      accessorKey: "created_at",
      header: ({ column }) => <DataTableColumnHeader column={column} title="Submitted" />,
      cell: ({ row }) => {
        const date = row.getValue("created_at") as string;
        return (
          <div className="flex items-center text-sm">
            <Calendar className="mr-1.5 h-3.5 w-3.5 text-muted-foreground" />
            {new Date(date).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </div>
        );
      },
    },
    {
      accessorKey: "content",
      header: "Response Preview",
      cell: ({ row }) => {
        const content = row.getValue("content");
        return (
          <span className="text-sm text-muted-foreground">
            {extractContentPreview(content, fieldMap)}
          </span>
        );
      },
      enableSorting: false,
    },
    {
      id: "fields",
      header: "Fields",
      cell: ({ row }) => {
        const count = getContentFieldCount(row.original.content);
        return (
          <span className="text-sm tabular-nums">
            {count} {count === 1 ? "field" : "fields"}
          </span>
        );
      },
      enableSorting: false,
    },
  ];
}
