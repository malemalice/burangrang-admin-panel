import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import roleService from '../services/roleService';
import { 
  Role, 
  Permission,
  PaginatedResponse, 
  RoleSearchParams,
  CreateRoleDTO,
  UpdateRoleDTO,
  RoleStats 
} from '../types/role.types';

/**
 * Custom hook for managing roles
 */
export const useRoles = () => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [totalRoles, setTotalRoles] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch roles with pagination and filters
  const fetchRoles = async (params: RoleSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Role> = await roleService.getRoles(params);
      setRoles(response.data);
      setTotalRoles(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch roles';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new role
  const createRole = async (roleData: CreateRoleDTO) => {
    try {
      const newRole = await roleService.createRole(roleData);
      setRoles(prev => [newRole, ...prev]);
      setTotalRoles(prev => prev + 1);
      toast.success('Role created successfully');
      return newRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create role';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing role
  const updateRole = async (id: string, roleData: UpdateRoleDTO) => {
    try {
      const updatedRole = await roleService.updateRole(id, roleData);
      setRoles(prev => prev.map(role => role.id === id ? updatedRole : role));
      toast.success('Role updated successfully');
      return updatedRole;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update role';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a role
  const deleteRole = async (id: string) => {
    try {
      await roleService.deleteRole(id);
      setRoles(prev => prev.filter(role => role.id !== id));
      setTotalRoles(prev => prev - 1);
      toast.success('Role deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete role';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    roles,
    totalRoles,
    currentPage,
    isLoading,
    error,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};

/**
 * Custom hook for managing a single role
 */
export const useRole = (roleId: string | null = null) => {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single role by ID
  const fetchRole = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const roleData = await roleService.getRoleById(id);
      setRole(roleData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch role';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load role on mount if roleId is provided
  useEffect(() => {
    if (roleId) {
      fetchRole(roleId);
    }
  }, [roleId]);

  return {
    role,
    isLoading,
    error,
    fetchRole,
    setRole,
  };
};

/**
 * Custom hook for managing permissions
 */
export const usePermissions = () => {
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all permissions
  const fetchPermissions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const permissionData = await roleService.getPermissions();
      setPermissions(permissionData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch permissions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load permissions on mount
  useEffect(() => {
    fetchPermissions();
  }, []);

  return {
    permissions,
    isLoading,
    error,
    fetchPermissions,
  };
};

/**
 * Custom hook for role statistics
 */
export const useRoleStats = () => {
  const [stats, setStats] = useState<RoleStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the roleService
      // const roleStats = await roleService.getRoleStats();
      // setStats(roleStats);
      
      // For now, return mock data structure
      const mockStats: RoleStats = {
        total: 0,
        active: 0,
        inactive: 0,
        byPermissionCount: [],
        mostUsedPermissions: [],
        recentlyCreated: 0,
        usersWithRoles: 0,
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch role statistics';
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
