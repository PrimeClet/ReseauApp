import React, { createContext, useContext } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  coffretService,
  equipementService,
  portService,
  liaisonService,
  systemService,
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
  GlobalStats
} from '@/services';

// Re-export types for compatibility
export type { Coffret, Equipement, Port, Liaison, System };

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

export interface Maintenance {
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
  globalStats: GlobalStats | null;

  // Loading states
  isLoadingCoffrets: boolean;
  isLoadingEquipements: boolean;
  isLoadingPorts: boolean;
  isLoadingLiaisons: boolean;
  isLoadingSystems: boolean;
  isLoadingStats: boolean;

  // Error states
  coffretError: Error | null;
  equipementError: Error | null;
  portError: Error | null;
  liaisonError: Error | null;
  systemError: Error | null;

  // CRUD operations
  addCoffret: (data: CoffretCreateData) => Promise<Coffret>;
  updateCoffret: (id: number, data: Partial<CoffretCreateData>) => Promise<Coffret>;
  deleteCoffret: (id: number) => Promise<void>;

  addEquipement: (data: EquipementCreateData) => Promise<Equipement>;
  updateEquipement: (id: number, data: Partial<EquipementCreateData>) => Promise<Equipement>;
  deleteEquipement: (id: number) => Promise<void>;

  addPort: (data: PortCreateData) => Promise<Port>;
  updatePort: (id: number, data: Partial<PortCreateData>) => Promise<Port>;
  deletePort: (id: number) => Promise<void>;

  addLiaison: (data: LiaisonCreateData) => Promise<Liaison>;
  updateLiaison: (id: number, data: Partial<LiaisonCreateData>) => Promise<Liaison>;
  deleteLiaison: (id: number) => Promise<void>;

  addSystem: (data: SystemCreateData) => Promise<System>;
  updateSystem: (id: number, data: Partial<SystemCreateData>) => Promise<System>;
  deleteSystem: (id: number) => Promise<void>;

  // Refresh functions
  refetchCoffrets: () => void;
  refetchEquipements: () => void;
  refetchPorts: () => void;
  refetchLiaisons: () => void;
  refetchSystems: () => void;
  refetchStats: () => void;

  // Legacy compatibility (will be removed later)
  armoires: Armoire[];
  maintenances: Maintenance[];
  equipments: Equipment[];
  systemes: Systeme[];
  addArmoire: (armoire: Omit<Armoire, 'id'>) => void;
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  addSysteme: (systeme: Omit<Systeme, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const queryClient = useQueryClient();

  // Queries
  const {
    data: coffretData,
    isLoading: isLoadingCoffrets,
    error: coffretError,
    refetch: refetchCoffrets
  } = useQuery({
    queryKey: ['coffrets'],
    queryFn: () => coffretService.getAll(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const {
    data: equipementData,
    isLoading: isLoadingEquipements,
    error: equipementError,
    refetch: refetchEquipements
  } = useQuery({
    queryKey: ['equipements'],
    queryFn: () => equipementService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: portData,
    isLoading: isLoadingPorts,
    error: portError,
    refetch: refetchPorts
  } = useQuery({
    queryKey: ['ports'],
    queryFn: () => portService.getAll(),
    staleTime: 5 * 60 * 1000,
  });

  const {
    data: liaisonData,
    isLoading: isLoadingLiaisons,
    error: liaisonError,
    refetch: refetchLiaisons
  } = useQuery({
    queryKey: ['liaisons'],
    queryFn: () => liaisonService.getAll(),
    staleTime: 5 * 60 * 1000,
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
  });

  const {
    data: globalStats,
    isLoading: isLoadingStats,
    refetch: refetchStats
  } = useQuery({
    queryKey: ['globalStats'],
    queryFn: () => statistiqueService.getGlobalStats(),
    staleTime: 5 * 60 * 1000,
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

  const addEquipement = async (data: EquipementCreateData) => {
    return createEquipementMutation.mutateAsync(data);
  };

  const updateEquipement = async (id: number, data: Partial<EquipementCreateData>) => {
    return updateEquipementMutation.mutateAsync({ id, data });
  };

  const deleteEquipement = async (id: number) => {
    return deleteEquipementMutation.mutateAsync(id);
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

  const addLiaison = async (data: LiaisonCreateData) => {
    return createLiaisonMutation.mutateAsync(data);
  };

  const updateLiaison = async (id: number, data: Partial<LiaisonCreateData>) => {
    return updateLiaisonMutation.mutateAsync({ id, data });
  };

  const deleteLiaison = async (id: number) => {
    return deleteLiaisonMutation.mutateAsync(id);
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

  // Legacy compatibility functions (no-op for now)
  const addArmoire = () => {
    console.warn('addArmoire is deprecated, use addCoffret instead');
  };
  const addMaintenance = () => {
    console.warn('addMaintenance is deprecated');
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
    globalStats: globalStats || null,

    // Loading states
    isLoadingCoffrets,
    isLoadingEquipements,
    isLoadingPorts,
    isLoadingLiaisons,
    isLoadingSystems,
    isLoadingStats,

    // Error states
    coffretError: coffretError as Error | null,
    equipementError: equipementError as Error | null,
    portError: portError as Error | null,
    liaisonError: liaisonError as Error | null,
    systemError: systemError as Error | null,

    // CRUD operations
    addCoffret,
    updateCoffret,
    deleteCoffret,
    addEquipement,
    updateEquipement,
    deleteEquipement,
    addPort,
    updatePort,
    deletePort,
    addLiaison,
    updateLiaison,
    deleteLiaison,
    addSystem,
    updateSystem,
    deleteSystem,

    // Refresh functions
    refetchCoffrets,
    refetchEquipements,
    refetchPorts,
    refetchLiaisons,
    refetchSystems,
    refetchStats,

    // Legacy compatibility
    armoires: [],
    maintenances: [],
    equipments: [],
    systemes: [],
    addArmoire,
    addMaintenance,
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
