// Enrollment status enum
export enum EnrollmentStatus {
  INVITED = 'INVITED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
}

// Enrollment entity types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  orderId?: string;
  status: EnrollmentStatus;
  enrolledAt?: string;
  completedAt?: string;
  progress: number;
  score?: number;
  lastAccessedAt?: string;

  // Assignment fields
  assignedBy?: string;
  assignedAt?: string;
  dueDate?: string;
  isRequired?: boolean;
  notes?: string;

  // Relations
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };
  assigner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  createdAt: string;
  updatedAt: string;
}

// DTO types for API communication
export interface EnrollmentDTO {
  id: string;
  userId: string;
  courseId: string;
  orderId?: string;
  status: string;
  enrolledAt?: string;
  completedAt?: string;
  progress: number;
  score?: number;
  lastAccessedAt?: string;
  assignedBy?: string;
  assignedAt?: string;
  dueDate?: string;
  isRequired?: boolean;
  notes?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
    slug: string;
    thumbnailUrl?: string;
  };
  assigner?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface AssignEnrollmentDTO {
  userId: string;
  courseId: string;
  dueDate?: string;
  isRequired?: boolean;
  notes?: string;
  sendEmail?: boolean;
}

export interface UpdateEnrollmentDTO {
  status?: EnrollmentStatus;
  dueDate?: string;
  notes?: string;
}

export interface CreateEnrollmentDTO {
  courseId: string;
}

// Pagination and filtering
export interface EnrollmentSearchParams {
  page: number;
  limit: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  courseId?: string;
  userId?: string;
  status?: EnrollmentStatus | string;
  assignedBy?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
