import {
  Tag, Building2, MapPin, Box, Server, Cable, Network, Plug, Hash,
  User, Mail, Phone, Shield, Calendar, Clock, Activity, Zap, Gauge,
  FileText, Info, Wrench, ThermometerSun, ArrowUpDown, Globe, Layers,
  Database, Settings, CheckCircle, AlertTriangle, Factory, DoorOpen, Cpu,
  Lock, Eye, AtSign, Ruler, Power, Binary, Router, HardDrive, CircuitBoard,
  Bookmark, ListOrdered, Image, MessageSquare, FileCheck, Ban
} from "lucide-react";

// Mapping des icônes pour les labels de formulaires et colonnes
export const getLabelIcon = (label: string): React.ReactNode => {
  const lowerLabel = label.toLowerCase();

  const iconMapping: Record<string, React.ReactNode> = {
    // Identifiants et noms
    'nom': <Tag className="h-3.5 w-3.5" />,
    'name': <Tag className="h-3.5 w-3.5" />,
    'label': <Tag className="h-3.5 w-3.5" />,
    'libellé': <Tag className="h-3.5 w-3.5" />,
    'code': <Hash className="h-3.5 w-3.5" />,
    'référence': <Bookmark className="h-3.5 w-3.5" />,
    'numéro': <ListOrdered className="h-3.5 w-3.5" />,
    'numero': <ListOrdered className="h-3.5 w-3.5" />,

    // Lieux et emplacements
    'site': <Globe className="h-3.5 w-3.5" />,
    'zone': <Layers className="h-3.5 w-3.5" />,
    'bâtiment': <Building2 className="h-3.5 w-3.5" />,
    'batiment': <Building2 className="h-3.5 w-3.5" />,
    'salle': <DoorOpen className="h-3.5 w-3.5" />,
    'emplacement': <MapPin className="h-3.5 w-3.5" />,
    'adresse': <MapPin className="h-3.5 w-3.5" />,
    'localisation': <MapPin className="h-3.5 w-3.5" />,

    // Équipements réseau
    'équipement': <Server className="h-3.5 w-3.5" />,
    'equipement': <Server className="h-3.5 w-3.5" />,
    'coffret': <Box className="h-3.5 w-3.5" />,
    'armoire': <Box className="h-3.5 w-3.5" />,
    'port': <Plug className="h-3.5 w-3.5" />,
    'liaison': <Cable className="h-3.5 w-3.5" />,
    'média': <Cable className="h-3.5 w-3.5" />,
    'media': <Cable className="h-3.5 w-3.5" />,
    'support': <Cable className="h-3.5 w-3.5" />,
    'câble': <Cable className="h-3.5 w-3.5" />,
    'cable': <Cable className="h-3.5 w-3.5" />,
    'vlan': <Network className="h-3.5 w-3.5" />,
    'réseau': <Network className="h-3.5 w-3.5" />,
    'reseau': <Network className="h-3.5 w-3.5" />,
    'lan': <Network className="h-3.5 w-3.5" />,
    'switch': <Router className="h-3.5 w-3.5" />,
    'routeur': <Router className="h-3.5 w-3.5" />,
    'router': <Router className="h-3.5 w-3.5" />,
    'serveur': <HardDrive className="h-3.5 w-3.5" />,
    'server': <HardDrive className="h-3.5 w-3.5" />,

    // Caractéristiques techniques
    'type': <Settings className="h-3.5 w-3.5" />,
    'modèle': <Cpu className="h-3.5 w-3.5" />,
    'modele': <Cpu className="h-3.5 w-3.5" />,
    'model': <Cpu className="h-3.5 w-3.5" />,
    'fabricant': <Factory className="h-3.5 w-3.5" />,
    'marque': <Factory className="h-3.5 w-3.5" />,
    'vitesse': <Gauge className="h-3.5 w-3.5" />,
    'speed': <Gauge className="h-3.5 w-3.5" />,
    'capacité': <Database className="h-3.5 w-3.5" />,
    'poe': <Zap className="h-3.5 w-3.5" />,
    'alimentation': <Power className="h-3.5 w-3.5" />,
    'power': <Power className="h-3.5 w-3.5" />,
    'température': <ThermometerSun className="h-3.5 w-3.5" />,
    'longueur': <Ruler className="h-3.5 w-3.5" />,
    'length': <Ruler className="h-3.5 w-3.5" />,
    'direction': <ArrowUpDown className="h-3.5 w-3.5" />,
    'genre': <ArrowUpDown className="h-3.5 w-3.5" />,
    'ip': <Binary className="h-3.5 w-3.5" />,
    'mac': <CircuitBoard className="h-3.5 w-3.5" />,

    // Utilisateurs et authentification
    'utilisateur': <User className="h-3.5 w-3.5" />,
    'user': <User className="h-3.5 w-3.5" />,
    'technicien': <Wrench className="h-3.5 w-3.5" />,
    'email': <Mail className="h-3.5 w-3.5" />,
    'e-mail': <Mail className="h-3.5 w-3.5" />,
    'téléphone': <Phone className="h-3.5 w-3.5" />,
    'telephone': <Phone className="h-3.5 w-3.5" />,
    'phone': <Phone className="h-3.5 w-3.5" />,
    'rôle': <Shield className="h-3.5 w-3.5" />,
    'role': <Shield className="h-3.5 w-3.5" />,
    'rôles': <Shield className="h-3.5 w-3.5" />,
    'roles': <Shield className="h-3.5 w-3.5" />,
    'permission': <Shield className="h-3.5 w-3.5" />,
    'permissions': <Shield className="h-3.5 w-3.5" />,
    'mot de passe': <Lock className="h-3.5 w-3.5" />,
    'password': <Lock className="h-3.5 w-3.5" />,
    'identifiant': <AtSign className="h-3.5 w-3.5" />,
    'username': <AtSign className="h-3.5 w-3.5" />,
    'login': <AtSign className="h-3.5 w-3.5" />,

    // Dates et temps
    'date': <Calendar className="h-3.5 w-3.5" />,
    'heure': <Clock className="h-3.5 w-3.5" />,
    'créé le': <Calendar className="h-3.5 w-3.5" />,
    'modifié le': <Calendar className="h-3.5 w-3.5" />,
    'début': <Calendar className="h-3.5 w-3.5" />,
    'fin': <Calendar className="h-3.5 w-3.5" />,
    'durée': <Clock className="h-3.5 w-3.5" />,
    'duree': <Clock className="h-3.5 w-3.5" />,

    // États et statuts
    'status': <Activity className="h-3.5 w-3.5" />,
    'statut': <Activity className="h-3.5 w-3.5" />,
    'état': <Activity className="h-3.5 w-3.5" />,
    'etat': <Activity className="h-3.5 w-3.5" />,
    'actif': <CheckCircle className="h-3.5 w-3.5" />,
    'active': <CheckCircle className="h-3.5 w-3.5" />,
    'inactif': <Ban className="h-3.5 w-3.5" />,
    'priorité': <AlertTriangle className="h-3.5 w-3.5" />,
    'priorite': <AlertTriangle className="h-3.5 w-3.5" />,

    // Descriptions et commentaires
    'description': <FileText className="h-3.5 w-3.5" />,
    'commentaire': <MessageSquare className="h-3.5 w-3.5" />,
    'comment': <MessageSquare className="h-3.5 w-3.5" />,
    'raison': <Info className="h-3.5 w-3.5" />,
    'motif': <Info className="h-3.5 w-3.5" />,
    'note': <FileText className="h-3.5 w-3.5" />,
    'notes': <FileText className="h-3.5 w-3.5" />,

    // Images et fichiers
    'photo': <Image className="h-3.5 w-3.5" />,
    'image': <Image className="h-3.5 w-3.5" />,
    'fichier': <FileCheck className="h-3.5 w-3.5" />,
    'file': <FileCheck className="h-3.5 w-3.5" />,
    'qr': <Eye className="h-3.5 w-3.5" />,

    // Spécifiques aux ports
    'uplink': <ArrowUpDown className="h-3.5 w-3.5" />,
    'downlink': <ArrowUpDown className="h-3.5 w-3.5" />,
    'source': <Plug className="h-3.5 w-3.5" />,
    'destination': <Plug className="h-3.5 w-3.5" />,
  };

  // Recherche exacte
  if (iconMapping[lowerLabel]) {
    return iconMapping[lowerLabel];
  }

  // Recherche partielle (pour les labels composés comme "Nom du site")
  for (const [key, icon] of Object.entries(iconMapping)) {
    if (lowerLabel.includes(key)) {
      return icon;
    }
  }

  return null;
};
