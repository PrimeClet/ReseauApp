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

    // Gérer les objets imbriqués (relations)
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      // Afficher les propriétés pertinentes des relations
      if (value.nom && value.code) {
        return <span className="text-foreground">{value.nom} ({value.code})</span>;
      }
      if (value.nom) {
        return <span className="text-foreground">{value.nom}</span>;
      }
      if (value.name && value.equipement_code) {
        return <span className="text-foreground">{value.name} ({value.equipement_code})</span>;
      }
      if (value.name) {
        return <span className="text-foreground">{value.name}</span>;
      }
      if (value.code) {
        return <span className="text-foreground">{value.code}</span>;
      }
      // Si c'est un objet complexe, afficher un résumé
      return <span className="text-muted-foreground text-sm">Objet relation</span>;
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          {Object.entries(data)
            .filter(([key]) => {
              // Exclure les champs système et les IDs si la relation existe
              if (key === 'ports' || key === 'created_at' || key === 'updated_at') return false;
              if (key.endsWith('_id')) {
                // Ne pas afficher l'ID si la relation existe (ex: coffret_id si coffret existe)
                const relationKey = key.replace('_id', '');
                return !data[relationKey];
              }
              return true;
            })
            .map(([key, value]) => (
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
        
        {/* Section Ports si disponible */}
        {data.ports && Array.isArray(data.ports) && data.ports.length > 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Ports associés ({data.ports.length})</h3>
            <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr className="text-left text-sm text-muted-foreground">
                    <th className="p-3">Label</th>
                    <th className="p-3">Appareil</th>
                    <th className="p-3">VLAN</th>
                    <th className="p-3">Vitesse</th>
                    <th className="p-3">PoE</th>
                  </tr>
                </thead>
                <tbody>
                  {data.ports.map((port: any) => (
                    <tr key={port.id} className="border-t border-border hover:bg-muted/50">
                      <td className="p-3 font-medium">{port.port_label || '-'}</td>
                      <td className="p-3">{port.device_name || '-'}</td>
                      <td className="p-3">{port.vlan || '-'}</td>
                      <td className="p-3">{port.speed || '-'}</td>
                      <td className="p-3">{port.poe_enabled ? 'Oui' : 'Non'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        
        {data.ports && Array.isArray(data.ports) && data.ports.length === 0 && (
          <div className="mt-6 border-t border-border pt-6">
            <h3 className="text-lg font-semibold text-foreground mb-2">Ports associés</h3>
            <p className="text-sm text-muted-foreground">Aucun port configuré pour cet équipement</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}