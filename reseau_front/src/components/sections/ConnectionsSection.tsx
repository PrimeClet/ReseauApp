import { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Monitor,
  Wifi,
  Router,
  Server,
  HardDrive,
  Cable,
  Filter,
  Plus,
  Pencil,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Liaison, Port, Equipement } from '@/contexts/DataContext';

interface ConnectionsSectionProps {
  liaisons: Liaison[];
  ports: Port[];
  equipements: Equipement[];
  currentEquipementId: number;
  onAddLiaison?: () => void;
  onLiaisonClick?: (liaison: Liaison) => void;
  onEditLiaison?: (liaison: Liaison) => void;
}

// Fonction pour obtenir l'icône du type de câble/média
const getCableIcon = (media?: string, cableType?: string, className?: string) => {
  const iconClass = className || 'h-5 w-5';
  const normalizedMedia = (media || cableType || '').toLowerCase();

  // Fibre optique
  if (normalizedMedia.includes('fibre') || normalizedMedia.includes('fiber') || normalizedMedia.includes('optique') || normalizedMedia.includes('sfp')) {
    return <Zap className={`${iconClass} text-yellow-500`} />;
  }

  // WiFi / Sans fil
  if (normalizedMedia.includes('wifi') || normalizedMedia.includes('wireless') || normalizedMedia.includes('radio') || normalizedMedia.includes('sans fil')) {
    return <Wifi className={`${iconClass} text-blue-500`} />;
  }

  // Ethernet / Cuivre (par défaut)
  return <Cable className={`${iconClass} text-gray-500`} />;
};

// Fonction pour formater le type de câble pour l'affichage
const formatCableType = (media?: string, cableType?: string): string => {
  if (cableType) return cableType;
  if (media) return media;
  return 'Câble réseau';
};

// Fonction pour obtenir l'icône d'équipement
const getEquipementIcon = (type: string, className?: string) => {
  const normalizedType = type?.toLowerCase() || '';
  const iconClass = className || 'h-4 w-4';

  if (normalizedType.includes('switch')) return <Monitor className={iconClass} />;
  if (normalizedType.includes('routeur') || normalizedType.includes('router')) return <Router className={iconClass} />;
  if (normalizedType.includes('serveur') || normalizedType.includes('server')) return <Server className={iconClass} />;
  if (normalizedType.includes('api') || normalizedType.includes('automate') || normalizedType.includes('camera') || normalizedType.includes('capteur')) return <Wifi className={iconClass} />;
  return <HardDrive className={iconClass} />;
};

// Déterminer si un équipement est un "device" réseau ou un "endpoint"
const isNetworkDevice = (type: string): boolean => {
  const normalizedType = type?.toLowerCase() || '';
  return normalizedType.includes('switch') ||
         normalizedType.includes('routeur') ||
         normalizedType.includes('router') ||
         normalizedType.includes('firewall');
};

// Composant pour une carte de liaison extensible
interface LiaisonCardProps {
  liaison: Liaison;
  fromPort: Port | undefined;
  toPort: Port | undefined;
  fromEquip: Equipement | undefined;
  toEquip: Equipement | undefined;
  onClick?: () => void;
  onEdit?: () => void;
}

const LiaisonCard = ({ liaison, fromPort, toPort, fromEquip, toEquip, onClick, onEdit }: LiaisonCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.();
  };

  // Formater la date
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div
      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      {/* Ligne principale - toujours visible */}
      <div className="flex items-center gap-3 p-4">
        {/* Chevron pour expand/collapse */}
        <button
          onClick={toggleExpand}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {isExpanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>

        {/* Équipement source avec port */}
        <div className="flex items-center gap-2">
          <span className="text-blue-600">
            {fromEquip ? getEquipementIcon(fromEquip.type) : <Monitor className="h-4 w-4" />}
          </span>
          <span className="font-medium text-blue-600">
            {fromEquip?.equipement_code || fromEquip?.name || 'N/A'}
          </span>
          {fromPort && (
            <span className="text-muted-foreground text-sm">({fromPort.port_label})</span>
          )}
        </div>

        {/* Icône de connexion avec type de câble */}
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="w-8 h-px bg-border" />
          {getCableIcon(liaison.media, liaison.cable_type, 'h-4 w-4')}
          <div className="w-8 h-px bg-border" />
        </div>

        {/* Équipement destination */}
        <div className="flex items-center gap-2">
          <span className="text-blue-600">
            {toEquip ? getEquipementIcon(toEquip.type) : <Monitor className="h-4 w-4" />}
          </span>
          <span className="font-medium text-blue-600">
            {toEquip?.equipement_code || toEquip?.name || 'N/A'}
          </span>
          {toPort && (
            <span className="text-muted-foreground text-sm">({toPort.port_label})</span>
          )}
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status badge */}
        <Badge
          variant={liaison.status ? "default" : "secondary"}
          className={liaison.status ? "bg-cyan-500 hover:bg-cyan-600 text-white" : ""}
        >
          {liaison.status ? 'Actif' : 'Inactif'}
        </Badge>
      </div>

      {/* Section détails - visible quand expanded */}
      {isExpanded && (
        <div className="border-t border-border bg-muted/30 p-4 space-y-4">
          {/* Infos de base en grille */}
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground text-xs">Support</p>
              <p className="font-medium">{liaison.media || 'Direct'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Continuité</p>
              <p className="font-medium">{liaison.cable_type || 'Direct'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Date de pose</p>
              <p className="font-medium">{formatDate(liaison.created_at)}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs">Dernière vérification</p>
              <p className="font-medium">{formatDate(liaison.updated_at)}</p>
            </div>
          </div>

          {/* Infos câble avec icône appropriée */}
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg border">
            {getCableIcon(liaison.media, liaison.cable_type)}
            <div className="flex-1">
              <p className="font-medium">{formatCableType(liaison.media, liaison.cable_type)}</p>
              <p className="text-sm text-muted-foreground">
                {liaison.length ? `${liaison.length}m` : 'Longueur non définie'}
                {liaison.label && ` - ${liaison.label}`}
              </p>
            </div>
            <Badge variant="outline">
              {liaison.status ? 'Actif' : 'Inactif'}
            </Badge>
          </div>

          {/* Description si disponible */}
          {liaison.description && (
            <p className="text-sm text-muted-foreground italic pl-2 border-l-2 border-muted">
              "{liaison.description}"
            </p>
          )}

          {/* Bouton d'édition */}
          {onEdit && (
            <div className="flex justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEdit}
                className="gap-2"
              >
                <Pencil className="h-4 w-4" />
                Modifier
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function ConnectionsSection({
  liaisons,
  ports,
  equipements,
  onAddLiaison,
  onLiaisonClick,
  onEditLiaison
}: ConnectionsSectionProps) {
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Enrichir les liaisons avec les données des ports et équipements
  const enrichedLiaisons = liaisons.map(liaison => {
    const fromPort = ports.find(p => p.id === liaison.from);
    const toPort = ports.find(p => p.id === liaison.to);
    const fromEquip = fromPort ? equipements.find(e => e.id === fromPort.equipement_id) : undefined;
    const toEquip = toPort ? equipements.find(e => e.id === toPort.equipement_id) : undefined;

    // Déterminer le type de connexion
    const fromIsDevice = fromEquip ? isNetworkDevice(fromEquip.type) : false;
    const toIsDevice = toEquip ? isNetworkDevice(toEquip.type) : false;

    let connectionType: 'device-device' | 'device-endpoint' | 'unknown';
    if (fromIsDevice && toIsDevice) {
      connectionType = 'device-device';
    } else if (fromIsDevice || toIsDevice) {
      connectionType = 'device-endpoint';
    } else {
      connectionType = 'unknown';
    }

    return {
      liaison,
      fromPort,
      toPort,
      fromEquip,
      toEquip,
      connectionType
    };
  });

  // Filtrer les liaisons
  const filteredLiaisons = enrichedLiaisons.filter(item => {
    if (typeFilter !== 'all' && item.connectionType !== typeFilter) return false;
    if (statusFilter === 'active' && !item.liaison.status) return false;
    if (statusFilter === 'inactive' && item.liaison.status) return false;
    return true;
  });

  // Grouper par type de connexion
  const deviceToDevice = filteredLiaisons.filter(l => l.connectionType === 'device-device');
  const deviceToEndpoint = filteredLiaisons.filter(l => l.connectionType === 'device-endpoint');
  const unknown = filteredLiaisons.filter(l => l.connectionType === 'unknown');

  return (
    <div className="space-y-6">
      {/* Header avec filtres */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Connexions</h3>
          <p className="text-sm text-muted-foreground">
            {filteredLiaisons.length} connexion(s) affichée(s)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Filter className="h-4 w-4 text-muted-foreground" />

          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tous les types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              <SelectItem value="device-device">Device → Device</SelectItem>
              <SelectItem value="device-endpoint">Device → Endpoint</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[160px]">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="inactive">Inactif</SelectItem>
            </SelectContent>
          </Select>

          {onAddLiaison && (
            <Button onClick={onAddLiaison} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Ajouter
            </Button>
          )}
        </div>
      </div>

      {/* Groupe Device → Device */}
      {deviceToDevice.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Monitor className="h-5 w-5 text-blue-600" />
              Liaisons Device → Device
              <Badge variant="secondary" className="ml-2">
                {deviceToDevice.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deviceToDevice.map((item) => (
              <LiaisonCard
                key={item.liaison.id}
                liaison={item.liaison}
                fromPort={item.fromPort}
                toPort={item.toPort}
                fromEquip={item.fromEquip}
                toEquip={item.toEquip}
                onClick={() => onLiaisonClick?.(item.liaison)}
                onEdit={onEditLiaison ? () => onEditLiaison(item.liaison) : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Groupe Device → Endpoint */}
      {deviceToEndpoint.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Wifi className="h-5 w-5 text-green-600" />
              Liaisons Device → Endpoint
              <Badge variant="secondary" className="ml-2">
                {deviceToEndpoint.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {deviceToEndpoint.map((item) => (
              <LiaisonCard
                key={item.liaison.id}
                liaison={item.liaison}
                fromPort={item.fromPort}
                toPort={item.toPort}
                fromEquip={item.fromEquip}
                toEquip={item.toEquip}
                onClick={() => onLiaisonClick?.(item.liaison)}
                onEdit={onEditLiaison ? () => onEditLiaison(item.liaison) : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Groupe Autres connexions */}
      {unknown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cable className="h-5 w-5 text-muted-foreground" />
              Autres connexions
              <Badge variant="secondary" className="ml-2">
                {unknown.length}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {unknown.map((item) => (
              <LiaisonCard
                key={item.liaison.id}
                liaison={item.liaison}
                fromPort={item.fromPort}
                toPort={item.toPort}
                fromEquip={item.fromEquip}
                toEquip={item.toEquip}
                onClick={() => onLiaisonClick?.(item.liaison)}
                onEdit={onEditLiaison ? () => onEditLiaison(item.liaison) : undefined}
              />
            ))}
          </CardContent>
        </Card>
      )}

      {/* Message si aucune connexion */}
      {filteredLiaisons.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Cable className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground mb-4">Aucune connexion trouvée</p>
            {onAddLiaison && (
              <Button onClick={onAddLiaison}>
                <Plus className="h-4 w-4 mr-2" />
                Ajouter une connexion
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
