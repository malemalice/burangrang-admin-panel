// Quiz entity types
export type QuizEntityType = 'COURSE' | 'CHAPTER' | null;
export type QuestionType = 'MULTIPLE_CHOICE' | 'ESSAY' | 'TRUE_FALSE';
export type QuizAttemptStatus = 'INVITING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';

export interface Quiz {
  id: string;
  kind?: 'LMS_QUIZ' | 'HEALTH_DECLARATION';
  title: string;
  description?: string;
  instructions?: string;
  entity: QuizEntityType;
  entityId?: string;
  duration?: number;
  passingScore: number;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswer: boolean;
  isPublished: boolean;
  publishedAt?: string;
  isActive: boolean;
  /** At most one quiz globally; used when starting a health screening without quizId */
  isDefaultForHealthScreening?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  chapter?: {
    id: string;
    title: string;
    courseId: string;
  };
  questions?: QuizQuestion[];
  statistics?: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    totalQuestions: number;
  };
}

export interface QuizQuestion {
  id: string;
  questionType: QuestionType;
  questionText: string;
  explanation?: string;
  mediaUrl?: string;
  mediaType?: string;
  points: number;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  options?: QuizQuestionOption[];
}

export interface QuizQuestionOption {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  enrollmentId?: string;
  userId?: string;
  attemptNumber: number;
  status: QuizAttemptStatus;
  score?: number;
  totalPoints?: number;
  earnedPoints?: number;
  isPassed: boolean;
  dueDate?: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  createdAt: string;
  updatedAt: string;

  // Relations
  quiz?: Quiz;
  answers?: QuizAnswer[];
}

export interface QuizAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Relations
  question?: QuizQuestion;
  selectedOption?: QuizQuestionOption;
}

// DTO types for API communication
export interface QuizDTO {
  id: string;
  kind?: 'LMS_QUIZ' | 'HEALTH_DECLARATION';
  title: string;
  description?: string;
  instructions?: string;
  entity?: string;
  entityId?: string;
  duration?: number;
  passingScore: number;
  maxAttempts?: number;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  showCorrectAnswer: boolean;
  isPublished: boolean;
  publishedAt?: string;
  isActive: boolean;
  isDefaultForHealthScreening?: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  chapter?: {
    id: string;
    title: string;
    courseId: string;
  };
  questions?: QuizQuestionDTO[];
  statistics?: {
    totalAttempts: number;
    averageScore: number;
    passRate: number;
    totalQuestions: number;
  };
}

export interface QuizQuestionDTO {
  id: string;
  questionType: string;
  questionText: string;
  explanation?: string;
  mediaUrl?: string;
  mediaType?: string;
  points: number;
  order: number;
  isActive: boolean;
  options?: QuizQuestionOptionDTO[];
}

export interface QuizQuestionOptionDTO {
  id: string;
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface QuizAttemptDTO {
  id: string;
  quizId: string;
  enrollmentId?: string;
  userId?: string;
  attemptNumber: number;
  status: string;
  score?: number;
  totalPoints?: number;
  earnedPoints?: number;
  isPassed: boolean;
  dueDate?: string;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
  quiz?: QuizDTO;
  answers?: QuizAnswerDTO[];
}

export interface QuizAnswerDTO {
  id: string;
  attemptId: string;
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
  isCorrect?: boolean;
  pointsEarned: number;
  feedback?: string;
  gradedBy?: string;
  gradedAt?: string;
  question?: QuizQuestionDTO;
  selectedOption?: QuizQuestionOptionDTO;
}

// Create/Update DTOs
export interface CreateQuizDTO {
  title: string;
  description?: string;
  instructions?: string;
  entity?: string;
  entityId?: string;
  duration?: number;
  passingScore?: number;
  maxAttempts?: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showCorrectAnswer?: boolean;
  isPublished?: boolean;
  /** HEALTH_DECLARATION only; requires published standalone questionnaire */
  isDefaultForHealthScreening?: boolean;
  questions: CreateQuizQuestionDTO[];
}

export interface CreateQuizQuestionDTO {
  questionType: QuestionType;
  questionText: string;
  explanation?: string;
  mediaUrl?: string;
  mediaType?: string;
  points?: number;
  order: number;
  options?: CreateQuizQuestionOptionDTO[];
}

export interface CreateQuizQuestionOptionDTO {
  optionText: string;
  isCorrect: boolean;
  order: number;
}

export interface UpdateQuizDTO extends Partial<CreateQuizDTO> { }

export interface CreateQuizAttemptDTO {
  enrollmentId?: string;
}

export interface SubmitAnswerDTO {
  questionId: string;
  selectedOptionId?: string;
  essayAnswer?: string;
}

export interface GradeAnswerDTO {
  pointsEarned: number;
  isCorrect: boolean;
  feedback?: string;
}

export interface AssignQuizDTO {
  userIds: string[];
  dueDate?: string;
  isRequired?: boolean;
  notes?: string;
}

export interface AdjustAttemptScoreDTO {
  adjustedScore: number;
  adjustmentReason?: string;
  overridePassStatus?: boolean;
}

export interface QuizAttemptWithUser extends QuizAttempt {
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  needsGrading?: boolean;
}

// Search/Filter types
export interface QuizSearchParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  isPublished?: boolean;
  entity?: string;
  entityId?: string;
  createdBy?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}
