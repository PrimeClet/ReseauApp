import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Download, Upload, Eye, Edit, Search, X, Trash2, RotateCcw } from "lucide-react";
import StatusBadge from "../dashboard/StatusBadge";
import { PaginationEnhanced } from "./pagination-enhanced";
import ImportModal from "./import-modal";
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
} from "./alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface DataTableEnhancedProps {
  title: string;
  columns: string[];
  data: any[];
  onRowClick?: (row: any) => void;
  onEdit?: (row: any) => void;
  onDelete?: (id: number) => void;
  onRestore?: (id: number) => void;
  onImport?: (file: File) => Promise<void>;
  renderRowActions?: (row: any) => React.ReactNode;
  enableSearch?: boolean;
  enableFilters?: boolean;
  enableExport?: boolean;
  enableImport?: boolean;
  importModalTitle?: string;
  importTemplateColumns?: string[];
  importTemplateFileName?: string;
  customFilters?: React.ReactNode;
  customCellRenderers?: Record<string, (value: any, row: any) => React.ReactNode>;
  deleteConfirmTitle?: string;
  deleteConfirmDescription?: string;
  restoreConfirmTitle?: string;
  restoreConfirmDescription?: string;
  statusColumn?: string;
  deletedStatus?: string;
}

const usePagination = (data: any[], initialItemsPerPage = 5) => {
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

export default function DataTableEnhanced({
  title,
  columns,
  data,
  onRowClick,
  onEdit,
  onDelete,
  onRestore,
  onImport,
  renderRowActions,
  enableSearch = true,
  enableFilters = true,
  enableExport = true,
  enableImport = false,
  importModalTitle = "Importer des données",
  importTemplateColumns = [],
  importTemplateFileName = "modele_import.csv",
  customFilters,
  customCellRenderers,
  deleteConfirmTitle = "Confirmer la suppression",
  deleteConfirmDescription = "Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.",
  restoreConfirmTitle = "Confirmer la restauration",
  restoreConfirmDescription = "Êtes-vous sûr de vouloir restaurer cet élément ?",
  statusColumn = "Status",
  deletedStatus = "Supprimé"
}: DataTableEnhancedProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterColumn, setFilterColumn] = useState<string>("");
  const [filterValue, setFilterValue] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Filter and search data
  const filteredData = useMemo(() => {
    let filtered = data;

    // Colonnes à exclure du filtrage
    const excludedColumns = ['equipement_code', 'ip_address'];

    // Apply search
    if (searchTerm) {
      filtered = filtered.filter((row) =>
        Object.entries(row).some(([key, value]) => {
          // Exclure les colonnes equipement_code et ip_address de la recherche
          if (excludedColumns.includes(key)) {
            return false;
          }
          return String(value).toLowerCase().includes(searchTerm.toLowerCase());
        })
      );
    }

    // Apply column filter
    if (filterColumn && filterValue) {
      // Empêcher le filtrage sur les colonnes exclues
      if (!excludedColumns.includes(filterColumn)) {
        filtered = filtered.filter((row) =>
          String(row[filterColumn]).toLowerCase().includes(filterValue.toLowerCase())
        );
      }
    }

    return filtered;
  }, [data, searchTerm, filterColumn, filterValue]);

  const {
    currentPage,
    totalPages,
    itemsPerPage,
    paginatedData,
    handlePageChange,
    handleItemsPerPageChange
  } = usePagination(filteredData);

  const handleExport = () => {
    const csvContent = [
      columns.join(","),
      ...filteredData.map(row => 
        columns.map(col => `"${String(row[col] || '')}"`).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `${title.replace(/\s+/g, '_')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderCellContent = (value: any, column: string) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    const stringValue = String(value);

    // Mettre le nom en gras
    if (column.toLowerCase() === 'nom') {
      return <span className="text-foreground font-semibold">{stringValue}</span>;
    }

    if (column.toLowerCase().includes('état') || column.toLowerCase().includes('status') || column.toLowerCase().includes('etat')) {
      const statusMapping: { [key: string]: "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee" | "supprime" } = {
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
        'fermée': 'fermee',
        'supprimé': 'supprime',
        'supprime': 'supprime',
        'deleted': 'supprime'
      };
      
      const mappedStatus = statusMapping[stringValue.toLowerCase()] || 'ok';
      return <StatusBadge status={mappedStatus} />;
    }
    
    return <span className="text-foreground">{stringValue}</span>;
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterColumn("");
    setFilterValue("");
    setShowFilters(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-2">
          {enableImport && onImport && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsImportModalOpen(true)}
              className="bg-accent text-accent-foreground"
            >
              <Upload className="h-4 w-4 mr-2" />
              Importer
            </Button>
          )}
          {enableExport && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="bg-accent text-accent-foreground"
            >
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      {(enableSearch || showFilters || customFilters) && (
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            {enableSearch && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            )}

            {/* Custom Filters (sur la même ligne que la recherche) */}
            {customFilters}
          </div>

          {showFilters && (
            <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
              <Select value={filterColumn} onValueChange={setFilterColumn}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Colonne" />
                </SelectTrigger>
                <SelectContent>
                  {columns
                    .filter((column) => !['equipement_code', 'ip_address'].includes(column))
                    .map((column) => (
                    <SelectItem key={column} value={column}>
                      {column}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Input
                placeholder="Valeur à filtrer"
                value={filterValue}
                onChange={(e) => setFilterValue(e.target.value)}
                className="flex-1"
                disabled={!filterColumn}
              />

              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      <div className="rounded-lg border border-border bg-card">
        <Table>
          <TableHeader>
            <TableRow className="bg-table-header hover:bg-table-header">
              {columns.map((column) => (
                <TableHead key={column} className="text-primary-foreground font-medium">
                  {column}
                </TableHead>
              ))}
              {(onRowClick || onEdit || onDelete || onRestore || renderRowActions) && (
                <TableHead className="text-primary-foreground font-medium">Actions</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.map((row, index) => (
              <TableRow 
                key={index} 
                className="hover:bg-table-row-hover border-border cursor-pointer"
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((column, colIndex) => (
                  <TableCell key={colIndex} className="text-card-foreground">
                    {customCellRenderers?.[column]
                      ? customCellRenderers[column](row[column], row)
                      : renderCellContent(row[column], column)}
                  </TableCell>
                ))}
                {(onRowClick || onEdit || onDelete || onRestore || renderRowActions) && (
                  <TableCell className="text-card-foreground">
                    <div className="flex items-center gap-2">
                      {onRowClick && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRowClick(row);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                      {onEdit && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onEdit(row);
                          }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      )}
                      {/* Show Delete button if item is NOT deleted */}
                      {onDelete && row[statusColumn] !== deletedStatus && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{deleteConfirmTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {deleteConfirmDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onDelete(row.id)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              >
                                Supprimer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {/* Show Restore button if item IS deleted */}
                      {onRestore && row[statusColumn] === deletedStatus && (
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => e.stopPropagation()}
                              className="text-green-600 hover:text-green-600 hover:bg-green-600/10"
                            >
                              <RotateCcw className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>{restoreConfirmTitle}</AlertDialogTitle>
                              <AlertDialogDescription>
                                {restoreConfirmDescription}
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Annuler</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => onRestore(row.id)}
                                className="bg-green-600 text-white hover:bg-green-700"
                              >
                                Restaurer
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      )}
                      {renderRowActions?.(row)}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <PaginationEnhanced
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredData.length}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
      />

      {/* Import Modal */}
      {enableImport && onImport && (
        <ImportModal
          open={isImportModalOpen}
          onOpenChange={setIsImportModalOpen}
          title={importModalTitle}
          templateColumns={importTemplateColumns}
          templateFileName={importTemplateFileName}
          onImport={onImport}
        />
      )}
    </div>
  );
}