// Course entity types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  totalChapters: number;
  totalDuration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  instructorId: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  publishedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  chapters?: Chapter[];
}

// Chapter entity types
export interface Chapter {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  duration: number;
  contentType: 'video' | 'pdf' | 'text' | 'youtube' | 'image' | 'audio';
  contentUrl?: string;
  youtubeVideoId?: string;
  content?: string;
  isFree: boolean;
  isPublished: boolean;
  publishedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;

  // Relations
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

// DTO types for API communication
export interface CourseDTO {
  id: string;
  title: string;
  slug: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  totalChapters: number;
  totalDuration: number;
  difficulty: string;
  language: string;
  rating: number;
  reviewCount: number;
  studentCount: number;
  instructorId: string;
  status: string;
  publishedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  instructor?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  categories?: {
    id: string;
    name: string;
    slug: string;
  }[];
  chapters?: {
    id: string;
    title: string;
    order: number;
    duration: number;
    isPublished: boolean;
  }[];
}

export interface ChapterDTO {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  order: number;
  duration: number;
  contentType: string;
  contentUrl?: string;
  youtubeVideoId?: string;
  content?: string;
  isFree: boolean;
  isPublished: boolean;
  publishedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
}

// Create/Update DTO types
export interface CreateCourseDTO {
  title: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  thumbnailUrl?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  language?: string;
  instructorId: string;
  status?: 'draft' | 'review' | 'published' | 'archived';
  categoryIds?: string[];
}

export interface UpdateCourseDTO extends Partial<CreateCourseDTO> {
  publishedAt?: string;
  isActive?: boolean;
}

export interface CreateChapterDTO {
  courseId: string;
  title: string;
  description?: string;
  order: number;
  duration?: number;
  contentType: 'video' | 'pdf' | 'text' | 'youtube' | 'image' | 'audio';
  contentUrl?: string;
  youtubeVideoId?: string;
  content?: string;
  isFree?: boolean;
  isPublished?: boolean;
}

export interface UpdateChapterDTO extends Partial<CreateChapterDTO> {
  publishedAt?: string;
  isActive?: boolean;
}

// Search and filter types
export interface CourseSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  status?: 'draft' | 'review' | 'published' | 'archived';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructorId?: string;
  categoryId?: string;
  language?: string;
}

export interface ChapterSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  isActive?: boolean;
  isPublished?: boolean;
  isFree?: boolean;
  contentType?: 'video' | 'pdf' | 'text' | 'youtube';
  courseId?: string;
  options?: boolean;
}

// Response types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

// Re-export PaginationParams from core types for consistency
export type { PaginationParams } from '@/core/lib/types';

export interface CourseStats {
  total: number;
  published: number;
  draft: number;
  byDifficulty: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  byStatus: {
    draft: number;
    review: number;
    published: number;
    archived: number;
  };
}

// Form data types
export interface CourseFormData {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  thumbnailUrl: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  instructorId: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  categoryIds: string[];
}

export interface ChapterFormData {
  title: string;
  description: string;
  order: number;
  duration: number;
  contentType: 'video' | 'pdf' | 'text' | 'youtube' | 'image' | 'audio';
  contentUrl: string;
  youtubeVideoId: string;
  content: string;
  isFree: boolean;
  isPublished: boolean;
}

// Filter types
export interface CourseFilters {
  status?: 'draft' | 'review' | 'published' | 'archived';
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  instructorId?: string;
  categoryId?: string;
  language?: string;
}

export interface ChapterFilters {
  contentType?: 'video' | 'pdf' | 'text' | 'youtube';
  isPublished?: boolean;
  isFree?: boolean;
  courseId?: string;
}

// Progress types
export enum ProgressStatus {
  NOT_STARTED = 'NOT_STARTED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export interface Progress {
  id: string;
  enrollmentId: string;
  chapterId: string;
  status: ProgressStatus;
  timeSpent: number;
  progress: number;
  startedAt?: string;
  completedAt?: string;
  lastAccessedAt?: string;
}

export interface UpdateProgressDTO {
  status?: ProgressStatus;
  timeSpent?: number;
  progress?: number;
}

export interface Quiz {
  id: string;
  title: string;
  description?: string;
  duration?: number;
  passingScore: number;
  entity: 'COURSE' | 'CHAPTER';
  entityId: string;
  isPublished: boolean;
  isActive: boolean;
}

export interface QuizAttemptSummary {
  id: string;
  quizId: string;
  attemptNumber: number;
  status: 'INVITING' | 'INVITED' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  score?: number;
  totalPoints?: number;
  earnedPoints?: number;
  isPassed: boolean;
  startedAt: string;
  completedAt?: string;
  timeSpent: number;
}

export interface LearningContext {
  enrollment: any; // Using any for now to avoid circular dependency issues
  course: Course;
  quizzes: Quiz[];
  progress: Progress[];
  quizAttempts: QuizAttemptSummary[];
}
