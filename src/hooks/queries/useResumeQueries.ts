import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getResumesApi, uploadResumeApi, deleteResumeApi } from '../../api/resumes';

export const useResumes = () => {
  return useQuery({
    queryKey: ['seeker', 'resumes'],
    queryFn: () => getResumesApi(),
  });
};

export const useUploadResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ file, title }: { file: File; title?: string }) => uploadResumeApi(file, title),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeker', 'resumes'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useDeleteResume = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => deleteResumeApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['seeker', 'resumes'] });
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
