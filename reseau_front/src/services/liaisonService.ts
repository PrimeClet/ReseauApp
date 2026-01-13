import api from '@/axios';

export interface Liaison {
  id: number;
  from: number; // ID du port source
  to: number; // ID du port destination
  label?: string;
  media?: string;
  length?: number;
  status: boolean;
  deleted_at?: string;
  created_at?: string;
  updated_at?: string;
  from_port?: {
    id: number;
    port_label: string;
    device_name: string;
    equipement?: {
      id: number;
      name: string;
      equipement_code: string;
    };
  };
  to_port?: {
    id: number;
    port_label: string;
    device_name: string;
    equipement?: {
      id: number;
      name: string;
      equipement_code: string;
    };
  };
}

export interface LiaisonListResponse {
  data: Liaison[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface LiaisonCreateData {
  from: number;
  to: number;
  label?: string;
  media?: string;
  length?: number;
  status?: boolean;
}

const liaisonService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; with_trashed?: string; only_trashed?: string }): Promise<LiaisonListResponse> {
    const response = await api.get<LiaisonListResponse>('/liaisons', { params });
    return response.data;
  },

  async getById(id: number): Promise<Liaison> {
    const response = await api.get<{ data: Liaison }>(`/liaisons/${id}`);
    return response.data.data;
  },

  async create(data: LiaisonCreateData): Promise<Liaison> {
    const response = await api.post<{ data: Liaison }>('/liaisons', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<LiaisonCreateData>): Promise<Liaison> {
    const response = await api.put<{ data: Liaison }>(`/liaisons/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/liaisons/${id}`);
  },

  async restore(id: number): Promise<Liaison> {
    const response = await api.post<{ data: Liaison }>(`/liaisons/${id}/restore`);
    return response.data.data;
  },
};

export default liaisonService;
