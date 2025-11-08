import React, { createContext, useContext, useState } from 'react';

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

export interface Port {
  id: string;
  nom: string;
  type: string;
  vitesse: string;
  etat: string;
  armoire: string;
  vlan: string;
  description: string;
}

export interface Liaison {
  id: string;
  nom: string;
  type: string;
  origine: string;
  destination: string;
  etat: string;
  bande: string;
  latence: string;
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

interface DataContextType {
  armoires: Armoire[];
  ports: Port[];
  liaisons: Liaison[];
  systemes: Systeme[];
  equipments: Equipment[];
  maintenances: Maintenance[];
  addArmoire: (armoire: Omit<Armoire, 'id'>) => void;
  addPort: (port: Omit<Port, 'id'>) => void;
  addLiaison: (liaison: Omit<Liaison, 'id'>) => void;
  addSysteme: (systeme: Omit<Systeme, 'id'>) => void;
  addEquipment: (equipment: Omit<Equipment, 'id'>) => void;
  addMaintenance: (maintenance: Omit<Maintenance, 'id'>) => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Mock initial data
const initialArmoires: Armoire[] = [
  {
    id: '1',
    nom: 'ARM-001',
    emplacement: 'Salle serveur A',
    type: '42U',
    capacite: '80%',
    temperature: '22°C',
    etat: 'Actif',
    dateInstallation: '2023-01-15'
  },
  {
    id: '2',
    nom: 'ARM-002',
    emplacement: 'Salle serveur B',
    type: '36U',
    capacite: '65%',
    temperature: '24°C',
    etat: 'Actif',
    dateInstallation: '2023-02-20'
  }
];

const initialPorts: Port[] = [
  {
    id: '1',
    nom: 'Port-01',
    type: 'RJ45',
    vitesse: '1 Gbps',
    etat: 'Actif',
    armoire: 'ARM-001',
    vlan: 'VLAN-100',
    description: 'Port principal'
  },
  {
    id: '2',
    nom: 'Port-02',
    type: 'Fibre',
    vitesse: '10 Gbps',
    etat: 'Actif',
    armoire: 'ARM-001',
    vlan: 'VLAN-200',
    description: 'Port backbone'
  }
];

const initialLiaisons: Liaison[] = [
  {
    id: '1',
    nom: 'LIA-001',
    type: 'Fibre optique',
    origine: 'Site A',
    destination: 'Site B',
    etat: 'Actif',
    bande: '100 Mbps',
    latence: '5ms'
  },
  {
    id: '2',
    nom: 'LIA-002',
    type: 'MPLS',
    origine: 'Site B',
    destination: 'Site C',
    etat: 'Actif',
    bande: '50 Mbps',
    latence: '12ms'
  }
];

const initialSystemes: Systeme[] = [
  {
    id: '1',
    nom: 'SRV-001',
    type: 'Serveur Web',
    version: 'Ubuntu 22.04',
    etat: 'En ligne',
    cpu: '45%',
    memoire: '68%',
    stockage: '34%'
  },
  {
    id: '2',
    nom: 'SRV-002',
    type: 'Base de données',
    version: 'PostgreSQL 15',
    etat: 'En ligne',
    cpu: '32%',
    memoire: '78%',
    stockage: '56%'
  }
];

const initialEquipments: Equipment[] = [
  {
    id: 'EQ-001',
    nom: 'Switch-001',
    type: 'switch',
    modele: 'Cisco C9300-24P',
    armoire: 'ARM-001',
    etat: 'actif',
    ip: '192.168.1.10',
    uptime: '45j 12h'
  },
  {
    id: 'EQ-002',
    nom: 'Router-001',
    type: 'routeur',
    modele: 'Juniper MX204',
    armoire: 'ARM-002',
    etat: 'actif',
    ip: '192.168.1.1',
    uptime: '72j 8h'
  },
  {
    id: 'EQ-003',
    nom: 'Switch-002',
    type: 'switch',
    modele: 'HP 2930F',
    armoire: 'ARM-003',
    etat: 'maintenance',
    ip: '192.168.1.11',
    uptime: '0j 0h'
  }
];

const initialMaintenances: Maintenance[] = [
  {
    id: 'MAINT-001',
    equipement: 'ARM-002',
    type: 'preventive',
    date: '2024-03-15',
    heure: '14:00',
    duree: '2h',
    technicien: 'Jean Dupont',
    priorite: 'moyenne',
    description: 'Maintenance préventive standard',
    statut: 'planifiee',
    dateCreation: '2024-03-10'
  },
  {
    id: 'MAINT-002',
    equipement: 'LIA-001',
    type: 'corrective',
    date: '2024-03-11',
    heure: '09:00',
    duree: '4h',
    technicien: 'Marie Martin',
    priorite: 'haute',
    description: 'Réparation liaison défaillante',
    statut: 'en-cours',
    dateCreation: '2024-03-08'
  }
];

export const DataProvider = ({ children }: { children: React.ReactNode }) => {
  const [armoires, setArmoires] = useState<Armoire[]>(initialArmoires);
  const [ports, setPorts] = useState<Port[]>(initialPorts);
  const [liaisons, setLiaisons] = useState<Liaison[]>(initialLiaisons);
  const [systemes, setSystemes] = useState<Systeme[]>(initialSystemes);
  const [equipments, setEquipments] = useState<Equipment[]>(initialEquipments);
  const [maintenances, setMaintenances] = useState<Maintenance[]>(initialMaintenances);

  const addArmoire = (armoire: Omit<Armoire, 'id'>) => {
    const newArmoire = {
      ...armoire,
      id: Date.now().toString()
    };
    setArmoires(prev => [...prev, newArmoire]);
  };

  const addPort = (port: Omit<Port, 'id'>) => {
    const newPort = {
      ...port,
      id: Date.now().toString()
    };
    setPorts(prev => [...prev, newPort]);
  };

  const addLiaison = (liaison: Omit<Liaison, 'id'>) => {
    const newLiaison = {
      ...liaison,
      id: Date.now().toString()
    };
    setLiaisons(prev => [...prev, newLiaison]);
  };

  const addSysteme = (systeme: Omit<Systeme, 'id'>) => {
    const newSysteme = {
      ...systeme,
      id: Date.now().toString()
    };
    setSystemes(prev => [...prev, newSysteme]);
  };

  const addEquipment = (equipment: Omit<Equipment, 'id'>) => {
    const newEquipment = {
      ...equipment,
      id: Date.now().toString()
    };
    setEquipments(prev => [...prev, newEquipment]);
  };

  const addMaintenance = (maintenance: Omit<Maintenance, 'id'>) => {
    const newMaintenance = {
      ...maintenance,
      id: Date.now().toString()
    };
    setMaintenances(prev => [...prev, newMaintenance]);
  };

  return (
    <DataContext.Provider value={{
      armoires,
      ports,
      liaisons,
      systemes,
      equipments,
      maintenances,
      addArmoire,
      addPort,
      addLiaison,
      addSysteme,
      addEquipment,
      addMaintenance
    }}>
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