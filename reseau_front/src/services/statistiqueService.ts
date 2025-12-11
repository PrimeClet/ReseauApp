import api from '@/axios';

export interface EntityStats {
  total: number;
  active?: number;
  inactive?: number;
  poe_enabled?: number;
}

export interface GlobalStats {
  coffrets: EntityStats;
  equipements: EntityStats;
  ports: EntityStats;
  liaisons: EntityStats;
  systems: EntityStats;
  metrics: EntityStats;
}

export interface SystemsByType {
  [type: string]: number;
}

export interface EquipementsByCoffret {
  coffret_id: number;
  coffret_nom: string;
  count: number;
}

export interface PortsByVlan {
  vlan: string;
  count: number;
}

const statistiqueService = {
  async getGlobalStats(): Promise<GlobalStats> {
    const response = await api.get<GlobalStats>('/stats/global');
    return response.data;
  },

  async getSystemsByType(): Promise<SystemsByType> {
    const response = await api.get<SystemsByType>('/stats/systems-by-type');
    return response.data;
  },

  async getEquipementsByCoffret(): Promise<EquipementsByCoffret[]> {
    const response = await api.get<EquipementsByCoffret[]>('/stats/equipements-by-coffret');
    return response.data;
  },

  async getPortsByVlan(): Promise<PortsByVlan[]> {
    const response = await api.get<PortsByVlan[]>('/stats/ports-by-vlan');
    return response.data;
  },
};

export default statistiqueService;
