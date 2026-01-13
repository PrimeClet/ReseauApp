import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  coffretService,
  equipementService,
  portService,
  liaisonService,
  systemService,
  lanService,
  batimentService,
  salleService,
  siteService,
  zoneService,
  maintenanceService,
  modificationService,
  statistiqueService
} from '@/services';
import type {
  Coffret,
  CoffretCreateData,
  Equipement,
  EquipementCreateData,
  Port,
  PortCreateData,
  Liaison,
  LiaisonCreateData,
  System,
  SystemCreateData,
  Lan,
  LanCreateData,
  Batiment,
  BatimentCreateData,
  Salle,
  SalleCreateData,
  Site,
  SiteCreateData,
  Zone,
  ZoneCreateData,
  Maintenance,
  MaintenanceCreateData,
  Modification,
  ModificationCreateData,
  GlobalStats,
  ModificationsStats
} from '@/services';

// Re-export types for compatibility
export type { Coffret, Equipement, Port, Liaison, System, Lan, Batiment, Salle, Site, Zone, Maintenance, Modification };

// Legacy interfaces for backwards compatibility
export interface Armoire {
  id: string;
  nom: string;
  emplacement: string;
  type: string;
  capacite: string;
  temperature: string;
  etat: string;
  dateInstallation: string;
}

// Legacy Maintenance interface - deprecated, use Maintenance from @/services instead
export interface MaintenanceLegacy {
  id: string;
  equipement: string;
  type: string;
  date: string;
  heure: string;
  duree: string;
  technicien: string;
  priorite: string;
  description: string;
  statut: string;
  dateCreation: string;
}

export interface Equipment {
  id: string;
  nom: string;
  type: string;
  modele: string;
  armoire: string;
  etat: string;
  ip: string;
  uptime: string;
  description?: string;
}

export interface Systeme {
  id: string;
  nom: string;
  type: string;
  version: string;
  etat: string;
  cpu: string;
  memoire: string;
  stockage: string;
}

interface DataContextType {
  // API Data
  coffrets: Coffret[];
  equipements: Equipement[];
  ports: Port[];
  liaisons: Liaison[];
  systems: System[];
  lans: Lan[];
  batiments: Batiment[];
  salles: Salle[];
  sites: Site[];
  zones: Zone[];
  maintenances: Maintenance[];
  modifications: Modification[];
  globalStats: GlobalStats | null;
  modificationsStats: ModificationsStats | null;

  // Loading states
  isLoadingCoffrets: boolean;
  isLoadingEquipements: boolean;
  isLoadingPorts: boolean;
  isLoadingLiaisons: boolean;
  isLoadingSystems: boolean;
  isLoadingLans: boolean;
  isLoadingBatiments: boolean;
  isLoadingSalles: boolean;
  isLoadingSites: boolean;
  isLoadingZones: boolean;
  isLoadingMaintenances: boolean;
  isLoadingModifications: boolean;
  isLoadingStats: boolean;
  isLoadingModificationsStats: boolean;

  // Error states
  coffretError: Error | null;
  equipementError: Error | null;
  portError: Error | null;
  liaisonError: Error | null;
  systemError: Error | null;
  lanError: Error | null;
  batimentError: Error | null;
  salleError: Error | null;
  siteError: Error | null;
  zoneError: Error | null;
  maintenanceError: Error | null;
  modificationError: Error | null;

  // CRUD operations
  addCoffret: (data: CoffretCreateData) => Promise<Coffret>;
  updateCoffret: (id: number, data: Partial<CoffretCreateData>) => Promise<Coffret>;
  deleteCoffret: (id: number) => Promise<void>;
  restoreCoffret: (id: number) => Promise<Coffret>;
  importCoffrets: (file: File) => Promise<{ message: string; created: number; updated: number; errors: string[] }>;

  addEquipement: (data: EquipementCreateData) => Promise<Equipement>;
  updateEquipement: (id: number, data: Partial<EquipementCreateData>) => Promise<Equipement>;
  deleteEquipement: (id: number) => Promise<void>;
  restoreEquipement: (id: number) => Promise<Equipement>;
  importEquipements: (file: File) => Promise<{ message: string; created: number; updated: number; errors: string[] }>;

  addPort: (data: PortCreateData) => Promise<Port>;
  updatePort: (id: number, data: Partial<PortCreateData>) => Promise<Port>;
  deletePort: (id: number) => Promise<void>;
  restorePort: (id: number) => Promise<Port>;

  addLiaison: (data: LiaisonCreateData) => Promise<Liaison>;
  updateLiaison: (id: number, data: Partial<LiaisonCreateData>) => Promise<Liaison>;
  deleteLiaison: (id: number) => Promise<void>;
  restoreLiaison: (id: number) => Promise<Liaison>;

  addSystem: (data: SystemCreateData) => Promise<System>;
  updateSystem: (id: number, data: Partial<SystemCreateData>) => Promise<System>;
  deleteSystem: (id: number) => Promise<void>;

  addLan: (data: LanCreateData) => Promise<Lan>;
  updateLan: (id: number, data: Partial<LanCreateData>) => Promise<Lan>;
  deleteLan: (id: number) => Promise<void>;

  addBatiment: (data: BatimentCreateData) => Promise<Batiment>;
  updateBatiment: (id: number, data: Partial<BatimentCreateData>) => Promise<Batiment>;
  deleteBatiment: (id: number) => Promise<void>;
  restoreBatiment: (id: number) => Promise<Batiment>;

  addSalle: (data: SalleCreateData) => Promise<Salle>;
  updateSalle: (id: number, data: Partial<SalleCreateData>) => Promise<Salle>;
  deleteSalle: (id: number) => Promise<void>;
  restoreSalle: (id: number) => Promise<Salle>;
  importSalles: (file: File) => Promise<{ message: string; created: number; updated: number; errors: string[] }>;

  addSite: (data: SiteCreateData) => Promise<Site>;
  updateSite: (id: number, data: Partial<SiteCreateData>) => Promise<Site>;
  deleteSite: (id: number) => Promise<void>;

  addZone: (data: ZoneCreateData) => Promise<Zone>;
  updateZone: (id: number, data: Partial<ZoneCreateData>) => Promise<Zone>;
  deleteZone: (id: number) => Promise<void>;

  addMaintenance: (data: MaintenanceCreateData) => Promise<Maintenance>;
  updateMaintenance: (id: number, data: Partial<MaintenanceCreateData>) => Promise<Maintenance>;
  deleteMaintenance: (id: number) => Promise<void>;

  addModification: (data: ModificationCreateData) => Promise<Modification>;
  updateModification: (id: number, data: Partial<ModificationCreateData>) => Promise<Modification>;
  deleteModification: (id: number) => Promise<void>;

  // Refresh functions
  refetchCoffrets: () => void;
  refetchEquipements: () => void;
  refetchPorts: () => void;
  refetchLiaisons: () => void;
  refetchSystems: () => void;
  refetchLans: () => void;
  refetchBatiments: () => void;
  importBatiments: (file: File) => Promise<{ message: string; created: number; updated: number; errors: string[] }>;
  refetchSalles: () => void;
  refetchSites: () => void;
  refetchZones: () => void;
  refetchMaintenances: () => void;
  refetchModifications: () => void;
  refetchStats: () => void;

  // Legacy compatibility (will be removed later)
  armoires: Armoire[];
  maintenancesLegacy: MaintenanceLegacy[];
  equipments: Equipment[];
  systemes: Systeme[];
  addArmoire: (armoire: Omit<Armoire, 'id'>) => void;
  addMaintenanceLegacy: (maintenance: Omit<MaintenanceLegacy, 'id'>) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  addSysteme: (systeme: Omit<Systeme, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();

  // Queries - only fetch when authenticated
  const {
    data: coffretData,
    isLoading: isLoadingCoffrets,
    error: coffretError,
    refetch: refetchCoffrets
  } = useQuery({
    queryKey: ['coffrets'],
    queryFn: () => coffretService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1, // Réessayer seulement 1 fois en cas d'erreur
    retryDelay: 1000, // Attendre 1 seconde avant de réessayer
    enabled: isAuthenticated, // Ne fetch que si authentifié
  });

  const {
    data: equipementData,
    isLoading: isLoadingEquipements,
    error: equipementError,
    refetch: refetchEquipements
  } = useQuery({
    queryKey: ['equipements'],
    queryFn: () => equipementService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: portData,
    isLoading: isLoadingPorts,
    error: portError,
    refetch: refetchPorts
  } = useQuery({
    queryKey: ['ports'],
    queryFn: () => portService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: liaisonData,
    isLoading: isLoadingLiaisons,
    error: liaisonError,
    refetch: refetchLiaisons
  } = useQuery({
    queryKey: ['liaisons'],
    queryFn: () => liaisonService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: systemData,
    isLoading: isLoadingSystems,
    error: systemError,
    refetch: refetchSystems
  } = useQuery({
    queryKey: ['systems'],
    queryFn: () => systemService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: lanData,
    isLoading: isLoadingLans,
    error: lanError,
    refetch: refetchLans
  } = useQuery({
    queryKey: ['lans'],
    queryFn: () => lanService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: batimentData,
    isLoading: isLoadingBatiments,
    error: batimentError,
    refetch: refetchBatiments
  } = useQuery({
    queryKey: ['batiments'],
    queryFn: () => batimentService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: salleData,
    isLoading: isLoadingSalles,
    error: salleError,
    refetch: refetchSalles
  } = useQuery({
    queryKey: ['salles'],
    queryFn: () => salleService.getAll({ with_trashed: 'true' }),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: siteData,
    isLoading: isLoadingSites,
    error: siteError,
    refetch: refetchSites
  } = useQuery({
    queryKey: ['sites'],
    queryFn: () => siteService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: zoneData,
    isLoading: isLoadingZones,
    error: zoneError,
    refetch: refetchZones
  } = useQuery({
    queryKey: ['zones'],
    queryFn: () => zoneService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: maintenanceData,
    isLoading: isLoadingMaintenances,
    error: maintenanceError,
    refetch: refetchMaintenances
  } = useQuery({
    queryKey: ['maintenances'],
    queryFn: () => maintenanceService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: modificationData,
    isLoading: isLoadingModifications,
    error: modificationError,
    refetch: refetchModifications
  } = useQuery({
    queryKey: ['modifications'],
    queryFn: () => modificationService.getAll(),
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
    enabled: isAuthenticated,
  });

  const {
    data: globalStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['globalStats'],
    queryFn: () => statistiqueService.getGlobalStats(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  const {
    data: modificationsStats,
    isLoading: isLoadingModificationsStats,
    refetch: refetchModificationsStats
  } = useQuery({
    queryKey: ['modifications', 'stats'],
    queryFn: () => statistiqueService.getModificationsStats(),
    staleTime: 5 * 60 * 1000,
    enabled: isAuthenticated,
  });

  // Mutations - Coffrets
  const createCoffretMutation = useMutation({
    mutationFn: coffretService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coffrets'] }),
  });

  const updateCoffretMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<CoffretCreateData> }) =>
      coffretService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coffrets'] }),
  });

  const deleteCoffretMutation = useMutation({
    mutationFn: coffretService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coffrets'] }),
  });

  const restoreCoffretMutation = useMutation({
    mutationFn: coffretService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['coffrets'] }),
  });

  // Mutations - Equipements
  const createEquipementMutation = useMutation({
    mutationFn: equipementService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipements'] }),
  });

  const updateEquipementMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<EquipementCreateData> }) =>
      equipementService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipements'] }),
  });

  const deleteEquipementMutation = useMutation({
    mutationFn: equipementService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipements'] }),
  });

  const restoreEquipementMutation = useMutation({
    mutationFn: equipementService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['equipements'] }),
  });

  // Mutations - Ports
  const createPortMutation = useMutation({
    mutationFn: portService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ports'] }),
  });

  const updatePortMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<PortCreateData> }) =>
      portService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ports'] }),
  });

  const deletePortMutation = useMutation({
    mutationFn: portService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ports'] }),
  });

  const restorePortMutation = useMutation({
    mutationFn: portService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['ports'] }),
  });

  // Mutations - Liaisons
  const createLiaisonMutation = useMutation({
    mutationFn: liaisonService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liaisons'] }),
  });

  const updateLiaisonMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LiaisonCreateData> }) =>
      liaisonService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liaisons'] }),
  });

  const deleteLiaisonMutation = useMutation({
    mutationFn: liaisonService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liaisons'] }),
  });

  const restoreLiaisonMutation = useMutation({
    mutationFn: liaisonService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['liaisons'] }),
  });

  // Mutations - Systems
  const createSystemMutation = useMutation({
    mutationFn: systemService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  });

  const updateSystemMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SystemCreateData> }) =>
      systemService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  });

  const deleteSystemMutation = useMutation({
    mutationFn: systemService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['systems'] }),
  });

  // Mutations - LANs
  const createLanMutation = useMutation({
    mutationFn: lanService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lans'] }),
  });

  const updateLanMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<LanCreateData> }) =>
      lanService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lans'] }),
  });

  const deleteLanMutation = useMutation({
    mutationFn: lanService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lans'] }),
  });

  // Mutations - Batiments
  const createBatimentMutation = useMutation({
    mutationFn: batimentService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batiments'] }),
  });

  const updateBatimentMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<BatimentCreateData> }) =>
      batimentService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batiments'] }),
  });

  const deleteBatimentMutation = useMutation({
    mutationFn: batimentService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batiments'] }),
  });

  const restoreBatimentMutation = useMutation({
    mutationFn: batimentService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['batiments'] }),
  });

  // Mutations - Salles
  const createSalleMutation = useMutation({
    mutationFn: salleService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salles'] }),
  });

  const updateSalleMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<SalleCreateData> }) =>
      salleService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salles'] }),
  });

  const deleteSalleMutation = useMutation({
    mutationFn: salleService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salles'] }),
  });

  const restoreSalleMutation = useMutation({
    mutationFn: salleService.restore,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['salles'] }),
  });

  // Mutations - Maintenances
  const createMaintenanceMutation = useMutation({
    mutationFn: maintenanceService.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenances'] }),
  });

  const updateMaintenanceMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<MaintenanceCreateData> }) =>
      maintenanceService.update(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenances'] }),
  });

  const deleteMaintenanceMutation = useMutation({
    mutationFn: maintenanceService.delete,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['maintenances'] }),
  });

  // Mutations - Modifications
  const createModificationMutation = useMutation({
    mutationFn: modificationService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'stats'] });
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const updateModificationMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<ModificationCreateData> }) =>
      modificationService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'stats'] });
    },
  });

  const deleteModificationMutation = useMutation({
    mutationFn: modificationService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['modifications'] });
      queryClient.invalidateQueries({ queryKey: ['modifications', 'stats'] });
    },
  });

  // Helper functions
  const addCoffret = async (data: CoffretCreateData) => {
    return createCoffretMutation.mutateAsync(data);
  };

  const updateCoffret = async (id: number, data: Partial<CoffretCreateData>) => {
    return updateCoffretMutation.mutateAsync({ id, data });
  };

  const deleteCoffret = async (id: number) => {
    return deleteCoffretMutation.mutateAsync(id);
  };

  const restoreCoffret = async (id: number) => {
    return restoreCoffretMutation.mutateAsync(id);
  };

  const importCoffrets = async (file: File) => {
    const result = await coffretService.import(file);
    queryClient.invalidateQueries({ queryKey: ['coffrets'] });
    return result;
  };

  const addEquipement = async (data: EquipementCreateData) => {
    return createEquipementMutation.mutateAsync(data);
  };

  const updateEquipement = async (id: number, data: Partial<EquipementCreateData>) => {
    return updateEquipementMutation.mutateAsync({ id, data });
  };

  const deleteEquipement = async (id: number) => {
    return deleteEquipementMutation.mutateAsync(id);
  };

  const restoreEquipement = async (id: number) => {
    return restoreEquipementMutation.mutateAsync(id);
  };

  const importEquipements = async (file: File) => {
    const result = await equipementService.import(file);
    queryClient.invalidateQueries({ queryKey: ['equipements'] });
    return result;
  };

  const addPort = async (data: PortCreateData) => {
    return createPortMutation.mutateAsync(data);
  };

  const updatePort = async (id: number, data: Partial<PortCreateData>) => {
    return updatePortMutation.mutateAsync({ id, data });
  };

  const deletePort = async (id: number) => {
    return deletePortMutation.mutateAsync(id);
  };

  const restorePort = async (id: number) => {
    return restorePortMutation.mutateAsync(id);
  };

  const addLiaison = async (data: LiaisonCreateData) => {
    return createLiaisonMutation.mutateAsync(data);
  };

  const updateLiaison = async (id: number, data: Partial<LiaisonCreateData>) => {
    return updateLiaisonMutation.mutateAsync({ id, data });
  };

  const deleteLiaison = async (id: number) => {
    return deleteLiaisonMutation.mutateAsync(id);
  };

  const restoreLiaison = async (id: number) => {
    return restoreLiaisonMutation.mutateAsync(id);
  };

  const addSystem = async (data: SystemCreateData) => {
    return createSystemMutation.mutateAsync(data);
  };

  const updateSystem = async (id: number, data: Partial<SystemCreateData>) => {
    return updateSystemMutation.mutateAsync({ id, data });
  };

  const deleteSystem = async (id: number) => {
    return deleteSystemMutation.mutateAsync(id);
  };

  const addLan = async (data: LanCreateData) => {
    return createLanMutation.mutateAsync(data);
  };

  const updateLan = async (id: number, data: Partial<LanCreateData>) => {
    return updateLanMutation.mutateAsync({ id, data });
  };

  const deleteLan = async (id: number) => {
    return deleteLanMutation.mutateAsync(id);
  };

  const addBatiment = async (data: BatimentCreateData) => {
    return createBatimentMutation.mutateAsync(data);
  };

  const updateBatiment = async (id: number, data: Partial<BatimentCreateData>) => {
    return updateBatimentMutation.mutateAsync({ id, data });
  };

  const deleteBatiment = async (id: number) => {
    return deleteBatimentMutation.mutateAsync(id);
  };

  const restoreBatiment = async (id: number) => {
    return restoreBatimentMutation.mutateAsync(id);
  };

  const importBatiments = async (file: File) => {
    const result = await batimentService.import(file);
    queryClient.invalidateQueries({ queryKey: ['batiments'] });
    return result;
  };

  const addSalle = async (data: SalleCreateData) => {
    return createSalleMutation.mutateAsync(data);
  };

  const updateSalle = async (id: number, data: Partial<SalleCreateData>) => {
    return updateSalleMutation.mutateAsync({ id, data });
  };

  const deleteSalle = async (id: number) => {
    return deleteSalleMutation.mutateAsync(id);
  };

  const restoreSalle = async (id: number) => {
    return restoreSalleMutation.mutateAsync(id);
  };

  const importSalles = async (file: File) => {
    const result = await salleService.import(file);
    queryClient.invalidateQueries({ queryKey: ['salles'] });
    return result;
  };

  const addMaintenance = async (data: MaintenanceCreateData) => {
    return createMaintenanceMutation.mutateAsync(data);
  };

  const updateMaintenance = async (id: number, data: Partial<MaintenanceCreateData>) => {
    return updateMaintenanceMutation.mutateAsync({ id, data });
  };

  const deleteMaintenance = async (id: number) => {
    return deleteMaintenanceMutation.mutateAsync(id);
  };

  const addModification = async (data: ModificationCreateData) => {
    return createModificationMutation.mutateAsync(data);
  };

  const updateModification = async (id: number, data: Partial<ModificationCreateData>) => {
    return updateModificationMutation.mutateAsync({ id, data });
  };

  const deleteModification = async (id: number) => {
    return deleteModificationMutation.mutateAsync(id);
  };

  // Legacy compatibility functions (no-op for now)
  const addArmoire = () => {
    console.warn('addArmoire is deprecated, use addCoffret instead');
  };
  const addMaintenanceLegacy = () => {
    console.warn('addMaintenanceLegacy is deprecated, use addMaintenance instead');
  };
  const addEquipment = () => {
    console.warn('addEquipment is deprecated, use addEquipement instead');
  };
  const addSysteme = () => {
    console.warn('addSysteme is deprecated, use addSystem instead');
  };

  const value: DataContextType = {
    // API Data
    coffrets: coffretData?.data || [],
    equipements: equipementData?.data || [],
    ports: portData?.data || [],
    liaisons: liaisonData?.data || [],
    systems: systemData?.data || [],
    lans: lanData?.data || [],
    batiments: batimentData?.data || [],
    salles: salleData?.data || [],
    sites: siteData?.data || [],
    zones: zoneData?.data || [],
    maintenances: maintenanceData?.data || [],
    modifications: modificationData?.data || [],
    globalStats: globalStats || null,
    modificationsStats: modificationsStats || null,

    // Loading states
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingPorts,
    isLoadingLiaisons,
    isLoadingSystems,
    isLoadingLans,
    isLoadingBatiments,
    isLoadingSalles,
    isLoadingSites,
    isLoadingZones,
    isLoadingMaintenances,
    isLoadingModifications,
    isLoadingStats,
    isLoadingModificationsStats,

    // Error states
    coffretError: coffretError as Error | null,
    equipementError: equipementError as Error | null,
    portError: portError as Error | null,
    liaisonError: liaisonError as Error | null,
    systemError: systemError as Error | null,
    lanError: lanError as Error | null,
    batimentError: batimentError as Error | null,
    salleError: salleError as Error | null,
    siteError: siteError as Error | null,
    zoneError: zoneError as Error | null,
    maintenanceError: maintenanceError as Error | null,
    modificationError: modificationError as Error | null,

    // CRUD operations
    addCoffret,
    updateCoffret,
    deleteCoffret,
    restoreCoffret,
    importCoffrets,
    addEquipement,
    updateEquipement,
    deleteEquipement,
    restoreEquipement,
    importEquipements,
    addPort,
    updatePort,
    deletePort,
    restorePort,
    addLiaison,
    updateLiaison,
    deleteLiaison,
    restoreLiaison,
    addSystem,
    updateSystem,
    deleteSystem,
    addLan,
    updateLan,
    deleteLan,
    addBatiment,
    updateBatiment,
    deleteBatiment,
    restoreBatiment,
    addSalle,
    updateSalle,
    deleteSalle,
    restoreSalle,
    importSalles,
    addMaintenance,
    updateMaintenance,
    deleteMaintenance,
    addModification,
    updateModification,
    deleteModification,

    // Refresh functions
    refetchCoffrets,
    refetchEquipements,
    refetchPorts,
    refetchLiaisons,
    refetchSystems,
    refetchLans,
    refetchBatiments,
    importBatiments,
    refetchSalles,
    refetchZones,
    refetchSites,
    refetchMaintenances,
    refetchModifications,
    refetchStats,

    // Legacy compatibility
    armoires: [],
    maintenancesLegacy: [],
    equipments: [],
    systemes: [],
    addArmoire,
    addMaintenanceLegacy,
    addEquipment,
    addSysteme,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};
