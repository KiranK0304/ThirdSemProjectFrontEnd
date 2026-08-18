import { api } from './client';
import { Job, JobFilters, EmployerJobFilters } from './types';

export const getJobsApi = async (filters?: JobFilters): Promise<Job[]> => {
  const response = await api.get<Job[]>('/api/jobs/', { params: filters });
  return response.data;
};

export const getJobApi = async (id: number): Promise<Job> => {
  const response = await api.get<Job>(`/api/jobs/${id}/`);
  return response.data;
};

export const getEmployerJobsApi = async (filters?: EmployerJobFilters): Promise<Job[]> => {
  const response = await api.get<Job[]>('/api/jobs/manage/', { params: filters });
  return response.data;
};

export const getEmployerJobApi = async (id: number): Promise<Job> => {
  const response = await api.get<Job>(`/api/jobs/manage/${id}/`);
  return response.data;
};

export const createJobApi = async (data: Partial<Job>): Promise<Job> => {
  const response = await api.post<Job>('/api/jobs/manage/', data);
  return response.data;
};

export const updateJobApi = async (id: number, data: Partial<Job>): Promise<Job> => {
  const response = await api.patch<Job>(`/api/jobs/manage/${id}/`, data);
  return response.data;
};

export const deleteJobApi = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/jobs/manage/${id}/`);
  return response.data;
};
