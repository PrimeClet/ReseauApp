import api from '@/axios';

export interface PriseMurale {
  id: number;
  equipement_code: string;
  qr_code?: string;
  name: string;
  type: 'prise_murale';
  modele?: string; // Type de prise (RJ45, Fibre, Coaxial)
  description?: string; // Emplacement détaillé
  salle_id?: number;
  batiment_id?: number;
  status: string;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string;
  salle?: {
    id: number;
    nom: string;
    batiment?: {
      id: number;
      nom: string;
    };
  };
  batiment?: {
    id: number;
    nom: string;
  };
  ports?: PriseMuralePort[];
}

export interface PriseMuralePort {
  id: number;
  port_label: string;
  device_name: string;
  statut: string;
  liaisons_as_destination?: Array<{
    id: number;
    label: string;
    media: string;
    length?: number;
    status: boolean;
    from_port?: {
      id: number;
      port_label: string;
      equipement?: {
        id: number;
        name: string;
        equipement_code: string;
      };
    };
  }>;
}

export interface PriseMuraleListResponse {
  data: PriseMurale[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface PriseMuralePortConnection {
  switch_port_id: number;
  liaison_media?: string;
  liaison_length?: number;
}

export interface PriseMuraleCreateData {
  name: string;
  salle_id: number;
  batiment_id?: number;
  emplacement?: string;
  type_prise: 'RJ45' | 'Fibre' | 'Coaxial';
  status?: string;
  ports: PriseMuralePortConnection[];
}

export interface PriseMuraleBulkCreateData {
  salle_id: number;
  batiment_id?: number;
  type_prise: 'RJ45' | 'Fibre' | 'Coaxial';
  status?: string;
  prises: Array<{
    name: string;
    emplacement?: string;
    ports: PriseMuralePortConnection[];
  }>;
}

export interface PriseMuraleStats {
  total: number;
  actives: number;
  inactives: number;
  connectees: number;
  non_connectees: number;
}

const priseMuraleService = {
  /**
   * Récupère toutes les prises murales
   */
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    salle_id?: number;
    batiment_id?: number;
    with_trashed?: string;
  }): Promise<PriseMuraleListResponse> {
    const response = await api.get<PriseMuraleListResponse>('/prises-murales', { params });
    return response.data;
  },

  /**
   * Récupère les statistiques des prises murales
   */
  async getStats(): Promise<PriseMuraleStats> {
    const response = await api.get<{ data: PriseMuraleStats }>('/prises-murales/stats');
    return response.data.data;
  },

  /**
   * Crée une nouvelle prise murale avec ses ports et liaisons
   */
  async create(data: PriseMuraleCreateData): Promise<{
    prise: PriseMurale;
    ports: PriseMuralePort[];
    liaisons: any[];
  }> {
    const response = await api.post<{
      data: {
        prise: PriseMurale;
        ports: PriseMuralePort[];
        liaisons: any[];
      };
    }>('/prises-murales', data);
    return response.data.data;
  },

  /**
   * Crée plusieurs prises murales en une seule transaction
   */
  async createBulk(data: PriseMuraleBulkCreateData): Promise<{
    message: string;
    data: Array<{
      prise: PriseMurale;
      ports: PriseMuralePort[];
      liaisons: any[];
    }>;
  }> {
    const response = await api.post<{
      message: string;
      data: Array<{
        prise: PriseMurale;
        ports: PriseMuralePort[];
        liaisons: any[];
      }>;
    }>('/prises-murales/bulk', data);
    return response.data;
  },

  /**
   * Met à jour une prise murale
   */
  async update(id: number, data: Partial<PriseMuraleCreateData>): Promise<PriseMurale> {
    const response = await api.put<{ data: PriseMurale }>(`/prises-murales/${id}`, data);
    return response.data.data;
  },

  /**
   * Supprime une prise murale (soft delete)
   */
  async delete(id: number): Promise<void> {
    await api.delete(`/prises-murales/${id}`);
  },

  /**
   * Restaure une prise murale supprimée
   */
  async restore(id: number): Promise<PriseMurale> {
    const response = await api.post<{ data: PriseMurale }>(`/equipements/${id}/restore`);
    return response.data.data;
  },
};

export default priseMuraleService;
