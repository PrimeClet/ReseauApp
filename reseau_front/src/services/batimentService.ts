import api from '@/axios';

export interface Batiment {
  id: number;
  nom: string;
  description?: string;
  salles_count?: number;
  deleted_at?: string | null;
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
  description?: string;
}

const batimentService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; with_trashed?: string; only_trashed?: string }): Promise<BatimentListResponse> {
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

  async restore(id: number): Promise<Batiment> {
    const response = await api.post<{ data: Batiment }>(`/batiments/${id}/restore`);
    return response.data.data;
  },

  async forceDelete(id: number): Promise<void> {
    await api.delete(`/batiments/${id}/force`);
  },

  async import(file: File): Promise<{ message: string; created: number; updated: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ message: string; created: number; updated: number; errors: string[] }>('/batiments/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default batimentService;
