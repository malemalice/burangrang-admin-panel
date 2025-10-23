import { useState, useEffect } from 'react';
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

  // Fetch users with pagination and filters
  const fetchUsers = async (params: UserSearchParams) => {
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
  };

  // Create a new user
  const createUser = async (userData: CreateUserDTO) => {
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
  };

  // Update an existing user
  const updateUser = async (id: string, userData: UpdateUserDTO) => {
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
  };

  // Delete a user
  const deleteUser = async (id: string) => {
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
  };

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

  // Fetch a single user by ID
  const fetchUser = async (id: string) => {
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
  };

  // Load user on mount if userId is provided
  useEffect(() => {
    if (userId) {
      fetchUser(userId);
    }
  }, [userId]);

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

  const fetchStats = async () => {
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
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
