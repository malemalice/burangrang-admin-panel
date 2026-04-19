import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import healthQuizService from '../services/healthQuizService';
import {
  Quiz,
  PaginatedResponse,
  QuizSearchParams,
  CreateQuizDTO,
  UpdateQuizDTO,
} from '@/modules/quizzes/types/quiz.types';

export const useHealthQuizzes = () => {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [totalQuizzes, setTotalQuizzes] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuizzes = useCallback(async (params: QuizSearchParams) => {
    setIsLoading(true);
    setError(null);
    try {
      const response: PaginatedResponse<Quiz> = await healthQuizService.getQuizzes(params);
      setQuizzes(response.data);
      setTotalQuizzes(response.meta.total);
      setCurrentPage(params.page || 1);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch health questionnaires';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createQuiz = async (quizData: CreateQuizDTO) => {
    const newQuiz = await healthQuizService.createQuiz(quizData);
    setQuizzes((prev) => [newQuiz, ...prev]);
    setTotalQuizzes((prev) => prev + 1);
    return newQuiz;
  };

  const updateQuiz = async (id: string, quizData: UpdateQuizDTO) => {
    const updatedQuiz = await healthQuizService.updateQuiz(id, quizData);
    setQuizzes((prev) => prev.map((item) => (item.id === id ? updatedQuiz : item)));
    return updatedQuiz;
  };

  const deleteQuiz = async (id: string) => {
    try {
      await healthQuizService.deleteQuiz(id);
      setQuizzes((prev) => prev.filter((item) => item.id !== id));
      setTotalQuizzes((prev) => prev - 1);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to delete questionnaire';
      toast.error(msg);
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
  };
};

export const useHealthQuiz = (id: string | null = null) => {
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuiz = useCallback(async (quizId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await healthQuizService.getQuizById(quizId);
      setQuiz(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch questionnaire';
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
