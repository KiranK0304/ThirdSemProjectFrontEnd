import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobsApi, getJobApi, getEmployerJobsApi, getEmployerJobApi, 
  createJobApi, updateJobApi, deleteJobApi, getSavedJobsApi, saveJobApi,
  unsaveJobApi, getJobAlertsApi, createJobAlertApi, updateJobAlertApi,
  deleteJobAlertApi, getJobAlertMatchesApi,
} from '../../api/jobs';
import { JobAlertInput, JobFilters, EmployerJobFilters, Job } from '../../api/types';

export const useJobs = (filters?: JobFilters) => {
  return useQuery({
    queryKey: ['jobs', filters],
    queryFn: () => getJobsApi(filters),
  });
};

export const useJob = (id: number) => {
  return useQuery({
    queryKey: ['jobs', id],
    queryFn: () => getJobApi(id),
    enabled: !!id,
  });
};

export const useEmployerJobs = (filters?: EmployerJobFilters) => {
  return useQuery({
    queryKey: ['employer', 'jobs', filters],
    queryFn: () => getEmployerJobsApi(filters),
  });
};

export const useEmployerJob = (id: number) => {
  return useQuery({
    queryKey: ['employer', 'jobs', id],
    queryFn: () => getEmployerJobApi(id),
    enabled: !!id,
  });
};

export const useCreateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Job>) => createJobApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
    },
  });
};

export const useUpdateJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Job> }) => updateJobApi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
    },
  });
};

export const useDeleteJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteJobApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
    },
  });
};

export const useSavedJobs = (enabled = true) => {
  return useQuery({
    queryKey: ['saved-jobs'],
    queryFn: getSavedJobsApi,
    enabled,
  });
};

export const useSaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: saveJobApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
};

export const useUnsaveJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unsaveJobApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-jobs'] });
    },
  });
};

export const useJobAlerts = () => {
  return useQuery({
    queryKey: ['job-alerts'],
    queryFn: getJobAlertsApi,
  });
};

export const useCreateJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: JobAlertInput) => createJobAlertApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-alerts'] });
    },
  });
};

export const useUpdateJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: JobAlertInput }) => updateJobAlertApi(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['job-alerts'] });
      queryClient.invalidateQueries({ queryKey: ['job-alerts', variables.id, 'matches'] });
    },
  });
};

export const useDeleteJobAlert = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteJobAlertApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job-alerts'] });
    },
  });
};

export const useJobAlertMatches = (id: number, enabled = true) => {
  return useQuery({
    queryKey: ['job-alerts', id, 'matches'],
    queryFn: () => getJobAlertMatchesApi(id),
    enabled,
  });
};
