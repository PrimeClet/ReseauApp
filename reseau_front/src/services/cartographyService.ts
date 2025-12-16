import api from '@/axios';

export interface TopologyNode {
  id: string;
  name: string;
  role: "core" | "distribution" | "access" | "endpoint";
  status: "up" | "warn" | "down" | "maintenance";
  position: { x: number; y: number };
  site: string;
  ip: string;
  model: string;
  notes?: string;
  icon: string;
  ports?: Array<{
    id: string;
    label: string;
    device_name: string;
    vlan?: string;
    speed?: string;
    poe_enabled?: boolean;
  }>;
}

export interface TopologyLink {
  id: string;
  from: string;
  to: string;
  type: "fiber" | "copper" | "wireless";
  vlan: string;
  status: "up" | "warn" | "down";
  bandwidth: string;
  fromPort?: string;
  toPort?: string;
}

export interface LanTopology {
  id: string;
  name: string;
  subnet?: string;
  vlan?: string;
  description?: string;
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface LanListItem {
  id: string;
  name: string;
  batiment_id?: number;
  salle_id?: number;
}

export interface BatimentItem {
  id: number;
  nom: string;
}

export interface SalleItem {
  id: number;
  nom: string;
  batiment_id: number;
  batiment_nom?: string;
}

const cartographyService = {
  async getLans(): Promise<LanListItem[]> {
    const response = await api.get<{ data: LanListItem[] }>('/cartography/lans');
    return response.data.data;
  },

  async getBatiments(): Promise<BatimentItem[]> {
    const response = await api.get<{ data: BatimentItem[] }>('/cartography/batiments');
    return response.data.data;
  },

  async getSalles(batimentId?: number): Promise<SalleItem[]> {
    const params = batimentId ? { batiment_id: batimentId } : {};
    const response = await api.get<{ data: SalleItem[] }>('/cartography/salles', { params });
    return response.data.data;
  },

  async getLanTopology(id?: string, filters?: { batiment_id?: number; salle_id?: number; lan_id?: number }): Promise<LanTopology> {
    let url = '/cartography/topology';
    const params: any = {};
    
    if (id) {
      url = `/cartography/lans/${id}`;
      const response = await api.get<{ data: LanTopology }>(url);
      return response.data.data;
    }
    
    if (filters) {
      if (filters.lan_id) {
        url = `/cartography/lans/${filters.lan_id}`;
        const response = await api.get<{ data: LanTopology }>(url);
        return response.data.data;
      } else {
        if (filters.batiment_id) params.batiment_id = filters.batiment_id;
        if (filters.salle_id) params.salle_id = filters.salle_id;
      }
    }
    
    const response = await api.get<{ data: LanTopology }>(url, { params });
    return response.data.data;
  },
};

export default cartographyService;
