import api from '@/axios';

export interface Site {
  id: number;
  libelle: string;
  description?: string;
  zones_count?: number;
  deleted_at?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface SiteListResponse {
  data: Site[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
}

export interface SiteCreateData {
  libelle: string;
  description?: string;
}

export interface SiteDeleteError {
  message: string;
  zones_count: number;
  error: 'has_zones';
}

const siteService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; with_trashed?: boolean }): Promise<SiteListResponse> {
    const response = await api.get<SiteListResponse>('/sites', { params });
    return response.data;
  },

  async getTrashed(params?: { page?: number; per_page?: number; search?: string }): Promise<SiteListResponse> {
    const response = await api.get<SiteListResponse>('/sites/trashed', { params });
    return response.data;
  },

  async getById(id: number): Promise<Site> {
    const response = await api.get<{ data: Site }>(`/sites/${id}`);
    return response.data.data;
  },

  async create(data: SiteCreateData): Promise<Site> {
    const response = await api.post<{ data: Site }>('/sites', data);
    return response.data.data;
  },

  async update(id: number, data: Partial<SiteCreateData>): Promise<Site> {
    const response = await api.put<{ data: Site }>(`/sites/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/sites/${id}`);
  },

  async restore(id: number): Promise<Site> {
    const response = await api.post<{ data: Site }>(`/sites/${id}/restore`);
    return response.data.data;
  },

  async forceDelete(id: number): Promise<void> {
    await api.delete(`/sites/${id}/force`);
  },
};

export default siteService;
