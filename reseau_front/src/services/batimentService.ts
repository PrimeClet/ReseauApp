import api from '@/axios';

export interface Batiment {
  id: number;
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  etat: string;
  nombre_salles?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface BatimentListResponse {
  data: Batiment[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface BatimentCreateData {
  nom: string;
  adresse: string;
  ville: string;
  code_postal: string;
  etat: string;
  description?: string;
}

const batimentService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<BatimentListResponse> {
    const response = await api.get<BatimentListResponse>('/batiments', { params });
    return response.data;
  },

  async getById(id: number): Promise<Batiment> {
    const response = await api.get<{ data: Batiment }>(`/batiments/${id}`);
    return response.data.data;
  },

  async create(data: BatimentCreateData): Promise<Batiment> {
    const response = await api.post<{ data: Batiment }>('/batiments', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<BatimentCreateData>): Promise<Batiment> {
    const response = await api.put<{ data: Batiment }>(`/batiments/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/batiments/${id}`);
  },
};

export default batimentService;

