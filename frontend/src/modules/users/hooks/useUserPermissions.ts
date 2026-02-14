import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import userService from '../services/userService';
import { toast } from 'sonner';

export const useUserPermissions = (userId: string) => {
  const queryClient = useQueryClient();

  const {
    data: permissions = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ['user-permissions', userId],
    queryFn: () => userService.getUserPermissions(userId),
    enabled: !!userId,
  });

  const assignPermissionsMutation = useMutation({
    mutationFn: (permissionNames: string[]) => userService.assignPermissions(userId, permissionNames),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      toast.success('Permissions updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to update permissions');
    },
  });

  const removePermissionMutation = useMutation({
    mutationFn: (permissionName: string) => userService.removePermission(userId, permissionName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-permissions', userId] });
      toast.success('Permission removed successfully');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Failed to remove permission');
    },
  });

  return {
    permissions,
    isLoading,
    error,
    assignPermissions: assignPermissionsMutation.mutateAsync,
    removePermission: removePermissionMutation.mutateAsync,
    isUpdating: assignPermissionsMutation.isPending || removePermissionMutation.isPending,
  };
};
