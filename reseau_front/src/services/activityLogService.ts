import api from '@/axios';

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  model_type: string | null;
  model_id: number | null;
  description: string;
  old_values: any;
  new_values: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  updated_at: string;
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

export interface ActivityLogListResponse {
  data: ActivityLog[];
  current_page?: number;
  last_page?: number;
  per_page?: number;
  total?: number;
  from?: number;
  to?: number;
}

export interface ActivityLogStats {
  total_actions: number;
  actions_by_type: Array<{ action: string; count: number }>;
  actions_by_user: Array<{ user_id: number; count: number; user: { id: number; name: string } }>;
  actions_by_model: Array<{ model_type: string; count: number }>;
  recent_activities: ActivityLog[];
}

const activityLogService = {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    user_id?: number;
    action?: string;
    model_type?: string;
    date_from?: string;
    date_to?: string;
  }): Promise<ActivityLogListResponse> {
    const response = await api.get<ActivityLogListResponse>('/activity-logs', { params });
    return response.data;
  },

  async getById(id: number): Promise<ActivityLog> {
    const response = await api.get<{ data: ActivityLog }>(`/activity-logs/${id}`);
    return response.data.data;
  },

  async getStats(params?: { date_from?: string; date_to?: string }): Promise<ActivityLogStats> {
    const response = await api.get<{ data: ActivityLogStats }>('/activity-logs/stats', { params });
    return response.data.data;
  },

  async getModelLogs(modelType: string, modelId: number): Promise<ActivityLog[]> {
    const response = await api.get<{ data: ActivityLog[] }>(`/activity-logs/model/${modelType}/${modelId}`);
    return response.data.data;
  },

  async cleanup(days: number): Promise<{ message: string; deleted_count: number }> {
    const response = await api.post<{ message: string; deleted_count: number }>('/activity-logs/cleanup', { days });
    return response.data;
  },
};

export default activityLogService;
