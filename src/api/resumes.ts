import { api } from './client';
import { Resume } from './types';

export const getResumesApi = async (): Promise<Resume[]> => {
  const response = await api.get<Resume[]>('/api/auth/seeker/resumes/');
  return response.data;
};

export const uploadResumeApi = async (file: File, title?: string): Promise<Resume> => {
  const formData = new FormData();
  formData.append('file', file);
  if (title) {
    formData.append('title', title);
  }
  const response = await api.post<Resume>('/api/auth/seeker/resumes/', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteResumeApi = async (id: number): Promise<void> => {
  const response = await api.delete(`/api/auth/seeker/resumes/${id}/`);
  return response.data;
};
