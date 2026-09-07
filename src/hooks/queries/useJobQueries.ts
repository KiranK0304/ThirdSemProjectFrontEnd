import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getJobsApi, getJobApi, getEmployerJobsApi, getEmployerJobApi, 
  createJobApi, updateJobApi, deleteJobApi, getSavedJobsApi, saveJobApi,
  unsaveJobApi,
  getRecommendedJobsApi, getBookmarksApi, bookmarkJobApi, unbookmarkJobApi,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs'] });
      queryClient.invalidateQueries({ queryKey: ['employer', 'jobs', variables.id] });
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

export const useRecommendedJobs = () => {
  return useQuery({
    queryKey: ['recommended-jobs'],
    queryFn: getRecommendedJobsApi,
  });
};

export const useBookmarks = (enabled = true) => {
  return useQuery({
    queryKey: ['bookmarks'],
    queryFn: getBookmarksApi,
    enabled,
  });
};

export const useBookmarkJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookmarkJobApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] });
    },
  });
};

export const useUnbookmarkJob = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: unbookmarkJobApi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['bookmarks'] });
      queryClient.invalidateQueries({ queryKey: ['recommended-jobs'] });
    },
  });
};
