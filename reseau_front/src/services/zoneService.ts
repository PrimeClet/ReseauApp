import api from '@/axios';

export interface Zone {
  id: number;
  site_id: number;
  libelle: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  // Optional expanded relation
  site?: {
    id: number;
    libelle: string;
  };
}

export interface ZoneListResponse {
  data: Zone[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface ZoneCreateData {
  site_id: number;
  libelle: string;
  description?: string;
}

const zoneService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; site_id?: number }): Promise<ZoneListResponse> {
    const response = await api.get<ZoneListResponse>('/zones', { params });
    return response.data;
  },

  async getById(id: number): Promise<Zone> {
    const response = await api.get<{ data: Zone }>(`/zones/${id}`);
    return response.data.data;
  },

  async create(data: ZoneCreateData): Promise<Zone> {
    const response = await api.post<{ data: Zone }>('/zones', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<ZoneCreateData>): Promise<Zone> {
    const response = await api.put<{ data: Zone }>(`/zones/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/zones/${id}`);
  },
};

export default zoneService;




