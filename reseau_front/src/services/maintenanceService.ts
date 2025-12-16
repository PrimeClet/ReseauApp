import api from '@/axios';

export interface Maintenance {
  id: number;
  equipement_id?: number;
  type: string;
  date_debut: string;
  heure_debut: string;
  duree: string;
  technicien: string;
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  description: string;
  statut: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
  created_at?: string;
  updated_at?: string;
  equipement?: {
    id: number;
    name: string;
    equipement_code: string;
  };
}

export interface MaintenanceListResponse {
  data: Maintenance[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface MaintenanceCreateData {
  equipement_id?: number;
  type: string;
  date_debut: string;
  heure_debut: string;
  duree: string;
  technicien: string;
  priorite: 'basse' | 'moyenne' | 'haute' | 'critique';
  description: string;
  statut?: 'planifiee' | 'en_cours' | 'terminee' | 'annulee';
}

const maintenanceService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; statut?: string }): Promise<MaintenanceListResponse> {
    const response = await api.get<MaintenanceListResponse>('/maintenances', { params });
    return response.data;
  },

  async getById(id: number): Promise<Maintenance> {
    const response = await api.get<{ data: Maintenance }>(`/maintenances/${id}`);
    return response.data.data;
  },

  async create(data: MaintenanceCreateData): Promise<Maintenance> {
    const response = await api.post<{ data: Maintenance }>('/maintenances', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<MaintenanceCreateData>): Promise<Maintenance> {
    const response = await api.put<{ data: Maintenance }>(`/maintenances/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/maintenances/${id}`);
  },
};

export default maintenanceService;

