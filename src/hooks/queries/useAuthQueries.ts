import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { loginApi, registerApi, logoutApi, getMeApi, updateProfileApi } from '../../api/auth';
import { setTokens, clearTokens } from '../../api/client';
import { LoginRequest, RegisterRequest, User } from '../../api/types';

export const useMe = () => {
  return useQuery({
    queryKey: ['me'],
    queryFn: getMeApi,
    staleTime: 5 * 60 * 1000,
  });
};

export const useLogin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (data) => {
      setTokens(data.access, data.refresh);
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (refresh: string) => logoutApi(refresh),
    onSuccess: () => {
      clearTokens();
      queryClient.clear();
    },
    onError: () => {
      clearTokens();
      queryClient.clear();
    }
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Record<string, any>) => updateProfileApi(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] });
    },
  });
};
