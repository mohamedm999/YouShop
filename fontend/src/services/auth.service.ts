import api from '@/lib/axios';
import { LoginDto, SignupDto, AuthResponse } from '@/types/auth'; // We'll define these types next

export const authService = {
  signup: async (data: SignupDto) => {
    const response = await api.post<AuthResponse>('/auth/signup', data);
    return response.data;
  },

  login: async (credentials: LoginDto) => {
    const response = await api.post<AuthResponse>('/auth/login', credentials);
    return response.data;
  },

  logout: async () => {
    const response = await api.post('/auth/logout');
    return response.data;
  },

  refresh: async () => {
    const response = await api.post<AuthResponse>('/auth/refresh');
    return response.data;
  }
};
