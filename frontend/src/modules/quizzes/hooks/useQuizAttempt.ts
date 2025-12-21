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
      // Toast handled by caller if needed
      return newAttempt;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start quiz attempt';
      setError(errorMessage);
      // Don't show toast here - let caller handle error display
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const submitAnswer = async (attemptId: string, answerData: SubmitAnswerDTO) => {
    try {
      // Ensure essayAnswer is always a string (even if empty) for essay questions
      const normalizedAnswerData = { ...answerData };
      if (answerData.essayAnswer !== undefined) {
        normalizedAnswerData.essayAnswer = answerData.essayAnswer || '';
      }

      const answer = await quizService.submitAnswer(attemptId, normalizedAnswerData);
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
    } catch (err: any) {
      // Parse error message for better user experience
      let errorMessage = 'Failed to submit answer';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check for specific error patterns
        if (err.message.includes('Maximum attempts')) {
          errorMessage = 'You have reached the maximum number of attempts for this quiz.';
        } else if (err.message.includes('essayAnswer')) {
          errorMessage = 'Please provide an answer for this essay question (you can leave it empty if needed).';
        }
      }
      // Only show error toast if it's not a duplicate (check if error was already shown)
      const errorShown = sessionStorage.getItem(`error_shown_${attemptId}_${answerData.questionId}`);
      if (!errorShown) {
        toast.error(errorMessage);
        sessionStorage.setItem(`error_shown_${attemptId}_${answerData.questionId}`, 'true');
        setTimeout(() => {
          sessionStorage.removeItem(`error_shown_${attemptId}_${answerData.questionId}`);
        }, 3000);
      }
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
    } catch (err: any) {
      // Parse error message for better user experience
      let errorMessage = 'Failed to submit quiz';
      if (err instanceof Error) {
        errorMessage = err.message;
        // Check for specific error patterns
        if (err.message.includes('Maximum attempts') || err.message.includes('maximum number of attempts')) {
          errorMessage = 'You have reached the maximum number of attempts for this quiz.';
        }
      }
      setError(errorMessage);
      // Only show error toast once
      const errorShown = sessionStorage.getItem(`error_shown_submit_${attemptId}`);
      if (!errorShown) {
        toast.error(errorMessage);
        sessionStorage.setItem(`error_shown_submit_${attemptId}`, 'true');
        setTimeout(() => {
          sessionStorage.removeItem(`error_shown_submit_${attemptId}`);
        }, 3000);
      }
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
