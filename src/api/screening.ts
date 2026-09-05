import { api } from './client';
import { 
  CopilotRequest, 
  CopilotResponse, 
  JobCriteriaResponse, 
  JobRankingResponse 
} from './types';

export const getJobCriteriaApi = async (jobId: number): Promise<JobCriteriaResponse> => {
  const response = await api.get<JobCriteriaResponse>(`/api/screening/jobs/${jobId}/criteria/`);
  return response.data;
};

export const updateJobCriteriaApi = async (
  jobId: number,
  weights: Record<string, number>
): Promise<JobCriteriaResponse> => {
  const response = await api.put<JobCriteriaResponse>(`/api/screening/jobs/${jobId}/criteria/`, {
    weights,
  });
  return response.data;
};

export const getJobRankingApi = async (jobId: number): Promise<JobRankingResponse> => {
  const response = await api.get<JobRankingResponse>(`/api/screening/jobs/${jobId}/rank/`);
  return response.data;
};

export const runJobRankingApi = async (
  jobId: number,
  weights?: Record<string, number>
): Promise<JobRankingResponse> => {
  const payload = weights ? { weights } : {};
  const response = await api.post<JobRankingResponse>(
    `/api/screening/jobs/${jobId}/rank/`,
    payload
  );
  return response.data;
};

export const askJobCopilotApi = async (
  jobId: number,
  data: CopilotRequest
): Promise<CopilotResponse> => {
  const response = await api.post<CopilotResponse>(
    `/api/screening/jobs/${jobId}/copilot/`,
    data
  );
  return response.data;
};
