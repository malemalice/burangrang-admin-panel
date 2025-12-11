import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import enrollmentService from '../services/enrollmentService';
import {
  Enrollment,
  PaginatedResponse,
  EnrollmentSearchParams,
  AssignEnrollmentDTO,
  UpdateEnrollmentDTO,
  CreateEnrollmentDTO,
} from '../types/enrollment.types';

/**
 * Custom hook for managing enrollments
 */
export const useEnrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [totalEnrollments, setTotalEnrollments] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch enrollments with pagination and filters
  const fetchEnrollments = async (params: EnrollmentSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Enrollment> = await enrollmentService.getEnrollments(params);
      setEnrollments(response.data);
      setTotalEnrollments(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new enrollment (self-enrollment)
  const createEnrollment = async (enrollmentData: CreateEnrollmentDTO) => {
    try {
      const newEnrollment = await enrollmentService.createEnrollment(enrollmentData);
      setEnrollments(prev => [newEnrollment, ...prev]);
      setTotalEnrollments(prev => prev + 1);
      toast.success('Enrolled in course successfully');
      return newEnrollment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to enroll in course';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Assign course to user (Admin only)
  const assignCourse = async (assignData: AssignEnrollmentDTO) => {
    try {
      const newEnrollment = await enrollmentService.assignCourse(assignData);
      setEnrollments(prev => [newEnrollment, ...prev]);
      setTotalEnrollments(prev => prev + 1);
      toast.success('Course assigned successfully');
      return newEnrollment;
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message ||
        err?.response?.data?.error ||
        (err instanceof Error ? err.message : 'Failed to assign course');
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing enrollment
  const updateEnrollment = async (id: string, updateData: UpdateEnrollmentDTO) => {
    try {
      const updatedEnrollment = await enrollmentService.updateEnrollment(id, updateData);
      setEnrollments(prev => prev.map(enrollment => enrollment.id === id ? updatedEnrollment : enrollment));
      toast.success('Enrollment updated successfully');
      return updatedEnrollment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update enrollment';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    enrollments,
    totalEnrollments,
    currentPage,
    isLoading,
    error,
    fetchEnrollments,
    createEnrollment,
    assignCourse,
    updateEnrollment,
  };
};

/**
 * Custom hook for managing a single enrollment
 */
export const useEnrollment = (enrollmentId: string | null = null) => {
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch a single enrollment by ID
  const fetchEnrollment = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const enrollmentData = await enrollmentService.getEnrollmentById(id);
      setEnrollment(enrollmentData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch enrollment';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Load enrollment on mount if enrollmentId is provided
  useEffect(() => {
    if (enrollmentId) {
      fetchEnrollment(enrollmentId);
    }
  }, [enrollmentId]);

  return {
    enrollment,
    isLoading,
    error,
    fetchEnrollment,
    setEnrollment,
  };
};

/**
 * Custom hook for current user enrollments
 */
export const useUserEnrollments = () => {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserEnrollments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userEnrollments = await enrollmentService.getUserEnrollments();
      setEnrollments(userEnrollments);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user enrollments';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserEnrollments();
  }, []);

  return {
    enrollments,
    isLoading,
    error,
    fetchUserEnrollments,
  };
};
