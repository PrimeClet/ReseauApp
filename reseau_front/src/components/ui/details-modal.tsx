import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./dialog";
import { Button } from "./button";
import {
  Edit,
  QrCode,
  Trash2,
  Network,
  ArrowRight,
  Cable,
  Ruler,
  ArrowUpDown,
  Tag,
  Server,
  Monitor,
  Router,
  Wifi,
  HardDrive,
  Printer,
  Laptop,
  Computer,
  Building2,
  MapPin,
  DoorOpen,
  Layers,
  Plug,
  Activity,
  Clock,
  User,
  FileText,
  Settings,
  Info,
  Hash,
  Globe,
  Shield,
  Zap,
  Loader2
} from "lucide-react";
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
  onDelete?: () => void | Promise<void>;
  entityType?: string;
}

// Mapping des icônes par type d'entité
const entityIconMap: Record<string, { icon: any; color: string; bgColor: string }> = {
  'coffret': { icon: Server, color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  'armoire': { icon: Server, color: 'text-teal-600', bgColor: 'bg-teal-100 dark:bg-teal-900/30' },
  'equipement': { icon: Monitor, color: 'text-violet-600', bgColor: 'bg-violet-100 dark:bg-violet-900/30' },
  'switch': { icon: Network, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'routeur': { icon: Router, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'router': { icon: Router, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'firewall': { icon: Shield, color: 'text-red-600', bgColor: 'bg-red-100 dark:bg-red-900/30' },
  'point-acces': { icon: Wifi, color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
  'serveur': { icon: HardDrive, color: 'text-slate-600', bgColor: 'bg-slate-100 dark:bg-slate-900/30' },
  'imprimante': { icon: Printer, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  'ordinateur-portable': { icon: Laptop, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  'ordinateur-bureau': { icon: Computer, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
  'prise_murale': { icon: Plug, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'site': { icon: MapPin, color: 'text-rose-600', bgColor: 'bg-rose-100 dark:bg-rose-900/30' },
  'zone': { icon: Layers, color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
  'batiment': { icon: Building2, color: 'text-sky-600', bgColor: 'bg-sky-100 dark:bg-sky-900/30' },
  'salle': { icon: DoorOpen, color: 'text-emerald-600', bgColor: 'bg-emerald-100 dark:bg-emerald-900/30' },
  'port': { icon: Plug, color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
  'liaison': { icon: Cable, color: 'text-amber-600', bgColor: 'bg-amber-100 dark:bg-amber-900/30' },
  'vlan': { icon: Globe, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  'lan': { icon: Globe, color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
  'maintenance': { icon: Settings, color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
  'modification': { icon: FileText, color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
  'user': { icon: User, color: 'text-indigo-600', bgColor: 'bg-indigo-100 dark:bg-indigo-900/30' },
  'default': { icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-100 dark:bg-gray-900/30' },
};

// Mapping des labels personnalisés
const labelMap: Record<string, string> = {
  'media': 'Type de liaison',
  'direction': 'Direction du flux',
  'user': 'Utilisateur',
  'type_modification': 'Type de modification',
  'description': 'Description',
  'raison': 'Raison / Justification',
  'date_intervention': 'Date d\'intervention',
  'heure_intervention': 'Heure d\'intervention',
  'statut': 'Statut',
  'status': 'Statut',
  'commentaire_validation': 'Commentaire de validation',
  'validated_by': 'Validé par',
  'validated_at': 'Date de validation',
  'emplacement': 'Emplacement détaillé',
  'modele': 'Modèle',
  'long': 'Longitude',
  'lat': 'Latitude',
  'port_genre': 'Genre de port',
  'nom': 'Nom',
  'name': 'Nom',
  'code': 'Code',
  'equipement_code': 'Code équipement',
  'type': 'Type',
  'type_reseau': 'Type réseau',
  'ip_address': 'Adresse IP',
  'mac_address': 'Adresse MAC',
  'vlan': 'VLAN',
  'vlan_id': 'ID VLAN',
  'subnet': 'Sous-réseau',
  'gateway': 'Passerelle',
  'fabricant': 'Fabricant',
  'numero_serie': 'N° de série',
  'nombre_ports': 'Nombre de ports',
  'is_principal': 'Switch principal',
  'is_manageable': 'Manageable',
  'libelle': 'Libellé',
  'adresse': 'Adresse',
  'ville': 'Ville',
  'code_postal': 'Code postal',
  'pays': 'Pays',
  'etage': 'Étage',
  'capacite': 'Capacité',
  'superficie': 'Superficie',
  'port_label': 'Label du port',
  'speed': 'Vitesse',
  'poe_enabled': 'PoE activé',
  'connexion_type': 'Type de connexion',
  'device_name': 'Appareil connecté',
  'longueur': 'Longueur',
  'actif': 'État',
};

export default function DetailsModal({
  open,
  onOpenChange,
  title,
  data,
  onEdit,
  onDelete,
  entityType
}: DetailsModalProps) {
  const [isQRCodeOpen, setIsQRCodeOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Détecter le type d'entité (fonction mémorisée pour éviter les appels conditionnels de hooks)
  const currentEntityType = useMemo(() => {
    if (!data) return 'default';
    if (entityType) return entityType.toLowerCase();
    if (data.code && data.nom && !data.equipement_code) return 'coffret';
    if (data.equipement_code || (data.name && data.type)) {
      const type = data.type?.toLowerCase();
      if (type && entityIconMap[type]) return type;
      return 'equipement';
    }
    if (data.media || data.port_source || data.port_destination) return 'liaison';
    if (data.vlan_id && data.subnet) return 'vlan';
    if (data.port_label) return 'port';
    if (data.batiment_id && data.etage !== undefined) return 'salle';
    if (data.zone_id && !data.batiment_id) return 'batiment';
    if (data.site_id && !data.zone_id) return 'zone';
    if (data.libelle && data.adresse) return 'site';
    return 'default';
  }, [data, entityType]);

  const entityConfig = entityIconMap[currentEntityType] || entityIconMap['default'];
  const IconComponent = entityConfig.icon;

  // Nom principal à afficher
  const getEntityName = (): string => {
    return data?.nom || data?.name || data?.libelle || data?.code || data?.equipement_code || data?.port_label || 'Sans nom';
  };

  // Code ou identifiant secondaire
  const getEntityCode = (): string | null => {
    if (data?.code && data?.nom) return data.code;
    if (data?.equipement_code && data?.name) return data.equipement_code;
    return null;
  };

  const isCoffret = currentEntityType === 'coffret' || currentEntityType === 'armoire';
  const isEquipement = currentEntityType === 'equipement' || ['switch', 'routeur', 'router', 'firewall', 'point-acces', 'serveur', 'imprimante', 'ordinateur-portable', 'ordinateur-bureau', 'prise_murale'].includes(currentEntityType);
  const isLiaison = currentEntityType === 'liaison';
  const hasQRCode = data?.qr_code;

  // Photo
  const hasPhoto = data?.photo_url || data?.photo;
  const photoUrl = data?.photo_url || null;

  const getLabel = (key: string) => {
    return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatValue = (key: string, value: any) => {
    if (value === undefined || value === null) {
      return <span className="text-muted-foreground">-</span>;
    }

    // Booléens
    if (typeof value === 'boolean') {
      return (
        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium ${
          value ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
        }`}>
          {value ? 'Oui' : 'Non'}
        </span>
      );
    }

    // Direction
    if (key === 'direction') {
      const isUpstream = value === 'up';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isUpstream
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
        }`}>
          {isUpstream ? '↑ Upstream' : '↓ Downstream'}
        </span>
      );
    }

    // Genre de port
    if (key === 'port_genre') {
      const isUplink = value === 'uplink';
      return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
          isUplink
            ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
            : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
        }`}>
          {isUplink ? '↑ Uplink' : '↓ Downlink'}
        </span>
      );
    }

    // Objets imbriqués (relations)
    if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
      if (value.nom && value.code) {
        return <span className="text-foreground font-medium">{value.nom} <span className="text-muted-foreground text-sm">({value.code})</span></span>;
      }
      if (value.nom) return <span className="text-foreground font-medium">{value.nom}</span>;
      if (value.name && value.equipement_code) {
        return <span className="text-foreground font-medium">{value.name} <span className="text-muted-foreground text-sm">({value.equipement_code})</span></span>;
      }
      if (value.name) return <span className="text-foreground font-medium">{value.name}</span>;
      if (value.libelle) return <span className="text-foreground font-medium">{value.libelle}</span>;
      if (value.code) return <span className="text-foreground font-medium">{value.code}</span>;
      return <span className="text-muted-foreground text-sm">-</span>;
    }

    const stringValue = String(value);

    // Status
    if (key.toLowerCase().includes('status') || key.toLowerCase().includes('statut') || key === 'actif') {
      const statusMapping: Record<string, "up" | "down" | "warn" | "maintenance" | "ok" | "actif" | "fermee"> = {
        'actif': 'actif',
        'active': 'actif',
        'up': 'up',
        'true': 'up',
        '1': 'up',
        'en ligne': 'up',
        'maintenance': 'maintenance',
        'down': 'down',
        'inactif': 'down',
        'inactive': 'down',
        'false': 'down',
        '0': 'down',
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
      };

      const mappedStatus = statusMapping[stringValue.toLowerCase()] || 'ok';
      return <StatusBadge status={mappedStatus} />;
    }

    // Dates
    if (key.includes('_at') || key.includes('date')) {
      try {
        const date = new Date(stringValue);
        if (!isNaN(date.getTime())) {
          return <span className="text-foreground">{date.toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>;
        }
      } catch {
        // Continue with default rendering
      }
    }

    return <span className="text-foreground">{stringValue}</span>;
  };

  // Grouper les propriétés par catégorie
  const groupProperties = useMemo(() => {
    if (!data) return [];

    const groups: Record<string, Array<{ key: string; value: any }>> = {
      'Identification': [],
      'Localisation': [],
      'Technique': [],
      'Réseau': [],
      'Informations': [],
    };

    const identificationKeys = ['nom', 'name', 'code', 'equipement_code', 'libelle', 'type', 'modele', 'fabricant', 'numero_serie'];
    const locationKeys = ['site', 'zone', 'batiment', 'salle', 'coffret', 'emplacement', 'adresse', 'ville', 'code_postal', 'pays', 'etage', 'long', 'lat'];
    const technicalKeys = ['capacite', 'superficie', 'nombre_ports', 'is_principal', 'is_manageable', 'port_label', 'port_genre', 'speed', 'poe_enabled', 'connexion_type'];
    const networkKeys = ['ip_address', 'mac_address', 'vlan', 'vlan_id', 'subnet', 'gateway', 'type_reseau', 'media', 'direction', 'longueur'];

    Object.entries(data).forEach(([key, value]) => {
      // Exclure certains champs
      if (['id', 'ports', 'created_at', 'updated_at', 'deleted_at', 'qr_code', 'photo', 'photo_url'].includes(key)) return;
      if (key.endsWith('_id') && data[key.replace('_id', '')]) return;
      if (['coffret', 'batiment', 'salle', 'site', 'zone'].includes(key) && typeof value === 'object') {
        // Ajouter la relation formatée
        groups['Localisation'].push({ key, value });
        return;
      }

      if (identificationKeys.includes(key)) {
        groups['Identification'].push({ key, value });
      } else if (locationKeys.includes(key)) {
        groups['Localisation'].push({ key, value });
      } else if (technicalKeys.includes(key)) {
        groups['Technique'].push({ key, value });
      } else if (networkKeys.includes(key)) {
        groups['Réseau'].push({ key, value });
      } else {
        groups['Informations'].push({ key, value });
      }
    });

    // Filtrer les groupes vides
    return Object.entries(groups).filter(([_, items]) => items.length > 0);
  }, [data]);

  // Early return après tous les hooks
  if (!data) return null;

  // Render pour liaisons
  const renderLiaisonContent = () => {
    const sourceEquipement = data.port_source?.equipement?.name || data.from || 'Source';
    const sourcePort = data.port_source?.port_label || data.port_source_label || '';
    const destEquipement = data.port_destination?.equipement?.name || data.to || 'Destination';
    const destPort = data.port_destination?.port_label || data.port_destination_label || '';
    const isActive = data.actif === true || data.actif === 1 || data.status === 'actif';

    const mediaColors: Record<string, { bg: string; text: string; border: string }> = {
      'fibre': { bg: 'bg-purple-100 dark:bg-purple-900/30', text: 'text-purple-700 dark:text-purple-300', border: 'border-purple-300 dark:border-purple-700' },
      'cuivre': { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-300 dark:border-amber-700' },
      'coaxial': { bg: 'bg-slate-100 dark:bg-slate-900/30', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-300 dark:border-slate-700' },
      'sans-fil': { bg: 'bg-sky-100 dark:bg-sky-900/30', text: 'text-sky-700 dark:text-sky-300', border: 'border-sky-300 dark:border-sky-700' },
    };
    const mediaStyle = mediaColors[data.media?.toLowerCase()] || { bg: 'bg-gray-100 dark:bg-gray-900/30', text: 'text-gray-700 dark:text-gray-300', border: 'border-gray-300 dark:border-gray-700' };

    return (
      <div className="space-y-6">
        {/* Visual Connection */}
        <div className={`rounded-xl border-2 ${mediaStyle.border} ${mediaStyle.bg} p-6`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4 flex-1">
              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center mb-2">
                  <Network className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="font-semibold text-sm text-center">{sourceEquipement}</span>
                {sourcePort && <span className="text-xs text-muted-foreground">({sourcePort})</span>}
              </div>

              <div className="flex-1 flex items-center justify-center gap-2">
                <div className="h-0.5 flex-1 bg-gradient-to-r from-blue-400 to-transparent"></div>
                <div className={`px-3 py-1 rounded-full ${mediaStyle.bg} ${mediaStyle.text} text-xs font-medium border ${mediaStyle.border}`}>
                  {data.media || 'Liaison'}
                </div>
                <ArrowRight className={`h-5 w-5 ${mediaStyle.text}`} />
                <div className="h-0.5 flex-1 bg-gradient-to-l from-green-400 to-transparent"></div>
              </div>

              <div className="flex flex-col items-center min-w-[100px]">
                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/50 flex items-center justify-center mb-2">
                  <Network className="h-6 w-6 text-green-600 dark:text-green-400" />
                </div>
                <span className="font-semibold text-sm text-center">{destEquipement}</span>
                {destPort && <span className="text-xs text-muted-foreground">({destPort})</span>}
              </div>
            </div>

            <div className="ml-4">
              <span className={`px-3 py-1.5 rounded-full text-sm font-medium ${
                isActive
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
              }`}>
                {isActive ? 'Actif' : 'Inactif'}
              </span>
            </div>
          </div>
        </div>

        {/* Properties Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Cable className="h-3.5 w-3.5" />
              Support
            </label>
            <div className="mt-1 font-semibold text-foreground">{data.media || '-'}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="h-3.5 w-3.5" />
              Longueur
            </label>
            <div className="mt-1 font-semibold text-foreground">{data.longueur ? `${data.longueur} m` : '-'}</div>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 border border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <ArrowUpDown className="h-3.5 w-3.5" />
              Direction
            </label>
            <div className="mt-1">
              {data.direction ? (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  data.direction === 'up'
                    ? "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300"
                    : "bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300"
                }`}>
                  {data.direction === 'up' ? '↑ Upstream' : '↓ Downstream'}
                </span>
              ) : '-'}
            </div>
          </div>
          {data.nom && (
            <div className="bg-muted/30 rounded-lg p-3 border border-border">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5" />
                Nom
              </label>
              <div className="mt-1 font-semibold text-foreground">{data.nom}</div>
            </div>
          )}
        </div>

        {data.description && (
          <div className="bg-muted/30 rounded-lg p-4 border border-border">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Description</label>
            <p className="mt-2 text-foreground">{data.description}</p>
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header avec boutons d'action */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border bg-muted/30">
          <div className="flex items-start justify-between gap-4">
            <DialogTitle className="text-xl font-semibold">{title}</DialogTitle>

            {(onEdit || onDelete || (isCoffret || isEquipement)) && (
              <div className="flex items-center gap-2 shrink-0">
                {(isCoffret || isEquipement) && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsQRCodeOpen(true)}
                    disabled={!hasQRCode}
                    title={hasQRCode ? "Voir le QR Code" : "QR Code non disponible"}
                    className="gap-1.5"
                  >
                    <QrCode className="h-4 w-4" />
                    <span className="hidden sm:inline">QR</span>
                  </Button>
                )}
                {onEdit && (
                  <Button variant="outline" size="sm" onClick={onEdit} className="gap-1.5">
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Modifier</span>
                  </Button>
                )}
                {onDelete && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1.5"
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden sm:inline">Supprimer</span>
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
                        <AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={async (e) => {
                            e.preventDefault();
                            setIsDeleting(true);
                            try {
                              await onDelete?.();
                            } catch {
                              // L'erreur est gérée par le parent
                            } finally {
                              setIsDeleting(false);
                            }
                          }}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Suppression...
                            </>
                          ) : (
                            "Supprimer"
                          )}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="p-6">
          {isLiaison ? (
            renderLiaisonContent()
          ) : (
            <div className="flex flex-col md:flex-row gap-6">
              {/* Colonne gauche - Icône et Nom */}
              <div className="md:w-48 shrink-0">
                <div className="sticky top-0 flex flex-col items-center text-center p-4 rounded-xl border border-border bg-muted/20">
                  {/* Photo ou Icône */}
                  {hasPhoto && photoUrl ? (
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-border mb-3">
                      <img
                        src={photoUrl}
                        alt={getEntityName()}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  ) : (
                    <div className={`w-20 h-20 rounded-xl ${entityConfig.bgColor} flex items-center justify-center mb-3`}>
                      <IconComponent className={`h-10 w-10 ${entityConfig.color}`} />
                    </div>
                  )}

                  {/* Nom */}
                  <h3 className="font-bold text-lg text-foreground leading-tight">
                    {getEntityName()}
                  </h3>

                  {/* Code */}
                  {getEntityCode() && (
                    <p className="text-sm text-muted-foreground mt-1 font-mono">
                      {getEntityCode()}
                    </p>
                  )}

                  {/* Type */}
                  {data.type && (
                    <span className={`mt-3 inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${entityConfig.bgColor} ${entityConfig.color}`}>
                      {data.type}
                    </span>
                  )}

                  {/* Status si disponible */}
                  {(data.status || data.statut) && (
                    <div className="mt-3">
                      {formatValue('status', data.status || data.statut)}
                    </div>
                  )}
                </div>
              </div>

              {/* Colonne droite - Détails organisés */}
              <div className="flex-1 space-y-5">
                {groupProperties.map(([groupName, items]) => (
                  <div key={groupName} className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      {groupName === 'Identification' && <Tag className="h-4 w-4" />}
                      {groupName === 'Localisation' && <MapPin className="h-4 w-4" />}
                      {groupName === 'Technique' && <Settings className="h-4 w-4" />}
                      {groupName === 'Réseau' && <Globe className="h-4 w-4" />}
                      {groupName === 'Informations' && <Info className="h-4 w-4" />}
                      {groupName}
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {items
                        .filter(({ key }) => !['status', 'statut', 'type'].includes(key) || groupName !== 'Identification')
                        .map(({ key, value }) => (
                          <div key={key} className="bg-muted/30 rounded-lg p-3 border border-border">
                            <label className="text-xs font-medium text-muted-foreground">
                              {getLabel(key)}
                            </label>
                            <div className="mt-1 text-sm">
                              {formatValue(key, value)}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}

                {/* Description si présente et longue */}
                {data.description && data.description.length > 50 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Description
                    </h4>
                    <div className="bg-muted/30 rounded-lg p-4 border border-border">
                      <p className="text-sm text-foreground whitespace-pre-wrap">{data.description}</p>
                    </div>
                  </div>
                )}

                {/* Section Ports */}
                {data.ports && Array.isArray(data.ports) && data.ports.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <Plug className="h-4 w-4" />
                      Ports associés ({data.ports.length})
                    </h4>
                    <div className="bg-muted/30 rounded-lg border border-border overflow-hidden">
                      <table className="w-full text-sm">
                        <thead className="bg-muted/50">
                          <tr className="text-left text-muted-foreground">
                            <th className="p-3 font-medium">Label</th>
                            <th className="p-3 font-medium">Appareil</th>
                            <th className="p-3 font-medium">VLAN</th>
                            <th className="p-3 font-medium">Vitesse</th>
                          </tr>
                        </thead>
                        <tbody>
                          {data.ports.slice(0, 10).map((port: any) => (
                            <tr key={port.id} className="border-t border-border">
                              <td className="p-3 font-medium">{port.port_label || '-'}</td>
                              <td className="p-3 text-muted-foreground">{port.device_name || '-'}</td>
                              <td className="p-3 text-muted-foreground">{port.vlan || '-'}</td>
                              <td className="p-3 text-muted-foreground">{port.speed || '-'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {data.ports.length > 10 && (
                        <div className="p-3 text-center text-sm text-muted-foreground border-t border-border">
                          + {data.ports.length - 10} autres ports
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Modal QR Code */}
      {hasQRCode && (isCoffret || isEquipement) && (
        <QRCodeModal
          open={isQRCodeOpen}
          onOpenChange={setIsQRCodeOpen}
          qrCode={data.qr_code}
          title={isCoffret ? (data.nom || data.code) : (data.name || data.equipement_code)}
          subtitle={isCoffret
            ? (data.batiment?.nom || data.salle?.nom || data.emplacement || '')
            : (data.coffret?.nom || data.type || '')}
          type={isCoffret ? 'coffret' : 'equipement'}
          code={isCoffret ? data.code : data.equipement_code}
        />
      )}
    </Dialog>
  );
}
