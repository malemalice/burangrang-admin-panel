import api from '@/core/lib/api';
import {
  Quiz,
  QuizDTO,
  CreateQuizDTO,
  UpdateQuizDTO,
  QuizSearchParams,
  PaginatedResponse,
} from '@/modules/quizzes/types/quiz.types';
import { mapQuizDtoToQuiz } from '@/modules/quizzes/services/quizService';

const base = '/health-quizzes';

const healthQuizService = {
  getQuizzes: async (params: QuizSearchParams): Promise<PaginatedResponse<Quiz>> => {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params.isPublished !== undefined) {
      queryParams.append('isPublished', params.isPublished.toString());
    }
    if (params.createdBy) queryParams.append('createdBy', params.createdBy);

    const response = await api.get(`${base}?${queryParams.toString()}`);
    return {
      data: response.data.data.map((q: QuizDTO) => mapQuizDtoToQuiz(q)),
      meta: response.data.meta,
    };
  },

  getQuizById: async (id: string): Promise<Quiz> => {
    const response = await api.get(`${base}/${id}`);
    return mapQuizDtoToQuiz(response.data as QuizDTO);
  },

  createQuiz: async (quizData: CreateQuizDTO): Promise<Quiz> => {
    const response = await api.post(base, quizData);
    return mapQuizDtoToQuiz(response.data as QuizDTO);
  },

  updateQuiz: async (id: string, quizData: UpdateQuizDTO): Promise<Quiz> => {
    const response = await api.patch(`${base}/${id}`, quizData);
    return mapQuizDtoToQuiz(response.data as QuizDTO);
  },

  deleteQuiz: async (id: string): Promise<void> => {
    await api.delete(`${base}/${id}`);
  },
};

export default healthQuizService;
