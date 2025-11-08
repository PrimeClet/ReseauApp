import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Edit, X } from "lucide-react";
import StatusBadge from "../dashboard/StatusBadge";

interface DetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any;
  onEdit?: () => void;
}

export default function DetailsModal({ 
  open, 
  onOpenChange, 
  title, 
  data, 
  onEdit 
}: DetailsModalProps) {
  if (!data) return null;

  const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    const stringValue = String(value);
    
    if (key.toLowerCase().includes('état') || key.toLowerCase().includes('status') || key.toLowerCase().includes('etat')) {
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
    
    return <span className="text-foreground">{stringValue}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button variant="outline" size="sm" onClick={onEdit}>
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </DialogHeader>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {Object.entries(data).map(([key, value]) => (
            <div key={key} className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground capitalize">
                {key.replace(/_/g, ' ')}
              </label>
              <div className="text-foreground">
                {formatValue(key, value)}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}