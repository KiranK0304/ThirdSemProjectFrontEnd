import { api } from './client';
import {
  EmployerJobFilters,
  Job,
  JobAlert,
  JobAlertInput,
  JobFilters,
  SavedJob,
} from './types';

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

export const getSavedJobsApi = async (): Promise<SavedJob[]> => {
  const response = await api.get<SavedJob[]>('/api/jobs/saved/');
  return response.data;
};

export const saveJobApi = async (jobId: number): Promise<SavedJob> => {
  const response = await api.post<SavedJob>(`/api/jobs/${jobId}/save/`);
  return response.data;
};

export const unsaveJobApi = async (jobId: number): Promise<void> => {
  await api.delete(`/api/jobs/${jobId}/save/`);
};

export const getJobAlertsApi = async (): Promise<JobAlert[]> => {
  const response = await api.get<JobAlert[]>('/api/jobs/alerts/');
  return response.data;
};

export const createJobAlertApi = async (data: JobAlertInput): Promise<JobAlert> => {
  const response = await api.post<JobAlert>('/api/jobs/alerts/', data);
  return response.data;
};

export const updateJobAlertApi = async (
  id: number,
  data: JobAlertInput,
): Promise<JobAlert> => {
  const response = await api.patch<JobAlert>(`/api/jobs/alerts/${id}/`, data);
  return response.data;
};

export const deleteJobAlertApi = async (id: number): Promise<void> => {
  await api.delete(`/api/jobs/alerts/${id}/`);
};

export const getJobAlertMatchesApi = async (id: number): Promise<Job[]> => {
  const response = await api.get<Job[]>(`/api/jobs/alerts/${id}/matches/`);
  return response.data;
};
