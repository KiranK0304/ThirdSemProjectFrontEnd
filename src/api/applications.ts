import { api } from './client';
import { Application } from './types';

export const applyToJobApi = async (jobId: number, data: { cover_letter?: string; resume_id?: number }): Promise<Application> => {
  const response = await api.post<Application>(`/api/jobs/${jobId}/apply/`, data);
  return response.data;
};

export const getSeekerApplicationsApi = async (): Promise<Application[]> => {
  const response = await api.get<Application[]>('/api/seeker/applications/');
  return response.data;
};

export const getSeekerApplicationApi = async (id: number): Promise<Application> => {
  const response = await api.get<Application>(`/api/seeker/applications/${id}/`);
  return response.data;
};

export const withdrawApplicationApi = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/seeker/applications/${id}/`);
  return response.data;
};

export const getJobApplicantsApi = async (jobId: number): Promise<Application[]> => {
  const response = await api.get<Application[]>(`/api/jobs/${jobId}/applications/`);
  return response.data;
};

export const getEmployerApplicationsApi = async (): Promise<Application[]> => {
  const response = await api.get<Application[]>('/api/employer/applications/');
  return response.data;
};

export const updateApplicationStatusApi = async (id: number, status: string): Promise<Application> => {
  const response = await api.patch<Application>(`/api/employer/applications/${id}/status/`, { status });
  return response.data;
};
