import { api } from './client';
import { 
  CopilotSession, 
  CopilotMessageItem, 
  SendMessageResponse 
} from './types';

export const getJobCopilotSessionsApi = async (jobId: number): Promise<CopilotSession[]> => {
  const response = await api.get<CopilotSession[]>(`/api/copilot/jobs/${jobId}/sessions/`);
  return response.data;
};

export const createJobCopilotSessionApi = async (
  jobId: number,
  title?: string
): Promise<CopilotSession> => {
  const payload = title ? { title } : {};
  const response = await api.post<CopilotSession>(`/api/copilot/jobs/${jobId}/sessions/`, payload);
  return response.data;
};

export const getSessionMessagesApi = async (
  sessionId: number
): Promise<CopilotMessageItem[]> => {
  const response = await api.get<CopilotMessageItem[]>(`/api/copilot/sessions/${sessionId}/messages/`);
  return response.data;
};

export const sendSessionMessageApi = async (
  sessionId: number,
  message: string
): Promise<SendMessageResponse> => {
  const response = await api.post<SendMessageResponse>(
    `/api/copilot/sessions/${sessionId}/messages/`,
    { message }
  );
  return response.data;
};
