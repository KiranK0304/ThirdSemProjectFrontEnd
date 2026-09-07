import { api } from './client';
import {
  EmployerJobFilters,
  Job,
  JobFilters,
  SavedJob,
  RecommendedJob,
  JobBookmark,
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

export const getRecommendedJobsApi = async (): Promise<RecommendedJob[]> => {
  const response = await api.get<RecommendedJob[]>('/api/jobs/recommendations/');
  return response.data;
};

export const getBookmarksApi = async (): Promise<JobBookmark[]> => {
  const response = await api.get<JobBookmark[]>('/api/jobs/bookmarks/');
  return response.data;
};

export const bookmarkJobApi = async (jobId: number): Promise<JobBookmark> => {
  const response = await api.post<JobBookmark>(`/api/jobs/${jobId}/bookmark/`);
  return response.data;
};

export const unbookmarkJobApi = async (jobId: number): Promise<void> => {
  await api.delete(`/api/jobs/${jobId}/bookmark/`);
};
