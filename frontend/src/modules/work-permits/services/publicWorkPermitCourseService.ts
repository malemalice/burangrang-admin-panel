import { publicApi } from '@/core/lib/api';
import type { LearningContext, UpdateProgressDTO } from '@/modules/courses/types/course.types';
import type { SubmitAnswerDTO } from '@/modules/quizzes/types/quiz.types';
import type { QuizAttempt } from '@/modules/quizzes/types/quiz.types';

const enc = (token: string) => encodeURIComponent(token);
const c = (courseId: string) => `?courseId=${encodeURIComponent(courseId)}`;

/**
 * Public work permit token (no JWT) — course / progress / quiz API.
 */
const publicWorkPermitCourseService = {
  getLearningContext: async (token: string, courseId: string): Promise<LearningContext> => {
    const res = await publicApi.get(
      `/work-permits/public/${enc(token)}/learning-context${c(courseId)}`,
    );
    return res.data;
  },

  updateProgress: async (
    token: string,
    courseId: string,
    chapterId: string,
    data: UpdateProgressDTO,
  ) => {
    const res = await publicApi.patch(
      `/work-permits/public/${enc(token)}/progress/${encodeURIComponent(chapterId)}${c(courseId)}`,
      data,
    );
    return res.data;
  },

  completeChapter: async (token: string, courseId: string, chapterId: string) => {
    const res = await publicApi.post(
      `/work-permits/public/${enc(token)}/progress/${encodeURIComponent(
        chapterId,
      )}/complete${c(courseId)}`,
    );
    return res.data;
  },

  getCurrentAttempt: async (
    token: string,
    courseId: string,
    quizId: string,
  ): Promise<QuizAttempt | null> => {
    const res = await publicApi.get(
      `/work-permits/public/${enc(token)}/quizzes/${encodeURIComponent(quizId)}/attempts/current${c(courseId)}`,
    );
    return res.data;
  },

  startAttempt: async (token: string, courseId: string, quizId: string): Promise<QuizAttempt> => {
    const res = await publicApi.post(
      `/work-permits/public/${enc(token)}/quizzes/${encodeURIComponent(quizId)}/attempts${c(courseId)}`,
    );
    return res.data;
  },

  submitAnswer: async (
    token: string,
    courseId: string,
    attemptId: string,
    data: SubmitAnswerDTO,
  ) => {
    const res = await publicApi.post(
      `/work-permits/public/${enc(token)}/quizzes/attempts/${encodeURIComponent(attemptId)}/answers${c(courseId)}`,
      data,
    );
    return res.data;
  },

  submitAttempt: async (token: string, courseId: string, attemptId: string) => {
    const res = await publicApi.post(
      `/work-permits/public/${enc(token)}/quizzes/attempts/${encodeURIComponent(attemptId)}/submit${c(courseId)}`,
    );
    return res.data;
  },
};

export default publicWorkPermitCourseService;
