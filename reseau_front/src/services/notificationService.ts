import api from '@/axios';

export interface Notification {
  id: number;
  user_id: number;
  type: 'nouvelle_demande' | 'demande_validee' | 'demande_rejetee' | 'demande_revision' | 'intervention_baie';
  title: string;
  message: string;
  data?: {
    modification_id?: number;
    coffret_id?: number;
    type_modification?: string;
    commentaire?: string;
  };
  read: boolean;
  read_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  data: Notification[];
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

const notificationService = {
  async getAll(params?: {
    read?: boolean;
    type?: string;
    per_page?: number;
    page?: number;
  }): Promise<NotificationListResponse> {
    const response = await api.get<NotificationListResponse>('/notifications', { params });
    return response.data;
  },

  async getUnreadCount(): Promise<{ count: number }> {
    const response = await api.get<{ count: number }>('/notifications/unread-count');
    return response.data;
  },

  async getUnread(): Promise<{ data: Notification[] }> {
    const response = await api.get<{ data: Notification[] }>('/notifications/unread');
    return response.data;
  },

  async markAsRead(id: number): Promise<{ message: string; data: Notification }> {
    const response = await api.post<{ message: string; data: Notification }>(`/notifications/${id}/read`);
    return response.data;
  },

  async markAllAsRead(): Promise<{ message: string }> {
    const response = await api.post<{ message: string }>('/notifications/read-all');
    return response.data;
  },

  async getById(id: number): Promise<{ data: Notification }> {
    const response = await api.get<{ data: Notification }>(`/notifications/${id}`);
    return response.data;
  },

  async delete(id: number): Promise<{ message: string }> {
    const response = await api.delete<{ message: string }>(`/notifications/${id}`);
    return response.data;
  },
};

export default notificationService;

