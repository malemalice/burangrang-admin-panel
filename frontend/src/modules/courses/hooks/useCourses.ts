import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import courseService from '../services/courseService';
import { 
  Course, 
  PaginatedResponse, 
  CourseSearchParams,
  CreateCourseDTO,
  UpdateCourseDTO,
  CourseStats 
} from '../types/course.types';

/**
 * Custom hook for managing courses
 */
export const useCourses = () => {
  const [courses, setCourses] = useState<Course[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch courses with pagination and filters
  const fetchCourses = async (params: CourseSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Course> = await courseService.getCourses(params);
      setCourses(response.data);
      setTotalCourses(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch courses';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new course
  const createCourse = async (courseData: CreateCourseDTO) => {
    try {
      const newCourse = await courseService.createCourse(courseData);
      setCourses(prev => [newCourse, ...prev]);
      setTotalCourses(prev => prev + 1);
      toast.success('Course created successfully');
      return newCourse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create course';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing course
  const updateCourse = async (id: string, courseData: UpdateCourseDTO) => {
    try {
      const updatedCourse = await courseService.updateCourse(id, courseData);
      setCourses(prev => prev.map(item => item.id === id ? updatedCourse : item));
      toast.success('Course updated successfully');
      return updatedCourse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update course';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a course
  const deleteCourse = async (id: string) => {
    try {
      await courseService.deleteCourse(id);
      setCourses(prev => prev.filter(item => item.id !== id));
      setTotalCourses(prev => prev - 1);
      toast.success('Course deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete course';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    courses,
    totalCourses,
    currentPage,
    isLoading,
    error,
    fetchCourses,
    createCourse,
    updateCourse,
    deleteCourse,
  };
};

/**
 * Custom hook for managing a single course
 */
export const useCourse = (id: string | null = null) => {
  const [course, setCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCourse = async (courseId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseById(courseId);
      setCourse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchCourseBySlug = async (slug: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseBySlug(slug);
      setCourse(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchCourse(id);
    }
  }, [id]);

  return {
    course,
    isLoading,
    error,
    fetchCourse,
    fetchCourseBySlug,
    setCourse,
  };
};

/**
 * Custom hook for course statistics
 */
export const useCourseStats = () => {
  const [stats, setStats] = useState<CourseStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await courseService.getCourseStats();
      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course statistics';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    stats,
    isLoading,
    error,
    fetchStats,
  };
};
