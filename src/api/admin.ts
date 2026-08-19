import { api } from './client';

export interface AdminEmployer {
  id: number
  user: number
  user_email: string
  user_name: string
  company_name: string
  website: string
  description: string
  verification_status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  updated_at: string
}

export const getAdminEmployersApi = async (status?: string): Promise<AdminEmployer[]> => {
  const params = status ? { status } : {};
  const response = await api.get<AdminEmployer[]>('/api/auth/admin/employers/', { params });
  return response.data;
};

export const approveEmployerApi = async (id: number): Promise<AdminEmployer> => {
  const response = await api.patch<AdminEmployer>(`/api/auth/admin/employers/${id}/approve/`);
  return response.data;
};

export const rejectEmployerApi = async (id: number): Promise<AdminEmployer> => {
  const response = await api.patch<AdminEmployer>(`/api/auth/admin/employers/${id}/reject/`);
  return response.data;
};
