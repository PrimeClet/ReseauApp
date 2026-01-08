import api from '@/axios';

export interface Modification {
  id: number;
  user_id: number;
  coffret_id: number;
  port_id?: number;
  equipement_id?: number;
  type_modification: 'ajout_port' | 'ajout_equipement' | 'modification_connexion' | 'suppression_port' | 'suppression_equipement' | 'changement_statut_port';
  description: string;
  raison: string;
  photo_avant?: string;
  photo_apres?: string;
  photo_avant_url?: string;
  photo_apres_url?: string;
  date_intervention: string;
  heure_intervention: string;
  statut?: 'en_attente' | 'approuvee' | 'rejetee' | 'en_revision';
  commentaire_validation?: string;
  validated_by?: number;
  validated_at?: string;
  created_at?: string;
  updated_at?: string;
  user?: {
    id: number;
    name: string;
    surname?: string;
    username: string;
    full_name?: string;
  };
  validatedBy?: {
    id: number;
    name: string;
    username: string;
    full_name?: string;
  };
  coffret?: {
    id: number;
    code: string;
    nom: string;
    batiment?: {
      id: number;
      nom: string;
      ville?: string;
    };
    salle?: {
      id: number;
      nom: string;
    };
    site?: {
      id: number;
      libelle: string;
    };
    zone?: {
      id: number;
      libelle: string;
    };
  };
  port?: {
    id: number;
    port_label: string;
  };
  equipement?: {
    id: number;
    name: string;
    equipement_code: string;
  };
}

export interface ModificationListResponse {
  data: Modification[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface ModificationCreateData {
  coffret_id: number;
  port_id?: number;
  equipement_id?: number;
  type_modification: 'ajout_port' | 'ajout_equipement' | 'modification_connexion' | 'suppression_port' | 'suppression_equipement' | 'changement_statut_port';
  description: string;
  raison: string;
  photo_avant?: File;
  photo_apres?: File;
  date_intervention: string;
  heure_intervention: string;
}

const modificationService = {
  async getAll(params?: { 
    page?: number; 
    per_page?: number; 
    search?: string; 
    type_modification?: string;
    coffret_id?: number;
  }): Promise<ModificationListResponse> {
    const response = await api.get<ModificationListResponse>('/modifications', { params });
    return response.data;
  },

  async getById(id: number): Promise<Modification> {
    const response = await api.get<{ data: Modification }>(`/modifications/${id}`);
    return response.data.data;
  },

  async create(data: ModificationCreateData): Promise<Modification> {
    const formData = new FormData();
    
    formData.append('coffret_id', data.coffret_id.toString());
    if (data.port_id) {
      formData.append('port_id', data.port_id.toString());
    }
    if (data.equipement_id) {
      formData.append('equipement_id', data.equipement_id.toString());
    }
    formData.append('type_modification', data.type_modification);
    formData.append('description', data.description);
    formData.append('raison', data.raison);
    formData.append('date_intervention', data.date_intervention);
    formData.append('heure_intervention', data.heure_intervention);
    
    if (data.photo_avant) {
      formData.append('photo_avant', data.photo_avant);
    }
    if (data.photo_apres) {
      formData.append('photo_apres', data.photo_apres);
    }

    const response = await api.post<{ data: Modification }>('/modifications', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async update(id: number, data: Partial<ModificationCreateData>): Promise<Modification> {
    const formData = new FormData();
    
    if (data.coffret_id !== undefined) {
      formData.append('coffret_id', data.coffret_id.toString());
    }
    if (data.port_id !== undefined) {
      if (data.port_id !== null) {
        formData.append('port_id', data.port_id.toString());
      } else {
        formData.append('port_id', '');
      }
    }
    if (data.equipement_id !== undefined) {
      if (data.equipement_id !== null) {
        formData.append('equipement_id', data.equipement_id.toString());
      } else {
        formData.append('equipement_id', '');
      }
    }
    if (data.type_modification) {
      formData.append('type_modification', data.type_modification);
    }
    if (data.description) {
      formData.append('description', data.description);
    }
    if (data.raison) {
      formData.append('raison', data.raison);
    }
    if (data.date_intervention) {
      formData.append('date_intervention', data.date_intervention);
    }
    if (data.heure_intervention) {
      formData.append('heure_intervention', data.heure_intervention);
    }
    
    if (data.photo_avant) {
      formData.append('photo_avant', data.photo_avant);
    }
    if (data.photo_apres) {
      formData.append('photo_apres', data.photo_apres);
    }

    const response = await api.put<{ data: Modification }>(`/modifications/${id}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/modifications/${id}`);
  },

  async getPending(): Promise<Modification[]> {
    const response = await api.get<{ data: Modification[] }>('/modifications/pending');
    return response.data.data;
  },

  async approve(id: number, commentaire?: string): Promise<Modification> {
    const response = await api.post<{ data: Modification }>(`/modifications/${id}/approve`, {
      commentaire_validation: commentaire || null,
    });
    return response.data.data;
  },

  async reject(id: number, commentaire: string): Promise<Modification> {
    const response = await api.post<{ data: Modification }>(`/modifications/${id}/reject`, {
      commentaire_validation: commentaire,
    });
    return response.data.data;
  },

  async requestMoreInfo(id: number, commentaire: string): Promise<Modification> {
    const response = await api.post<{ data: Modification }>(`/modifications/${id}/request-more-info`, {
      commentaire_validation: commentaire,
    });
    return response.data.data;
  },

  async getHistory(coffretId: number, params?: {
    type_modification?: string;
    date_from?: string;
    date_to?: string;
    per_page?: number;
    page?: number;
  }): Promise<ModificationListResponse & { coffret: { id: number; code: string; nom: string } }> {
    const response = await api.get<ModificationListResponse & { coffret: { id: number; code: string; nom: string } }>(
      `/coffrets/${coffretId}/history`,
      { params }
    );
    return response.data;
  },

  async exportHistoryCsv(coffretId: number, params?: {
    type_modification?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<Blob> {
    const response = await api.get(`/coffrets/${coffretId}/history/export/csv`, {
      params,
      responseType: 'blob',
    });
    return response.data;
  },

  async exportHistoryPdf(coffretId: number, params?: {
    type_modification?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<any> {
    const response = await api.get(`/coffrets/${coffretId}/history/export/pdf`, { params });
    return response.data;
  },

  async rollback(id: number, raison: string): Promise<{ message: string; data: Modification; original_modification_id: number }> {
    const response = await api.post<{ message: string; data: Modification; original_modification_id: number }>(
      `/modifications/${id}/rollback`,
      { raison }
    );
    return response.data;
  },
};

export default modificationService;

