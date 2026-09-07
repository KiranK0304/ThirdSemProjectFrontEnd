import axios from 'axios';
import { api } from './client';
import { LoginRequest, LoginResponse, RegisterRequest, User } from './types';

export interface RefreshResponse {
  access: string;
  refresh?: string;
}

export const loginApi = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await api.post<LoginResponse>('/api/auth/login/', data);
  return response.data;
};

export const registerApi = async (data: RegisterRequest): Promise<void> => {
  const response = await api.post('/api/auth/register/', data);
  return response.data;
};

export const logoutApi = async (refresh: string): Promise<void> => {
  const response = await api.post('/api/auth/logout/', { refresh });
  return response.data;
};

export const refreshTokenApi = async (refresh: string): Promise<RefreshResponse> => {
  const baseURL = import.meta.env.VITE_API_URL || '';
  const response = await axios.post<RefreshResponse>(`${baseURL}/api/auth/refresh/`, { refresh });
  return response.data;
};

export const getMeApi = async (): Promise<User> => {
  const response = await api.get<User>('/api/me/');
  return response.data;
};

export const updateProfileApi = async (data: Record<string, any>): Promise<User> => {
  const response = await api.patch<User>('/api/me/', data);
  return response.data;
};
