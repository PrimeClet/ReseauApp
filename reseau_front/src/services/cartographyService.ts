import api from '@/axios';

export interface TopologyNode {
  id: string;
  label: string;
  type: string;
  ip_address?: string;
  vlan?: string;
  status?: string;
}

export interface TopologyLink {
  source: string;
  target: string;
  label?: string;
  media?: string;
  length?: number;
  status?: boolean;
}

export interface LanTopology {
  id: string;
  name: string;
  nodes: TopologyNode[];
  links: TopologyLink[];
}

export interface LanListItem {
  id: string;
  name: string;
}

const cartographyService = {
  async getLans(): Promise<LanListItem[]> {
    const response = await api.get<{ data: LanListItem[] }>('/cartography/lans');
    return response.data.data;
  },

  async getLanTopology(id: string): Promise<LanTopology> {
    const response = await api.get<{ data: LanTopology }>(`/cartography/lans/${id}`);
    return response.data.data;
  },
};

export default cartographyService;
