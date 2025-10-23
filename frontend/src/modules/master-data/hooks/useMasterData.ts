import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import officeService from '../services/officeService';
import departmentService from '../services/departmentService';
import jobPositionService from '../services/jobPositionService';
import masterApprovalService from '../services/masterApprovalService';
import { 
  Office,
  Department,
  JobPosition,
  MasterApproval,
  PaginatedResponse,
  OfficeSearchParams,
  DepartmentSearchParams,
  JobPositionSearchParams,
  MasterApprovalSearchParams,
  CreateOfficeDTO,
  UpdateOfficeDTO,
  CreateDepartmentDTO,
  UpdateDepartmentDTO,
  CreateJobPositionDTO,
  UpdateJobPositionDTO,
  CreateMasterApprovalDTO,
  UpdateMasterApprovalDTO,
  MasterDataStats
} from '../types/master-data.types';

/**
 * Custom hook for managing offices
 */
export const useOffices = () => {
  const [offices, setOffices] = useState<Office[]>([]);
  const [totalOffices, setTotalOffices] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch offices with pagination and filters
  const fetchOffices = async (params: OfficeSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Office> = await officeService.getOffices(params);
      setOffices(response.data);
      setTotalOffices(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch offices';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new office
  const createOffice = async (officeData: CreateOfficeDTO) => {
    try {
      const newOffice = await officeService.createOffice(officeData);
      setOffices(prev => [newOffice, ...prev]);
      setTotalOffices(prev => prev + 1);
      toast.success('Office created successfully');
      return newOffice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create office';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing office
  const updateOffice = async (id: string, officeData: UpdateOfficeDTO) => {
    try {
      const updatedOffice = await officeService.updateOffice(id, officeData);
      setOffices(prev => prev.map(office => office.id === id ? updatedOffice : office));
      toast.success('Office updated successfully');
      return updatedOffice;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update office';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete an office
  const deleteOffice = async (id: string) => {
    try {
      await officeService.deleteOffice(id);
      setOffices(prev => prev.filter(office => office.id !== id));
      setTotalOffices(prev => prev - 1);
      toast.success('Office deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete office';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    offices,
    totalOffices,
    currentPage,
    isLoading,
    error,
    fetchOffices,
    createOffice,
    updateOffice,
    deleteOffice,
  };
};

/**
 * Custom hook for managing departments
 */
export const useDepartments = () => {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [totalDepartments, setTotalDepartments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch departments with pagination and filters
  const fetchDepartments = async (params: DepartmentSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Department> = await departmentService.getDepartments(params);
      setDepartments(response.data);
      setTotalDepartments(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch departments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new department
  const createDepartment = async (departmentData: CreateDepartmentDTO) => {
    try {
      const newDepartment = await departmentService.createDepartment(departmentData);
      setDepartments(prev => [newDepartment, ...prev]);
      setTotalDepartments(prev => prev + 1);
      toast.success('Department created successfully');
      return newDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create department';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing department
  const updateDepartment = async (id: string, departmentData: UpdateDepartmentDTO) => {
    try {
      const updatedDepartment = await departmentService.updateDepartment(id, departmentData);
      setDepartments(prev => prev.map(dept => dept.id === id ? updatedDepartment : dept));
      toast.success('Department updated successfully');
      return updatedDepartment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update department';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a department
  const deleteDepartment = async (id: string) => {
    try {
      await departmentService.deleteDepartment(id);
      setDepartments(prev => prev.filter(dept => dept.id !== id));
      setTotalDepartments(prev => prev - 1);
      toast.success('Department deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete department';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    departments,
    totalDepartments,
    currentPage,
    isLoading,
    error,
    fetchDepartments,
    createDepartment,
    updateDepartment,
    deleteDepartment,
  };
};

/**
 * Custom hook for managing job positions
 */
export const useJobPositions = () => {
  const [jobPositions, setJobPositions] = useState<JobPosition[]>([]);
  const [totalJobPositions, setTotalJobPositions] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch job positions with pagination and filters
  const fetchJobPositions = async (params: JobPositionSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<JobPosition> = await jobPositionService.getAll(params);
      setJobPositions(response.data);
      setTotalJobPositions(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch job positions';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new job position
  const createJobPosition = async (jobPositionData: CreateJobPositionDTO) => {
    try {
      const newJobPosition = await jobPositionService.create(jobPositionData);
      setJobPositions(prev => [newJobPosition, ...prev]);
      setTotalJobPositions(prev => prev + 1);
      toast.success('Job position created successfully');
      return newJobPosition;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create job position';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing job position
  const updateJobPosition = async (id: string, jobPositionData: UpdateJobPositionDTO) => {
    try {
      const updatedJobPosition = await jobPositionService.update(id, jobPositionData);
      setJobPositions(prev => prev.map(pos => pos.id === id ? updatedJobPosition : pos));
      toast.success('Job position updated successfully');
      return updatedJobPosition;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update job position';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a job position
  const deleteJobPosition = async (id: string) => {
    try {
      await jobPositionService.delete(id);
      setJobPositions(prev => prev.filter(pos => pos.id !== id));
      setTotalJobPositions(prev => prev - 1);
      toast.success('Job position deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete job position';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    jobPositions,
    totalJobPositions,
    currentPage,
    isLoading,
    error,
    fetchJobPositions,
    createJobPosition,
    updateJobPosition,
    deleteJobPosition,
  };
};

/**
 * Custom hook for managing master approvals
 */
export const useMasterApprovals = () => {
  const [masterApprovals, setMasterApprovals] = useState<MasterApproval[]>([]);
  const [totalMasterApprovals, setTotalMasterApprovals] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch master approvals with pagination and filters
  const fetchMasterApprovals = async (params: MasterApprovalSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<MasterApproval> = await masterApprovalService.getAll(params);
      setMasterApprovals(response.data);
      setTotalMasterApprovals(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch master approvals';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new master approval
  const createMasterApproval = async (masterApprovalData: CreateMasterApprovalDTO) => {
    try {
      const newMasterApproval = await masterApprovalService.create(masterApprovalData);
      setMasterApprovals(prev => [newMasterApproval, ...prev]);
      setTotalMasterApprovals(prev => prev + 1);
      toast.success('Master approval created successfully');
      return newMasterApproval;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create master approval';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing master approval
  const updateMasterApproval = async (id: string, masterApprovalData: UpdateMasterApprovalDTO) => {
    try {
      const updatedMasterApproval = await masterApprovalService.update(id, masterApprovalData);
      setMasterApprovals(prev => prev.map(approval => approval.id === id ? updatedMasterApproval : approval));
      toast.success('Master approval updated successfully');
      return updatedMasterApproval;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update master approval';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a master approval
  const deleteMasterApproval = async (id: string) => {
    try {
      await masterApprovalService.delete(id);
      setMasterApprovals(prev => prev.filter(approval => approval.id !== id));
      setTotalMasterApprovals(prev => prev - 1);
      toast.success('Master approval deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete master approval';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    masterApprovals,
    totalMasterApprovals,
    currentPage,
    isLoading,
    error,
    fetchMasterApprovals,
    createMasterApproval,
    updateMasterApproval,
    deleteMasterApproval,
  };
};

/**
 * Custom hook for master data statistics
 */
export const useMasterDataStats = () => {
  const [stats, setStats] = useState<MasterDataStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This would need to be implemented in the services
      // const masterDataStats = await masterDataService.getStats();
      // setStats(masterDataStats);
      
      // For now, return mock data structure
      const mockStats: MasterDataStats = {
        offices: {
          total: 0,
          active: 0,
          inactive: 0,
          withChildren: 0,
          withUsers: 0,
        },
        departments: {
          total: 0,
          active: 0,
          inactive: 0,
        },
        jobPositions: {
          total: 0,
          active: 0,
          inactive: 0,
          byLevel: [],
        },
        masterApprovals: {
          total: 0,
          active: 0,
          inactive: 0,
          byEntity: [],
        },
      };
      setStats(mockStats);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch master data statistics';
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
