import api from '@/axios';

export interface Lan {
  id: number;
  name: string;
  subnet: string;
  vlan_id: number;
  gateway?: string;
  site: string;
  status: string;
  description?: string;
  batiment_id: number;
  salle_id: number;
  created_at?: string;
  updated_at?: string;
  batiment?: {
    id: number;
    nom: string;
  };
  salle?: {
    id: number;
    nom: string;
  };
}

export interface LanListResponse {
  data: Lan[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface LanCreateData {
  name: string;
  subnet: string;
  vlan_id: number;
  gateway?: string;
  site: string;
  status: string;
  description?: string;
  batiment_id: number;
  salle_id: number;
}

const lanService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<LanListResponse> {
    const response = await api.get<LanListResponse>('/lans', { params });
    return response.data;
  },

  async getById(id: number): Promise<Lan> {
    const response = await api.get<{ data: Lan }>(`/lans/${id}`);
    return response.data.data;
  },

  async create(data: LanCreateData): Promise<Lan> {
    const response = await api.post<{ data: Lan }>('/lans', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<LanCreateData>): Promise<Lan> {
    const response = await api.put<{ data: Lan }>(`/lans/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/lans/${id}`);
  },
};

export default lanService;

