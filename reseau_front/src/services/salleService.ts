import api from '@/axios';

export interface Salle {
  id: number;
  nom: string;
  batiment_id: number;
  etage: string;
  capacite: number;
  type: string;
  etat: string;
  description?: string;
  created_at?: string;
  updated_at?: string;
  batiment?: {
    id: number;
    nom: string;
  };
}

export interface SalleListResponse {
  data: Salle[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface SalleCreateData {
  nom: string;
  batiment_id: number;
  etage: string;
  capacite: number;
  type: string;
  etat: string;
  description?: string;
}

const salleService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; batiment_id?: number }): Promise<SalleListResponse> {
    const response = await api.get<SalleListResponse>('/salles', { params });
    return response.data;
  },

  async getById(id: number): Promise<Salle> {
    const response = await api.get<{ data: Salle }>(`/salles/${id}`);
    return response.data.data;
  },

  async create(data: SalleCreateData): Promise<Salle> {
    const response = await api.post<{ data: Salle }>('/salles', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<SalleCreateData>): Promise<Salle> {
    const response = await api.put<{ data: Salle }>(`/salles/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/salles/${id}`);
  },
};

export default salleService;

