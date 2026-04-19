import api from '@/core/lib/api';
import {
  mapQuizAttemptDtoToQuizAttempt,
  mapQuizDtoToQuiz,
} from '@/modules/quizzes/services/quizService';
import type { QuizAttempt } from '@/modules/quizzes/types/quiz.types';
import type { QuizAttemptDTO, QuizDTO, SubmitAnswerDTO } from '@/modules/quizzes/types/quiz.types';
import type {
  HealthScreeningListItem,
  HealthScreeningDetailView,
  StartHealthScreeningResponse,
} from '../types/healthScreening.types';

const base = '/health-screenings';

const healthScreeningService = {
  start: async (body: { quizId?: string; workPermitWorkerId?: string }): Promise<StartHealthScreeningResponse> => {
    const res = await api.post(`${base}/start`, body);
    return res.data as StartHealthScreeningResponse;
  },

  list: async (params: { page?: number; limit?: number }) => {
    const q = new URLSearchParams({
      page: String(params.page ?? 1),
      limit: String(params.limit ?? 10),
    });
    const res = await api.get(`${base}?${q.toString()}`);
    return res.data as {
      data: HealthScreeningListItem[];
      meta: { total: number; page: number; limit: number; pageCount: number };
    };
  },

  getById: async (id: string): Promise<HealthScreeningDetailView> => {
    const res = await api.get(`${base}/${id}`);
    const raw = res.data as {
      quiz: QuizDTO;
      quizAttempt: QuizAttemptDTO;
      workPermitWorker?: HealthScreeningDetailView['workPermitWorker'];
    } & HealthScreeningListItem;
    const attempt = mapQuizAttemptDtoToQuizAttempt(raw.quizAttempt);
    const quiz = mapQuizDtoToQuiz(raw.quiz);
    const mergedAttempt: QuizAttempt = {
      ...attempt,
      quiz: attempt.quiz ?? quiz,
    };
    return {
      ...raw,
      quiz,
      quizAttempt: mergedAttempt,
    };
  },

  submitAnswer: async (attemptId: string, dto: SubmitAnswerDTO) => {
    const res = await api.post(`${base}/attempts/${attemptId}/answers`, dto);
    return res.data;
  },

  submitAttempt: async (
    attemptId: string,
    body: { ackTruth: boolean; ackDiscipline: boolean },
  ): Promise<QuizAttempt> => {
    const res = await api.post(`${base}/attempts/${attemptId}/submit`, body);
    return mapQuizAttemptDtoToQuizAttempt(res.data as QuizAttemptDTO);
  },
};

export default healthScreeningService;
