import api from '@/axios';

export interface Role {
  id: number;
  name: string;
  guard_name: string;
  permissions: string[];
  permissions_count: number;
  users_count: number;
  created_at?: string;
  updated_at?: string;
}

export interface RoleDetail {
  id: number;
  name: string;
  guard_name: string;
  permissions: { id: number; name: string }[];
  users: { id: number; name: string; email: string }[];
  created_at?: string;
  updated_at?: string;
}

export interface RoleCreateData {
  name: string;
  permissions?: string[];
}

export interface RoleUpdateData {
  name?: string;
  permissions?: string[];
}

const roleService = {
  async getAll(params?: { search?: string }): Promise<Role[]> {
    const response = await api.get<{ data: Role[] }>('/roles', { params });
    return response.data.data;
  },

  async getById(id: number): Promise<RoleDetail> {
    const response = await api.get<{ data: RoleDetail }>(`/roles/${id}`);
    return response.data.data;
  },

  async create(data: RoleCreateData): Promise<Role> {
    const response = await api.post<{ data: Role }>('/roles', data);
    return response.data.data;
  },

  async update(id: number, data: RoleUpdateData): Promise<Role> {
    const response = await api.put<{ data: Role }>(`/roles/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/roles/${id}`);
  },

  async assignPermissions(id: number, permissions: string[]): Promise<Role> {
    const response = await api.post<{ data: Role }>(`/roles/${id}/permissions`, { permissions });
    return response.data.data;
  },
};

export default roleService;
