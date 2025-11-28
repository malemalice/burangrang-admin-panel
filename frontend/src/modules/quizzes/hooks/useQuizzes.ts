import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import quizService from '../services/quizService';
import {
  Quiz,
  PaginatedResponse,
  QuizSearchParams,
  CreateQuizDTO,
  UpdateQuizDTO,
  AssignQuizDTO,
} from '../types/quiz.types';

/**
 * Custom hook for managing quizzes
 */
export const useQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch quizzes with pagination and filters
  const fetchQuizzes = useCallback(async (params: QuizSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Quiz> = await quizService.getQuizzes(params);
      setQuizzes(response.data);
      setTotalQuizzes(response.meta.total);
      setCurrentPage(params.page || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quizzes';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new quiz
  const createQuiz = async (quizData: CreateQuizDTO) => {
    try {
      const newQuiz = await quizService.createQuiz(quizData);
      setQuizzes(prev => [newQuiz, ...prev]);
      setTotalQuizzes(prev => prev + 1);
      toast.success('Quiz created successfully');
      return newQuiz;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create quiz';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Update an existing quiz
  const updateQuiz = async (id: string, quizData: UpdateQuizDTO) => {
    try {
      const updatedQuiz = await quizService.updateQuiz(id, quizData);
      setQuizzes(prev => prev.map(item => item.id === id ? updatedQuiz : item));
      toast.success('Quiz updated successfully');
      return updatedQuiz;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update quiz';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Delete a quiz
  const deleteQuiz = async (id: string) => {
    try {
      await quizService.deleteQuiz(id);
      setQuizzes(prev => prev.filter(item => item.id !== id));
      setTotalQuizzes(prev => prev - 1);
      toast.success('Quiz deleted successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete quiz';
      toast.error(errorMessage);
      throw err;
    }
  };

  // Assign quiz to users
  const assignQuiz = async (quizId: string, assignData: AssignQuizDTO) => {
    try {
      await quizService.assignQuiz(quizId, assignData);
      toast.success('Quiz assigned successfully');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign quiz';
      toast.error(errorMessage);
      throw err;
    }
  };

  return {
    quizzes,
    totalQuizzes,
    currentPage,
    isLoading,
    error,
    fetchQuizzes,
    createQuiz,
    updateQuiz,
    deleteQuiz,
    assignQuiz,
  };
};

/**
 * Custom hook for managing a single quiz
 */
export const useQuiz = (id: string | null = null) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async (quizId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await quizService.getQuizById(quizId);
      setQuiz(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch quiz';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id, fetchQuiz]);

  return {
    quiz,
    isLoading,
    error,
    fetchQuiz,
    setQuiz,
  };
};
