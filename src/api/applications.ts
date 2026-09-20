import { api } from './client';
import { Application, Interview, JobOffer } from './types';

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

export const updateApplicationStatusApi = async (
  id: number,
  status: string,
  rejection_note?: string,
): Promise<Application> => {
  const payload: { status: string; rejection_note?: string } = { status };
  if (rejection_note !== undefined) {
    payload.rejection_note = rejection_note;
  }
  const response = await api.patch<Application>(`/api/employer/applications/${id}/status/`, payload);
  return response.data;
};

export const getSeekerInterviewsApi = async (): Promise<Interview[]> => {
  const response = await api.get<Interview[]>('/api/seeker/interviews/');
  return response.data;
};

export const getJobOfferApi = async (applicationId: number): Promise<JobOffer> => {
  const response = await api.get<JobOffer>(`/api/employer/applications/${applicationId}/offer/`);
  return response.data;
};

export const createOrUpdateJobOfferApi = async (
  applicationId: number,
  data: Partial<JobOffer>,
): Promise<JobOffer> => {
  const response = await api.post<JobOffer>(`/api/employer/applications/${applicationId}/offer/`, data);
  return response.data;
};

export const decideJobOfferApi = async (
  applicationId: number,
  data: { decision: 'ACCEPTED' | 'DECLINED'; decline_reason?: string },
): Promise<JobOffer> => {
  const response = await api.post<JobOffer>(
    `/api/seeker/applications/${applicationId}/offer/decision/`,
    data,
  );
  return response.data;
};
