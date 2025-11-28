import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import quizService from '../services/quizService';
import {
  QuizAttempt,
  CreateQuizAttemptDTO,
  SubmitAnswerDTO,
  GradeAnswerDTO,
  QuizAnswer,
} from '../types/quiz.types';

/**
 * Custom hook for managing quiz attempts
 */
export const useQuizAttempt = (attemptId: string | null = null) => {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startAttempt = useCallback(async (quizId: string, attemptData: CreateQuizAttemptDTO) => {
    try {
      setIsLoading(true);
      setError(null);
      const newAttempt = await quizService.startAttempt(quizId, attemptData);
      setAttempt(newAttempt);
      toast.success('Quiz attempt started');
      return newAttempt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start quiz attempt';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = async (attemptId: string, answerData: SubmitAnswerDTO) => {
    try {
      const answer = await quizService.submitAnswer(attemptId, answerData);
      // Update attempt with new answer
      if (attempt) {
        const updatedAnswers = attempt.answers || [];
        const existingIndex = updatedAnswers.findIndex(a => a.questionId === answerData.questionId);
        if (existingIndex >= 0) {
          updatedAnswers[existingIndex] = answer;
        } else {
          updatedAnswers.push(answer);
        }
        setAttempt({
          ...attempt,
          answers: updatedAnswers,
        });
      }
      return answer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit answer';
      toast.error(errorMessage);
      throw err;
    }
  };

  const submitAttempt = async (attemptId: string) => {
    try {
      setIsLoading(true);
      const completedAttempt = await quizService.submitAttempt(attemptId);
      setAttempt(completedAttempt);
      toast.success('Quiz submitted successfully');
      return completedAttempt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit quiz';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const gradeAnswer = async (answerId: string, gradeData: GradeAnswerDTO) => {
    try {
      const gradedAnswer = await quizService.gradeAnswer(answerId, gradeData);
      // Update attempt with graded answer
      if (attempt) {
        const updatedAnswers = attempt.answers?.map(a =>
          a.id === answerId ? gradedAnswer : a
        ) || [];
        setAttempt({
          ...attempt,
          answers: updatedAnswers,
        });
      }
      toast.success('Answer graded successfully');
      return gradedAnswer;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to grade answer';
      toast.error(errorMessage);
      throw err;
    }
  };


  return {
    attempt,
    isLoading,
    error,
    startAttempt,
    submitAnswer,
    submitAttempt,
    gradeAnswer,
    setAttempt,
  };
};
