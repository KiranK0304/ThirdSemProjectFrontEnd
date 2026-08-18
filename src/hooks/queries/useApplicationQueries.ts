import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  applyToJobApi, getSeekerApplicationsApi, getSeekerApplicationApi, 
  withdrawApplicationApi, getJobApplicantsApi, getEmployerApplicationsApi, 
  updateApplicationStatusApi 
} from '../../api/applications';

export const useSeekerApplications = () => {
  return useQuery({
    queryKey: ['seeker', 'applications'],
    queryFn: () => getSeekerApplicationsApi(),
  });
};

export const useSeekerApplication = (id: number) => {
  return useQuery({
    queryKey: ['seeker', 'applications', id],
    queryFn: () => getSeekerApplicationApi(id),
    enabled: !!id,
  });
};

export const useApplyToJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ jobId, data }: { jobId: number; data: { cover_letter?: string; resume_id?: number } }) => applyToJobApi(jobId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeker', 'applications'] });
    },
  });
};

export const useWithdrawApplication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => withdrawApplicationApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeker', 'applications'] });
    },
  });
};

export const useEmployerJobApplicants = (jobId: number) => {
  return useQuery({
    queryKey: ['employer', 'jobs', jobId, 'applicants'],
    queryFn: () => getJobApplicantsApi(jobId),
    enabled: !!jobId,
  });
};

export const useEmployerApplications = () => {
  return useQuery({
    queryKey: ['employer', 'applications'],
    queryFn: () => getEmployerApplicationsApi(),
  });
};

export const useUpdateApplicationStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) => updateApplicationStatusApi(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer'] });
    },
  });
};
