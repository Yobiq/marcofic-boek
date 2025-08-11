import { api } from './api';

export interface LoginResponse {
  token: string;
  user: {
    id: number;
    name: string;
    email: string;
    artist?: {
      id: number;
      name: string;
      bio: string;
      avatar?: string;
    };
  };
}

export const authService = {
  async login(email: string, password: string): Promise<LoginResponse> {
    const { data } = await api.post('/auth/login', { email, password });
    return data;
  },

  async logout(): Promise<void> {
    await api.post('/auth/logout');
  },

  async me(): Promise<LoginResponse['user']> {
    const { data } = await api.get('/me');
    return data;
  },

  async refreshToken(): Promise<{ token: string }> {
    const { data } = await api.post('/auth/refresh');
    return data;
  },
};
