import api from '@/axios';

export interface Coffret {
  id: number;
  code: string;
  nom: string;
  modele?: string;
  photo?: string;
  photo_url?: string;
  piece: string;
  emplacement?: string;
  long: number;
  lat: number;
  status: string;
  batiment_id?: number;
  salle_id?: number;
  site_id?: number;
  zone_id?: number;
  qr_code?: string;
  created_at?: string;
  updated_at?: string;
  equipements?: Equipement[];
  batiment?: { id: number; nom: string };
  salle?: { id: number; nom: string };
  site?: { id: number; libelle: string };
  zone?: { id: number; libelle: string };
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
  modele?: string;
  photo?: string;
  piece?: string;
  emplacement?: string;
  long?: number;
  lat?: number;
  site_id?: number;
  zone_id?: number;
  batiment_id?: number;
  salle_id?: number;
  status?: string;
}

const coffretService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<CoffretListResponse> {
    const response = await api.get<CoffretListResponse>('/coffrets', { params });
    return response.data;
  },

  async getById(id: number): Promise<Coffret> {
    const response = await api.get<{ data: Coffret }>(`/coffrets/${id}`);
    return response.data.data;
  },

  async create(data: CoffretCreateData | FormData): Promise<Coffret> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.post<{ data: Coffret }>(
      '/coffrets',
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return response.data.data;
  },

  async update(id: number, data: Partial<CoffretCreateData> | FormData): Promise<Coffret> {
    const isFormData = typeof FormData !== 'undefined' && data instanceof FormData;
    const response = await api.put<{ data: Coffret }>(
      `/coffrets/${id}`,
      data,
      isFormData ? { headers: { 'Content-Type': 'multipart/form-data' } } : undefined
    );
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/coffrets/${id}`);
  },
};

export default coffretService;
