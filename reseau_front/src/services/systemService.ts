import api from '@/axios';

export interface System {
  id: number;
  name: string;
  type: string;
  description?: string;
  vendor?: string;
  endpoint?: string;
  monitored_scope?: string;
  coffret_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  coffret?: {
    id: number;
    code: string;
    nom: string;
  };
}

export interface SystemListResponse {
  data: System[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface SystemCreateData {
  name: string;
  type: string;
  description?: string;
  vendor?: string;
  endpoint?: string;
  monitored_scope?: string;
  coffret_id?: number;
  status?: string;
}

const systemService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<SystemListResponse> {
    const response = await api.get<SystemListResponse>('/systems', { params });
    return response.data;
  },

  async getById(id: number): Promise<System> {
    const response = await api.get<{ data: System }>(`/systems/${id}`);
    return response.data.data;
  },

  async create(data: SystemCreateData): Promise<System> {
    const response = await api.post<{ data: System }>('/systems', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<SystemCreateData>): Promise<System> {
    const response = await api.put<{ data: System }>(`/systems/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/systems/${id}`);
  },
};

export default systemService;
