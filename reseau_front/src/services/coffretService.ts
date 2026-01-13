import api from '@/axios';

export interface Coffret {
  id: number;
  code: string;
  nom: string;
  piece: string;
  long: number;
  lat: number;
  status: string;
  batiment_id?: number;
  salle_id?: number;
  qr_code?: string;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
  equipements?: Equipement[];
  batiment?: { id: number; nom: string };
  salle?: { id: number; nom: string };
}

export interface Equipement {
  id: number;
  equipement_code: string;
  name: string;
  type: string;
  description?: string;
  direction_in_out?: string;
  vlan?: string;
  ip_address?: string;
  coffret_id: number;
  status: string;
}

export interface CoffretListResponse {
  data: Coffret[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CoffretCreateData {
  code?: string;
  nom: string;
  piece?: string;
  long?: number;
  lat?: number;
  batiment_id?: number;
  salle_id?: number;
  status?: string;
}

const coffretService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; batiment_id?: number; salle_id?: number; with_trashed?: string; only_trashed?: string; status?: string }): Promise<CoffretListResponse> {
    const response = await api.get<CoffretListResponse>('/coffrets', { params });
    return response.data;
  },

  async getById(id: number): Promise<Coffret> {
    const response = await api.get<{ data: Coffret }>(`/coffrets/${id}`);
    return response.data.data;
  },

  async create(data: CoffretCreateData): Promise<Coffret> {
    const response = await api.post<{ data: Coffret }>('/coffrets', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<CoffretCreateData>): Promise<Coffret> {
    const response = await api.put<{ data: Coffret }>(`/coffrets/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/coffrets/${id}`);
  },

  async restore(id: number): Promise<Coffret> {
    const response = await api.post<{ data: Coffret }>(`/coffrets/${id}/restore`);
    return response.data.data;
  },

  async import(file: File): Promise<{ message: string; created: number; updated: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ message: string; created: number; updated: number; errors: string[] }>('/coffrets/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

export default coffretService;
