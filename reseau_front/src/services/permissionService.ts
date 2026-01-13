import api from '@/axios';

export interface Permission {
  id: number;
  name: string;
  action: string;
  action_label: string;
}

export interface PermissionModule {
  module: string;
  module_label: string;
  permissions: Permission[];
}

export interface ModuleInfo {
  id: string;
  label: string;
  icon: string;
}

const permissionService = {
  async getAll(): Promise<{ data: PermissionModule[]; all_permissions: string[] }> {
    const response = await api.get<{ data: PermissionModule[]; all_permissions: string[] }>('/permissions');
    return response.data;
  },

  async getModules(): Promise<ModuleInfo[]> {
    const response = await api.get<{ data: ModuleInfo[] }>('/permissions/modules');
    return response.data.data;
  },

  async getById(id: number): Promise<{ id: number; name: string; roles: string[] }> {
    const response = await api.get<{ data: { id: number; name: string; roles: string[] } }>(`/permissions/${id}`);
    return response.data.data;
  },
};

export default permissionService;
