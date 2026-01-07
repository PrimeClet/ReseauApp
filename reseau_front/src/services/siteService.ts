import api from '@/axios';

export interface Site {
  id: number;
  libelle: string;
  description?: string;
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

const siteService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string }): Promise<SiteListResponse> {
    const response = await api.get<SiteListResponse>('/sites', { params });
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
};

export default siteService;


