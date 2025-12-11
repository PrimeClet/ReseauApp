import api from '@/axios';

export interface Port {
  id: number;
  port_label: string;
  device_name: string;
  poe_enabled: boolean;
  vlan?: string;
  speed?: string;
  connected_equipment_id?: number;
  created_at?: string;
  updated_at?: string;
  connected_equipment?: {
    id: number;
    name: string;
    equipement_code: string;
  };
}

export interface PortListResponse {
  data: Port[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface PortCreateData {
  port_label: string;
  device_name: string;
  poe_enabled?: boolean;
  vlan?: string;
  speed?: string;
  connected_equipment_id?: number;
}

const portService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<PortListResponse> {
    const response = await api.get<PortListResponse>('/ports', { params });
    return response.data;
  },

  async getById(id: number): Promise<Port> {
    const response = await api.get<{ data: Port }>(`/ports/${id}`);
    return response.data.data;
  },

  async create(data: PortCreateData): Promise<Port> {
    const response = await api.post<{ data: Port }>('/ports', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<PortCreateData>): Promise<Port> {
    const response = await api.put<{ data: Port }>(`/ports/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/ports/${id}`);
  },
};

export default portService;
