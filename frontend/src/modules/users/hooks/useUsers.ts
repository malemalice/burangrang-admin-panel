import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import userService from '../services/userService';
import { 
  User, 
  PaginatedResponse, 
  UserSearchParams,
  CreateUserDTO,
  UpdateUserDTO,
  UserStats 
} from '../types/user.types';

/**
 * Custom hook for managing users
 */
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [totalUsers, setTotalUsers] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetchUsers function to prevent infinite loops
  const fetchUsers = useCallback(async (params: UserSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<User> = await userService.getUsers(params);
      setUsers(response.data);
      setTotalUsers(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch users';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []); // Empty dependency array - function is stable

  // ✅ CRITICAL: Memoize CRUD operations to prevent unnecessary re-renders
  const createUser = useCallback(async (userData: CreateUserDTO) => {
    try {
      const newUser = await userService.createUser(userData);
      setUsers(prev => [newUser, ...prev]);
      setTotalUsers(prev => prev + 1);
      toast.success('User created successfully');
      return newUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create user';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const updateUser = useCallback(async (id: string, userData: UpdateUserDTO) => {
    try {
      const updatedUser = await userService.updateUser(id, userData);
      setUsers(prev => prev.map(user => user.id === id ? updatedUser : user));
      toast.success('User updated successfully');
      return updatedUser;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const deleteUser = useCallback(async (id: string) => {
    try {
      await userService.deleteUser(id);
      setUsers(prev => prev.filter(user => user.id !== id));
      setTotalUsers(prev => prev - 1);
      toast.success('User deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  return {
    users,
    totalUsers,
    currentPage,
    isLoading,
    error,
    fetchUsers,
    createUser,
    updateUser,
    deleteUser,
  };
};

/**
 * Custom hook for managing a single user
 */
export const useUser = (userId: string | null = null) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetchUser function to prevent infinite loops
  const fetchUser = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const userData = await userService.getUserById(id);
      setUser(userData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CRITICAL: Include memoized function in dependency array
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId, fetchUser]);

  return {
    user,
    isLoading,
    error,
    fetchUser,
    setUser,
  };
};

/**
 * Custom hook for user statistics
 */
export const useUserStats = () => {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ CRITICAL: Memoize fetchStats function to prevent infinite loops
  const fetchStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the userService
      // const userStats = await userService.getUserStats();
      // setStats(userStats);
      
      // For now, return mock data structure
      const mockStats: UserStats = {
        total: 0,
        active: 0,
        inactive: 0,
        byRole: [],
        byOffice: [],
        recentLogins: 0,
        newThisMonth: 0,
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // ✅ CRITICAL: Include memoized function in dependency array
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
