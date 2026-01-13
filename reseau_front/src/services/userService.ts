import api from '@/axios';

export interface User {
  id: number;
  name: string;
  surname?: string;
  username: string;
  email: string;
  phone?: string;
  is_active: boolean;
  roles: string[];
  permissions: string[];
  created_at?: string;
  updated_at?: string;
}

export interface UserCreateData {
  name: string;
  surname?: string;
  username: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  is_active?: boolean;
  roles?: string[];
}

export interface UserUpdateData {
  name?: string;
  surname?: string;
  username?: string;
  email?: string;
  phone?: string;
  password?: string;
  password_confirmation?: string;
  is_active?: boolean;
  roles?: string[];
}

export interface UserListResponse {
  data: User[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const userService = {
  async getAll(params?: { page?: number; per_page?: number; search?: string; role?: string; is_active?: boolean }): Promise<UserListResponse> {
    const response = await api.get<UserListResponse>('/users', { params });
    return response.data;
  },

  async getById(id: number): Promise<User> {
    const response = await api.get<{ data: User }>(`/users/${id}`);
    return response.data.data;
  },

  async create(data: UserCreateData): Promise<User> {
    const response = await api.post<{ data: User }>('/users', data);
    return response.data.data;
  },

  async update(id: number, data: UserUpdateData): Promise<User> {
    const response = await api.put<{ data: User }>(`/users/${id}`, data);
    return response.data.data;
  },

  async delete(id: number): Promise<void> {
    await api.delete(`/users/${id}`);
  },

  async toggleStatus(id: number): Promise<User> {
    const response = await api.post<{ data: User }>(`/users/${id}/toggle-status`);
    return response.data.data;
  },

  async assignRoles(id: number, roles: string[]): Promise<User> {
    const response = await api.post<{ data: User }>(`/users/${id}/roles`, { roles });
    return response.data.data;
  },

  async assignPermissions(id: number, permissions: string[]): Promise<User> {
    const response = await api.post<{ data: User }>(`/users/${id}/permissions`, { permissions });
    return response.data.data;
  },
};

export default userService;
