import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import { Edit, QrCode, Trash2 } from "lucide-react";
import StatusBadge from "../dashboard/StatusBadge";
import QRCodeModal from "./qr-code-modal";
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

interface DetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  data: any;
  onEdit?: () => void;
  onDelete?: () => void;
}

export default function DetailsModal({
  open,
  onOpenChange,
  title,
  data,
  onEdit,
  onDelete
}: DetailsModalProps) {
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  
  if (!data) return null;

  // Détecter si c'est un coffret (a un code et un nom) ou un équipement (a un equipement_code et un name)
  const isCoffret = data.code && data.nom;
  const isEquipement = data.equipement_code && data.name;
  const hasQRCode = data.qr_code;

  const getLabel = (key: string) => {
    // Mapping des labels personnalisés
    const labelMap: { [key: string]: string } = {
      'media': 'Type de liaison',
      'user': 'Utilisateur',
      'type_modification': 'Type de modification',
      'description': 'Description',
      'raison': 'Raison / Justification',
      'date_intervention': 'Date d\'intervention',
      'heure_intervention': 'Heure d\'intervention',
      'statut': 'Statut',
      'commentaire_validation': 'Commentaire de validation',
      'validated_by': 'Validé par',
      'validated_at': 'Date de validation',
    };
    return labelMap[key] || key.replace(/_/g, ' ');
  };

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
    
    if (key.toLowerCase().includes('état') || key.toLowerCase().includes('status') || key.toLowerCase().includes('etat') || key.toLowerCase().includes('statut')) {
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
        'fermée': 'fermee',
        'en attente': 'warn',
        'approuvée': 'ok',
        'approuvee': 'ok',
        'rejetée': 'down',
        'rejetee': 'down',
        'en révision': 'maintenance',
        'en_revision': 'maintenance',
      };
      
      const mappedStatus = statusMapping[stringValue.toLowerCase()] || 'ok';
      return <StatusBadge status={mappedStatus} />;
    }

    // Formatage pour validated_at
    if (key === 'validated_at' || key === 'created_at' || key === 'updated_at') {
      try {
        const date = new Date(stringValue);
        return <span className="text-foreground">{date.toLocaleString('fr-FR')}</span>;
      } catch {
        return <span className="text-foreground">{stringValue}</span>;
      }
    }
    
    return <span className="text-foreground">{stringValue}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between relative">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>
            <div className="absolute right-14 top-0 flex gap-2">
              {hasQRCode && (isCoffret || isEquipement) && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsQRCodeOpen(true)}
                >
                  <QrCode className="h-4 w-4 mr-2" />
                  QR Code
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Modifier
                </Button>
              )}
              {onDelete && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Supprimer
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                      <AlertDialogDescription>
                        Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Annuler</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={onDelete}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Supprimer
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {Object.entries(data)
            .filter(([key]) => {
              // Exclure les champs système, les IDs si la relation existe, et les relations de localisation
              if (key === 'ports' || key === 'created_at' || key === 'updated_at') return false;
              if (key === 'coffret' || key === 'batiment' || key === 'salle') return false;
              if (key === 'qr_code') return false; // Exclure le QR code du rendu texte
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
                  {getLabel(key)}
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
                    <th className="p-3">Libellé</th>
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

      {/* Modal QR Code pour les coffrets et équipements */}
      {hasQRCode && (isCoffret || isEquipement) && (
        <QRCodeModal
          open={isQRCodeOpen}
          onOpenChange={setIsQRCodeOpen}
          qrCode={data.qr_code}
          title={isCoffret ? (data.nom || data.code) : (data.name || data.equipement_code)}
          subtitle={isCoffret
            ? (data.batiment?.nom || data.salle?.nom || data.piece || '')
            : (data.coffret?.nom || data.type || '')}
          type={isCoffret ? 'coffret' : 'equipement'}
          code={isCoffret ? data.code : data.equipement_code}
        />
      )}
    </Dialog>
  );
}