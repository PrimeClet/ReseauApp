import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Filter, Download } from "lucide-react";
import StatusBadge from "./StatusBadge";
import { PaginationEnhanced } from "@/components/ui/pagination-enhanced";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface DataTableProps {
  title: string;
  columns: string[];
  data: any[];
  onFilter?: () => void;
  onExport?: () => void;
}

const usePagination = (data: any[], initialItemsPerPage = 10) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedData = data.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
  };

  return {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  };
};

export default function DataTable({ title, columns, data, onFilter, onExport }: DataTableProps) {
  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(data);

  const renderCellContent = (value: any, column: string) => {
    // Handle undefined/null values
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    // Convert to string for safety
    const stringValue = String(value);
    
    if (column.toLowerCase().includes('état') || column.toLowerCase().includes('status') || column.toLowerCase().includes('etat')) {
      // Map common status values to StatusType
      const statusMapping: { [key: string]: "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee" } = {
        'actif': 'actif',
        'active': 'actif', 
        'up': 'up',
        'en ligne': 'up',
        'maintenance': 'maintenance',
        'down': 'down',
        'inactif': 'down',
        'inactive': 'down',
        'hors service': 'down',
        'warn': 'warn',
        'warning': 'warn',
        'alerte': 'warn',
        'ok': 'ok',
        'fermee': 'fermee',
        'fermée': 'fermee'
      };
      
      const mappedStatus = statusMapping[stringValue.toLowerCase()] || 'ok';
      return <StatusBadge status={mappedStatus} />;
    }
    if (column.toLowerCase().includes('température')) {
      return <span className="text-foreground">{stringValue}</span>;
    }
    return <span className="text-foreground">{stringValue}</span>;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {onFilter && (
            <Button variant="outline" size="sm" onClick={onFilter}>
              <Filter className="h-4 w-4 mr-2" />
              Filtrer
            </Button>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} className="bg-accent text-accent-foreground">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              {columns.map((column) => (
                <TableHead key={column} className="text-primary-foreground font-medium">
                  {column}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow key={index} className="hover:bg-table-row-hover border-border">
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className="text-card-foreground">
                    {renderCellContent(row[column], column)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={data.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />
    </div>
  );
}