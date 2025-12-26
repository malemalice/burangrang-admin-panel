import api from '@/core/lib/api';
import {
  Quiz,
  QuizDTO,
  CreateQuizDTO,
  UpdateQuizDTO,
  QuizSearchParams,
  PaginatedResponse,
  QuizAttempt,
  QuizAttemptDTO,
  CreateQuizAttemptDTO,
  QuizAnswer,
  QuizAnswerDTO,
  SubmitAnswerDTO,
  GradeAnswerDTO,
  AssignQuizDTO,
  QuizQuestion,
  QuizQuestionOption,
} from '../types/quiz.types';

// Data transformation functions
const mapQuizDtoToQuiz = (quizDto: QuizDTO): Quiz => ({
  id: quizDto.id,
  title: quizDto.title,
  description: quizDto.description,
  instructions: quizDto.instructions,
  entity: (quizDto.entity as 'COURSE' | 'CHAPTER') || null,
  entityId: quizDto.entityId,
  duration: quizDto.duration,
  passingScore: quizDto.passingScore,
  maxAttempts: quizDto.maxAttempts,
  shuffleQuestions: quizDto.shuffleQuestions,
  shuffleOptions: quizDto.shuffleOptions,
  showCorrectAnswer: quizDto.showCorrectAnswer,
  isPublished: quizDto.isPublished,
  publishedAt: quizDto.publishedAt,
  isActive: quizDto.isActive,
  createdBy: quizDto.createdBy,
  createdAt: quizDto.createdAt,
  updatedAt: quizDto.updatedAt,
  creator: quizDto.creator,
  course: quizDto.course,
  chapter: quizDto.chapter,
  questions: quizDto.questions?.map((q) => {
    const questionTimestamp = quizDto.createdAt || new Date().toISOString();
    return {
      id: q.id,
      questionType: q.questionType as 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE',
      questionText: q.questionText,
      explanation: q.explanation,
      mediaUrl: q.mediaUrl,
      mediaType: q.mediaType,
      points: q.points,
      order: q.order,
      isActive: q.isActive,
      // Backend doesn't return createdAt/updatedAt for questions, use quiz timestamps as fallback
      createdAt: questionTimestamp,
      updatedAt: quizDto.updatedAt || questionTimestamp,
      options: q.options?.map((opt) => ({
        id: opt.id,
        optionText: opt.optionText,
        isCorrect: opt.isCorrect,
        order: opt.order,
        // Backend doesn't return createdAt/updatedAt for options, use question timestamps as fallback
        createdAt: questionTimestamp,
        updatedAt: quizDto.updatedAt || questionTimestamp,
      })),
    } as QuizQuestion;
  }),
  statistics: quizDto.statistics,
});

const mapQuizAttemptDtoToQuizAttempt = (attemptDto: QuizAttemptDTO): QuizAttempt => ({
  id: attemptDto.id,
  quizId: attemptDto.quizId,
  enrollmentId: attemptDto.enrollmentId,
  userId: attemptDto.userId,
  attemptNumber: attemptDto.attemptNumber,
  status: attemptDto.status as QuizAttempt['status'],
  score: attemptDto.score,
  totalPoints: attemptDto.totalPoints,
  earnedPoints: attemptDto.earnedPoints,
  isPassed: attemptDto.isPassed,
  dueDate: attemptDto.dueDate,
  startedAt: attemptDto.startedAt,
  completedAt: attemptDto.completedAt,
  timeSpent: attemptDto.timeSpent,
  // Backend doesn't return createdAt/updatedAt, use startedAt as fallback
  createdAt: attemptDto.startedAt || new Date().toISOString(),
  updatedAt: attemptDto.completedAt || attemptDto.startedAt || new Date().toISOString(),
  quiz: attemptDto.quiz ? mapQuizDtoToQuiz(attemptDto.quiz) : undefined,
  answers: attemptDto.answers?.map((answer) => mapQuizAnswerDtoToQuizAnswer(answer)),
});

const mapQuizAnswerDtoToQuizAnswer = (answerDto: QuizAnswerDTO): QuizAnswer => ({
  id: answerDto.id,
  attemptId: answerDto.attemptId,
  questionId: answerDto.questionId,
  selectedOptionId: answerDto.selectedOptionId,
  essayAnswer: answerDto.essayAnswer,
  isCorrect: answerDto.isCorrect,
  pointsEarned: answerDto.pointsEarned,
  feedback: answerDto.feedback,
  gradedBy: answerDto.gradedBy,
  gradedAt: answerDto.gradedAt,
  // Backend doesn't return createdAt/updatedAt, use current time as fallback
  createdAt: new Date().toISOString(),
  updatedAt: answerDto.gradedAt || new Date().toISOString(),
  question: answerDto.question ? {
    id: answerDto.question.id,
    questionType: answerDto.question.questionType as 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE',
    questionText: answerDto.question.questionText,
    explanation: answerDto.question.explanation,
    mediaUrl: answerDto.question.mediaUrl,
    mediaType: answerDto.question.mediaType,
    points: answerDto.question.points,
    order: answerDto.question.order,
    isActive: answerDto.question.isActive,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    options: answerDto.question.options?.map((opt) => ({
      id: opt.id,
      optionText: opt.optionText,
      isCorrect: opt.isCorrect,
      order: opt.order,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    } as QuizQuestionOption)),
  } as QuizQuestion : undefined,
  selectedOption: answerDto.selectedOption ? {
    id: answerDto.selectedOption.id,
    optionText: answerDto.selectedOption.optionText,
    isCorrect: answerDto.selectedOption.isCorrect,
    order: answerDto.selectedOption.order,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } as QuizQuestionOption : undefined,
});

const quizService = {
  // GET all quizzes with pagination
  getQuizzes: async (params: QuizSearchParams): Promise<PaginatedResponse<Quiz>> => {
    const queryParams = new URLSearchParams({
      page: (params.page || 1).toString(),
      limit: (params.limit || 10).toString(),
    });

    // Add search and filters
    if (params.search) queryParams.append('search', params.search);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    if (params.isActive !== undefined) {
      queryParams.append('isActive', params.isActive.toString());
    }
    if (params.isPublished !== undefined) {
      queryParams.append('isPublished', params.isPublished.toString());
    }
    if (params.entity) queryParams.append('entity', params.entity);
    if (params.entityId) queryParams.append('entityId', params.entityId);
    if (params.createdBy) queryParams.append('createdBy', params.createdBy);

    const response = await api.get(`/quizzes?${queryParams.toString()}`);
    return {
      data: response.data.data.map(mapQuizDtoToQuiz),
      meta: response.data.meta,
    };
  },

  // GET single quiz by ID
  getQuizById: async (id: string): Promise<Quiz> => {
    const response = await api.get(`/quizzes/${id}`);
    return mapQuizDtoToQuiz(response.data);
  },

  // CREATE quiz
  createQuiz: async (quizData: CreateQuizDTO): Promise<Quiz> => {
    const response = await api.post('/quizzes', quizData);
    return mapQuizDtoToQuiz(response.data);
  },

  // UPDATE quiz
  updateQuiz: async (id: string, quizData: UpdateQuizDTO): Promise<Quiz> => {
    const response = await api.patch(`/quizzes/${id}`, quizData);
    return mapQuizDtoToQuiz(response.data);
  },

  // DELETE quiz
  deleteQuiz: async (id: string): Promise<void> => {
    await api.delete(`/quizzes/${id}`);
  },

  // ASSIGN quiz to users
  assignQuiz: async (quizId: string, assignData: AssignQuizDTO): Promise<void> => {
    await api.post(`/quizzes/${quizId}/assign`, assignData);
  },

  // GET current in-progress attempt (for resume functionality)
  getCurrentAttempt: async (quizId: string, enrollmentId?: string): Promise<QuizAttempt | null> => {
    try {
      const params = new URLSearchParams();
      if (enrollmentId) params.append('enrollmentId', enrollmentId);
      const response = await api.get(`/quizzes/${quizId}/attempts/current?${params.toString()}`);
      if (response.data) {
        return mapQuizAttemptDtoToQuizAttempt(response.data);
      }
      return null;
    } catch {
      return null;
    }
  },

  // START quiz attempt
  startAttempt: async (quizId: string, attemptData: CreateQuizAttemptDTO): Promise<QuizAttempt> => {
    const response = await api.post(`/quizzes/${quizId}/attempts`, attemptData);
    return mapQuizAttemptDtoToQuizAttempt(response.data);
  },

  // SUBMIT answer
  submitAnswer: async (attemptId: string, answerData: SubmitAnswerDTO): Promise<QuizAnswer> => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/answers`, answerData);
    return mapQuizAnswerDtoToQuizAnswer(response.data);
  },

  // SUBMIT attempt
  submitAttempt: async (attemptId: string): Promise<QuizAttempt> => {
    const response = await api.post(`/quizzes/attempts/${attemptId}/submit`);
    return mapQuizAttemptDtoToQuizAttempt(response.data);
  },

  // GRADE essay answer
  gradeAnswer: async (answerId: string, gradeData: GradeAnswerDTO): Promise<QuizAnswer> => {
    const response = await api.patch(`/quizzes/answers/${answerId}/grade`, gradeData);
    return mapQuizAnswerDtoToQuizAnswer(response.data);
  },

  // LINK quiz to course or chapter
  linkQuiz: async (quizId: string, entity: 'COURSE' | 'CHAPTER', entityId: string): Promise<Quiz> => {
    const response = await api.patch(`/quizzes/${quizId}/link`, { entity, entityId });
    return mapQuizDtoToQuiz(response.data);
  },

  // Helper function to get status badge color classes
  getStatusBadgeColor: (status: 'published' | 'draft' | 'active' | 'inactive'): string => {
    switch (status) {
      case 'published':
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200';
      case 'inactive':
        return 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200';
      case 'draft':
      default:
        return 'bg-muted text-muted-foreground';
    }
  },
};

export default quizService;
