import api from '@/axios';

export interface Equipement {
  id: number;
  equipement_code: string;
  qr_code?: string;
  name: string;
  type: string;
  modele?: string;
  fabricant?: string;
  numero_serie?: string;
  type_reseau?: 'IT' | 'OT';
  description?: string;
  direction_in_out?: string;
  vlan?: string;
  ip_address?: string;
  mac_address?: string;
  coffret_id: number;
  batiment_id?: number;
  salle_id?: number;
  status: string;
  is_principal?: boolean;
  is_manageable?: boolean;
  nombre_ports?: number;
  created_at?: string;
  updated_at?: string;
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
  modele?: string;
  fabricant?: string;
  numero_serie?: string;
  type_reseau?: 'IT' | 'OT';
  description?: string;
  direction_in_out?: string;
  vlan?: string;
  ip_address?: string;
  mac_address?: string;
  coffret_id: number;
  batiment_id?: number;
  salle_id?: number;
  status?: string;
  is_principal?: boolean;
  is_manageable?: boolean;
  nombre_ports?: number;
}

// Interfaces pour les VLANs des switchs manageables
export interface VlanConfig {
  id: number;
  lan_id: number;
  name: string;
  vlan_id: number;
  subnet?: string;
  gateway?: string;
  description?: string;
  is_tagged: boolean;
  ports?: string;
}

export interface VlanAttachData {
  lan_id: number;
  is_tagged?: boolean;
  ports?: string;
}

export interface ManageableSwitch {
  id: number;
  equipement_code: string;
  name: string;
  type: string;
  ip_address?: string;
  coffret_id: number;
  coffret?: {
    id: number;
    code: string;
    nom: string;
  };
}

// Interfaces pour la chaîne de dépendance UP/DOWN
export interface DependencyChainPort {
  id: number;
  port_label: string;
  device_name?: string;
  speed?: string;
  connexion_type?: string;
}

export interface DependencyChainItem {
  equipement: {
    id: number;
    name: string;
    type: string;
    equipement_code: string;
    ip_address?: string;
    mac_address?: string;
    status: string;
    is_principal?: boolean;
    coffret_id?: number;
  };
  liaison: {
    id: number;
    direction: 'up' | 'down';
    media?: string;
    cable_type?: string;
    length?: number;
    label?: string;
    status?: boolean;
  };
  from_port?: DependencyChainPort;
  to_port?: DependencyChainPort;
  depth: number;
}

export interface DependencyChainResponse {
  data: {
    equipement: {
      id: number;
      name: string;
      type: string;
      equipement_code: string;
      ip_address?: string;
      mac_address?: string;
      status: string;
      is_principal?: boolean;
    };
    upstream: DependencyChainItem[];
    downstream: DependencyChainItem[];
    upstream_count: number;
    downstream_count: number;
  };
}

export interface ImpactAnalysisResponse {
  data: {
    source_equipement: {
      id: number;
      name: string;
      type: string;
    };
    impacted_equipements: Array<{
      equipement: {
        id: number;
        name: string;
        type: string;
        equipement_code: string;
        ip_address?: string;
        status: string;
        coffret_id?: number;
      };
      depth: number;
    }>;
    total_impacted: number;
    impact_by_type: Record<string, number>;
    severity: 'none' | 'low' | 'medium' | 'high' | 'critical';
  };
}

const equipementService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; with_trashed?: string; only_trashed?: string }): Promise<EquipementListResponse> {
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

  async restore(id: number): Promise<Equipement> {
    const response = await api.post<{ data: Equipement }>(`/equipements/${id}/restore`);
    return response.data.data;
  },

  async import(file: File): Promise<{ message: string; created: number; updated: number; errors: string[] }> {
    const formData = new FormData();
    formData.append('file', file);
    const response = await api.post<{ message: string; created: number; updated: number; errors: string[] }>('/equipements/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  // ==========================================
  // CHAÎNE DE DÉPENDANCE UP/DOWN
  // ==========================================

  /**
   * Recherche un équipement par son code (pour scan QR)
   */
  async findByCode(code: string): Promise<Equipement> {
    const response = await api.get<{ data: Equipement }>('/equipements/find-by-code', {
      params: { code }
    });
    return response.data.data;
  },

  /**
   * Récupère la chaîne de dépendance complète d'un équipement (UP et DOWN)
   */
  async getDependencyChain(id: number, maxDepth?: number): Promise<DependencyChainResponse['data']> {
    const response = await api.get<DependencyChainResponse>(`/equipements/${id}/dependency-chain`, {
      params: maxDepth ? { max_depth: maxDepth } : undefined
    });
    return response.data.data;
  },

  /**
   * Analyse d'impact : retourne les équipements affectés si cet équipement tombe
   */
  async getImpactAnalysis(id: number): Promise<ImpactAnalysisResponse['data']> {
    const response = await api.get<ImpactAnalysisResponse>(`/equipements/${id}/impact-analysis`);
    return response.data.data;
  },

  /**
   * Récupère le switch principal d'une baie
   */
  async getPrincipalSwitch(coffretId: number): Promise<Equipement | null> {
    try {
      const response = await api.get<{ data: Equipement }>(`/coffrets/${coffretId}/principal-switch`);
      return response.data.data;
    } catch {
      return null;
    }
  },

  /**
   * Définit un équipement comme switch principal de sa baie
   */
  async setAsPrincipal(id: number): Promise<Equipement> {
    const response = await api.post<{ data: Equipement }>(`/equipements/${id}/set-principal`);
    return response.data.data;
  },

  // ==========================================
  // GESTION DES VLANS (SWITCHS MANAGEABLES)
  // ==========================================

  /**
   * Récupère la liste des switchs manageables
   */
  async getManageableSwitches(): Promise<ManageableSwitch[]> {
    const response = await api.get<{ data: ManageableSwitch[] }>('/equipements/manageable-switches');
    return response.data.data;
  },

  /**
   * Récupère les VLANs configurés sur un switch manageable
   */
  async getVlans(equipementId: number): Promise<VlanConfig[]> {
    const response = await api.get<{ data: VlanConfig[] }>(`/equipements/${equipementId}/vlans`);
    return response.data.data;
  },

  /**
   * Attache un VLAN à un switch manageable
   */
  async attachVlan(equipementId: number, data: VlanAttachData): Promise<VlanConfig> {
    const response = await api.post<{ data: VlanConfig }>(`/equipements/${equipementId}/vlans`, data);
    return response.data.data;
  },

  /**
   * Met à jour la configuration d'un VLAN sur un switch
   */
  async updateVlanConfig(equipementId: number, data: VlanAttachData): Promise<VlanConfig> {
    const response = await api.put<{ data: VlanConfig }>(`/equipements/${equipementId}/vlans`, data);
    return response.data.data;
  },

  /**
   * Détache un VLAN d'un switch manageable
   */
  async detachVlan(equipementId: number, lanId: number): Promise<void> {
    await api.delete(`/equipements/${equipementId}/vlans`, {
      data: { lan_id: lanId }
    });
  },
};

export default equipementService;
