import { api } from './client';
import { ChatRequest, ChatMessage } from './types';

export const getSeekerPendingRequestsApi = async (): Promise<ChatRequest[]> => {
  const response = await api.get<ChatRequest[]>('/api/messages/pending/');
  return response.data;
};

export const getSeekerApprovedConversationsApi = async (): Promise<ChatRequest[]> => {
  const response = await api.get<ChatRequest[]>('/api/messages/approved/');
  return response.data;
};

export const createChatRequestApi = async (data: { employer_id: number; initial_message?: string }): Promise<ChatRequest> => {
  const response = await api.post<ChatRequest>('/api/messages/requests/', data);
  return response.data;
};

export const getEmployerRequestsApi = async (status?: string): Promise<ChatRequest[]> => {
  const response = await api.get<ChatRequest[]>('/api/messages/employer/requests/', {
    params: status ? { status } : undefined,
  });
  return response.data;
};

export const getEmployerApprovedConversationsApi = async (): Promise<ChatRequest[]> => {
  const response = await api.get<ChatRequest[]>('/api/messages/employer/conversations/');
  return response.data;
};

export const updateChatRequestStatusApi = async (id: number, status: 'APPROVED' | 'REJECTED'): Promise<ChatRequest> => {
  const response = await api.patch<ChatRequest>(`/api/messages/employer/requests/${id}/status/`, { status });
  return response.data;
};

export const getConversationMessagesApi = async (chatRequestId: number): Promise<ChatMessage[]> => {
  const response = await api.get<ChatMessage[]>(`/api/messages/conversations/${chatRequestId}/messages/`);
  return response.data;
};

export const sendMessageApi = async (chatRequestId: number, content: string): Promise<ChatMessage> => {
  const response = await api.post<ChatMessage>(`/api/messages/conversations/${chatRequestId}/messages/`, { content });
  return response.data;
};

export const markConversationAsReadApi = async (chatRequestId: number): Promise<{ detail: string }> => {
  const response = await api.post<{ detail: string }>(`/api/messages/conversations/${chatRequestId}/read/`);
  return response.data;
};
