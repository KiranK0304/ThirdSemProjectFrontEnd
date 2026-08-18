import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobsApi, getJobApi, getEmployerJobsApi, getEmployerJobApi, 
  createJobApi, updateJobApi, deleteJobApi 
} from '../../api/jobs';
import { JobFilters, EmployerJobFilters, Job } from '../../api/types';

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
