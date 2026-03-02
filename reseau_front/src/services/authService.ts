import api from '@/axios';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface User {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

export interface LoginResponse {
  status: number;
  data: {
    user: User;
    token: string;
  } | [];
  message: string[];
}

export interface AuthMeResponse {
  id: number;
  name: string;
  surname: string;
  username: string;
  email: string;
  phone: string;
  role: string;
  roles: string[];
  permissions: string[];
  is_active: boolean;
}

const authService = {
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    return response.data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<AuthMeResponse> {
    const response = await api.get<AuthMeResponse>('/auth/me');
    return response.data;
  },
};

export default authService;
