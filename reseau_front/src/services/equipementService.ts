import api from '@/axios';

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
  batiment_id?: number;
  salle_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  coffret?: {
    id: number;
    code: string;
    nom: string;
    piece?: string;
    batiment?: {
      id: number;
      nom: string;
      ville?: string;
    };
    salle?: {
      id: number;
      nom: string;
    };
  };
  batiment?: {
    id: number;
    nom: string;
    ville?: string;
  };
  salle?: {
    id: number;
    nom: string;
  };
  ports?: Port[];
}

export interface Port {
  id: number;
  port_label: string;
  device_name: string;
  poe_enabled: boolean;
  vlan?: string;
  speed?: string;
}

export interface EquipementListResponse {
  data: Equipement[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface EquipementCreateData {
  equipement_code?: string;
  name: string;
  type: string;
  description?: string;
  direction_in_out?: string;
  vlan?: string;
  ip_address?: string;
  coffret_id: number;
  batiment_id?: number;
  salle_id?: number;
  status?: string;
}

const equipementService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<EquipementListResponse> {
    const response = await api.get<EquipementListResponse>('/equipements', { params });
    return response.data;
  },

  async getById(id: number): Promise<Equipement> {
    const response = await api.get<{ data: Equipement }>(`/equipements/${id}`);
    return response.data.data;
  },

  async create(data: EquipementCreateData): Promise<Equipement> {
    const response = await api.post<{ data: Equipement }>('/equipements', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<EquipementCreateData>): Promise<Equipement> {
    const response = await api.put<{ data: Equipement }>(`/equipements/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/equipements/${id}`);
  },
};

export default equipementService;
