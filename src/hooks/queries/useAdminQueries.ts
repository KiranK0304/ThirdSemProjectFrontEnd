import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getAdminEmployersApi, approveEmployerApi, rejectEmployerApi } from '../../api/admin';

export const useAdminEmployers = (status?: string) => {
  return useQuery({
    queryKey: ['admin', 'employers', status],
    queryFn: () => getAdminEmployersApi(status),
  });
};

export const useApproveEmployer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => approveEmployerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employers'] });
    },
  });
};

export const useRejectEmployer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => rejectEmployerApi(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'employers'] });
    },
  });
};
