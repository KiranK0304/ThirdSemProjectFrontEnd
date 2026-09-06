import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobCopilotSessionsApi, 
  createJobCopilotSessionApi, 
  getSessionMessagesApi, 
  sendSessionMessageApi 
} from '../../api/copilot';

export const useJobCopilotSessions = (jobId: number) => {
  return useQuery({
    queryKey: ['copilot', 'sessions', jobId],
    queryFn: () => getJobCopilotSessionsApi(jobId),
    enabled: !!jobId,
  });
};

export const useCreateCopilotSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, title }: { jobId: number; title?: string }) => 
      createJobCopilotSessionApi(jobId, title),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['copilot', 'sessions', variables.jobId] });
    },
  });
};

export const useSessionMessages = (sessionId: number | null) => {
  return useQuery({
    queryKey: ['copilot', 'messages', sessionId],
    queryFn: () => getSessionMessagesApi(sessionId!),
    enabled: !!sessionId,
  });
};

export const useSendCopilotMessage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ sessionId, message }: { sessionId: number; message: string }) =>
      sendSessionMessageApi(sessionId, message),
    onSuccess: (data, variables) => {
      // Optimistically or immediately update message list
      queryClient.setQueryData(
        ['copilot', 'messages', variables.sessionId],
        (old: any) => {
          if (!old) return [data.user_message, data.assistant_message];
          return [...old, data.user_message, data.assistant_message];
        }
      );
      queryClient.invalidateQueries({ queryKey: ['copilot', 'messages', variables.sessionId] });
      queryClient.invalidateQueries({ queryKey: ['copilot', 'sessions'] });
    },
  });
};
