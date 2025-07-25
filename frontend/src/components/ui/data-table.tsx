"use client"

import {
  type ColumnDef,
  type ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  type SortingState,
  useReactTable,
  type VisibilityState,
} from "@tanstack/react-table"
import { ArrowUpDown, ChevronDown, MoreHorizontal } from "lucide-react"

import * as React from "react"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export type Payment = {
  id: string
  amount: number
  status: "pending" | "processing" | "success" | "failed"
}
export function DataTable<TData, TValue>({
  columns,
  data,
  filterKey = "name",
  filterPlaceholder = "Фильтр...",
  rowSelectionMode = "multiple",
  onRowSelectionChange,
  onAmountChange,
  emptyMessage = "Нет данных.",
  searchQuery,
  setSearchQuery,
}: {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  filterKey?: string;
  filterPlaceholder?: string;
  rowSelectionMode?: "single" | "multiple";
  onRowSelectionChange?: (selectedIds: number[]) => void;
  onAmountChange?: (id: number, value: number) => void;
  emptyMessage?: string;
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
}) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    meta: {
      onAmountChange,
    },
    enableRowSelection: true,
    enableMultiRowSelection: rowSelectionMode === "multiple",
  })

  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedIds = table.getSelectedRowModel().rows.map(r => (r.original as any).id)
      onRowSelectionChange(selectedIds)
    }
    // eslint-disable-next-line
  }, [rowSelection])

  React.useEffect(() => {
    if (searchQuery !== undefined && setSearchQuery) {
      table.getColumn(filterKey)?.setFilterValue(searchQuery)
    }
    // eslint-disable-next-line
  }, [searchQuery])

  return (
    <div className="w-full font-base text-main-foreground">
      <div className="flex items-center py-4">
        <Input
          placeholder={filterPlaceholder}
          value={searchQuery ?? (table.getColumn(filterKey)?.getFilterValue() as string) ?? ""}
          onChange={event => setSearchQuery ? setSearchQuery(event.target.value) : table.getColumn(filterKey)?.setFilterValue(event.target.value)}
          className="max-w-sm"
        />
      </div>
      <div>
        <Table>
          <TableHeader className="font-heading">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                className="bg-secondary-background text-foreground"
                key={headerGroup.id}
              >
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead className="text-foreground" key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  className="bg-secondary-background text-foreground data-[state=selected]:bg-main/50 data-[state=selected]:text-foreground"
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="px-4 py-2" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext(),
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="text-foreground flex-1 text-sm">
          Выбрано {table.getFilteredSelectedRowModel().rows.length} пионеров
        </div>
        <div className="space-x-2">
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => table.getColumn("party")?.setFilterValue(1)}
          >
            1 отряд
          </Button>
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => table.getColumn("party")?.setFilterValue(2)}
          >
            2 отряд
          </Button>
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => table.getColumn("party")?.setFilterValue(3)}
          >
            3 отряд
          </Button>
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => table.getColumn("party")?.setFilterValue(4)}
          >
            4 отряд
          </Button>
          <Button
            type="button"
            variant="noShadow"
            size="sm"
            onClick={() => table.getColumn("party")?.setFilterValue("")}
          >
            Все
          </Button>
        </div>
      </div>
    </div>
  )
}
