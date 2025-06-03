// "use client"

// import type { Column } from "@tanstack/react-table"
// import { Button } from "@/components/ui/button"
// import { cn } from "@/lib/utils"
// import { ChevronDownIcon } from "lucide-react"

// interface DataTableColumnHeaderProps<TData, TValue> {
//   column: Column<TData, TValue>
//   title: string
// }

// export function DataTableColumnHeader<TData, TValue>({ column, title }: DataTableColumnHeaderProps<TData, TValue>) {
//   if (!column.getCanSort()) {
//     return <div className="text-sm font-medium">{title}</div>
//   }

//   return (
//     <div className="flex items-center space-x-2">
//       <Button
//         variant="ghost"
//         size="sm"
//         onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
//       >
//         <span>{title}</span>
//         <ChevronDownIcon className={cn("h-4 w-4", column.getIsSorted() === "asc" && "rotate-180")} />
//       </Button>
//     </div>
//   )
// }

