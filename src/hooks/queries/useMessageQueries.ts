import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSeekerPendingRequestsApi,
  getSeekerApprovedConversationsApi,
  createChatRequestApi,
  getEmployerRequestsApi,
  getEmployerApprovedConversationsApi,
  updateChatRequestStatusApi,
  getConversationMessagesApi,
  sendMessageApi,
  markConversationAsReadApi,
} from '../../api/messages';

export const useSeekerPendingRequests = () => {
  return useQuery({
    queryKey: ['messages', 'seeker', 'pending'],
    queryFn: () => getSeekerPendingRequestsApi(),
  });
};

export const useSeekerApprovedConversations = () => {
  return useQuery({
    queryKey: ['messages', 'seeker', 'approved'],
    queryFn: () => getSeekerApprovedConversationsApi(),
  });
};

export const useCreateChatRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { employer_id: number; initial_message?: string }) =>
      createChatRequestApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useEmployerRequests = (status?: string) => {
  return useQuery({
    queryKey: ['messages', 'employer', 'requests', status],
    queryFn: () => getEmployerRequestsApi(status),
  });
};

export const useEmployerApprovedConversations = () => {
  return useQuery({
    queryKey: ['messages', 'employer', 'approved'],
    queryFn: () => getEmployerApprovedConversationsApi(),
  });
};

export const useUpdateChatRequestStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: 'APPROVED' | 'REJECTED' }) =>
      updateChatRequestStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useConversationMessages = (chatRequestId: number | null) => {
  return useQuery({
    queryKey: ['messages', 'conversation', chatRequestId],
    queryFn: () => (chatRequestId ? getConversationMessagesApi(chatRequestId) : Promise.resolve([])),
    enabled: !!chatRequestId,
    refetchInterval: 3000,
  });
};

export const useSendMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ chatRequestId, content }: { chatRequestId: number; content: string }) =>
      sendMessageApi(chatRequestId, content),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', variables.chatRequestId],
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};

export const useMarkConversationAsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (chatRequestId: number) => markConversationAsReadApi(chatRequestId),
    onSuccess: (_, chatRequestId) => {
      queryClient.invalidateQueries({
        queryKey: ['messages', 'conversation', chatRequestId],
      });
      queryClient.invalidateQueries({ queryKey: ['messages'] });
    },
  });
};
