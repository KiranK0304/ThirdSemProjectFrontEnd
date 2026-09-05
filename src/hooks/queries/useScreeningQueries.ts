import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getJobCriteriaApi,
  updateJobCriteriaApi,
  getJobRankingApi,
  runJobRankingApi,
  askJobCopilotApi,
} from '../../api/screening';
import { CopilotRequest } from '../../api/types';

export const useJobCriteria = (jobId: number) => {
  return useQuery({
    queryKey: ['screening', 'criteria', jobId],
    queryFn: () => getJobCriteriaApi(jobId),
    enabled: !!jobId,
  });
};

export const useJobRanking = (jobId: number) => {
  return useQuery({
    queryKey: ['screening', 'ranking', jobId],
    queryFn: () => getJobRankingApi(jobId),
    enabled: !!jobId,
    retry: false,
  });
};

export const useRunJobRanking = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      weights,
    }: {
      jobId: number;
      weights?: Record<string, number>;
    }) => runJobRankingApi(jobId, weights),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['screening', 'ranking', variables.jobId], data);
      queryClient.invalidateQueries({ queryKey: ['screening', 'ranking', variables.jobId] });
      queryClient.invalidateQueries({ queryKey: ['screening', 'criteria', variables.jobId] });
    },
  });
};

export const useUpdateJobCriteria = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      jobId,
      weights,
    }: {
      jobId: number;
      weights: Record<string, number>;
    }) => updateJobCriteriaApi(jobId, weights),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['screening', 'criteria', variables.jobId], data);
      queryClient.invalidateQueries({ queryKey: ['screening', 'criteria', variables.jobId] });
    },
  });
};

export const useJobCopilot = () => {
  return useMutation({
    mutationFn: ({
      jobId,
      request,
    }: {
      jobId: number;
      request: CopilotRequest;
    }) => askJobCopilotApi(jobId, request),
  });
};
