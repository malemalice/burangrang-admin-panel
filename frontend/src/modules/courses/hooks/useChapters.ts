import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import chapterService from '../services/chapterService';
import { 
  Chapter, 
  PaginatedResponse, 
  ChapterSearchParams,
  CreateChapterDTO,
  UpdateChapterDTO 
} from '../types/course.types';

/**
 * Custom hook for managing chapters
 */
export const useChapters = () => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [totalChapters, setTotalChapters] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch chapters with pagination and filters
  const fetchChapters = async (params: ChapterSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Chapter> = await chapterService.getChapters(params);
      setChapters(response.data);
      setTotalChapters(response.meta.total);
      setCurrentPage(params.page);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Create a new chapter
  const createChapter = async (chapterData: CreateChapterDTO) => {
    try {
      const newChapter = await chapterService.createChapter(chapterData);
      setChapters(prev => [...prev, newChapter].sort((a, b) => a.order - b.order));
      setTotalChapters(prev => prev + 1);
      toast.success('Chapter created successfully');
      return newChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing chapter
  const updateChapter = async (id: string, chapterData: UpdateChapterDTO) => {
    try {
      const updatedChapter = await chapterService.updateChapter(id, chapterData);
      setChapters(prev => prev.map(item => item.id === id ? updatedChapter : item));
      toast.success('Chapter updated successfully');
      return updatedChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a chapter
  const deleteChapter = async (id: string) => {
    try {
      await chapterService.deleteChapter(id);
      setChapters(prev => prev.filter(item => item.id !== id));
      setTotalChapters(prev => prev - 1);
      toast.success('Chapter deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Reorder chapters
  const reorderChapters = async (courseId: string, fromOrder: number, toOrder: number) => {
    try {
      await chapterService.reorderChapters(courseId, fromOrder, toOrder);
      // Refetch chapters to get updated order
      const params: ChapterSearchParams = {
        page: 1,
        limit: 100,
        courseId,
        sortBy: 'order',
        sortOrder: 'asc'
      };
      await fetchChapters(params);
      toast.success('Chapters reordered successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder chapters';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    chapters,
    totalChapters,
    currentPage,
    isLoading,
    error,
    fetchChapters,
    createChapter,
    updateChapter,
    deleteChapter,
    reorderChapters,
  };
};

/**
 * Custom hook for managing chapters by course
 */
export const useCourseChapters = (courseId: string | null = null) => {
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChaptersByCourse = async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chapterService.getChaptersByCourse(id);
      setChapters(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch course chapters';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Add chapter to the course
  const addChapter = async (chapterData: CreateChapterDTO) => {
    try {
      const newChapter = await chapterService.createChapter(chapterData);
      setChapters(prev => [...prev, newChapter].sort((a, b) => a.order - b.order));
      toast.success('Chapter added successfully');
      return newChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update chapter in the course
  const updateChapter = async (id: string, chapterData: UpdateChapterDTO) => {
    try {
      const updatedChapter = await chapterService.updateChapter(id, chapterData);
      setChapters(prev => prev.map(item => item.id === id ? updatedChapter : item));
      toast.success('Chapter updated successfully');
      return updatedChapter;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Remove chapter from the course
  const removeChapter = async (id: string) => {
    try {
      await chapterService.deleteChapter(id);
      setChapters(prev => prev.filter(item => item.id !== id));
      toast.success('Chapter removed successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to remove chapter';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Reorder chapters in the course
  const reorderChapters = async (fromOrder: number, toOrder: number) => {
    if (!courseId) return;

    try {
      await chapterService.reorderChapters(courseId, fromOrder, toOrder);
      // Refetch chapters to get updated order
      await fetchChaptersByCourse(courseId);
      toast.success('Chapters reordered successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to reorder chapters';
      toast.error(errorMessage);
      throw err;
    }
  };

  useEffect(() => {
    if (courseId) {
      fetchChaptersByCourse(courseId);
    }
  }, [courseId]);

  return {
    chapters,
    isLoading,
    error,
    fetchChaptersByCourse,
    addChapter,
    updateChapter,
    removeChapter,
    reorderChapters,
    setChapters,
  };
};

/**
 * Custom hook for managing a single chapter
 */
export const useChapter = (id: string | null = null) => {
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchChapter = async (chapterId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await chapterService.getChapterById(chapterId);
      setChapter(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch chapter';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchChapter(id);
    }
  }, [id]);

  return {
    chapter,
    isLoading,
    error,
    fetchChapter,
    setChapter,
  };
};
