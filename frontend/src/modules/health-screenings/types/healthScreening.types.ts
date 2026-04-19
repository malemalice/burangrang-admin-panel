import type { QuizAttemptDTO } from '@/modules/quizzes/types/quiz.types';
import type { Quiz, QuizAttempt } from '@/modules/quizzes/types/quiz.types';

/** IN_PROGRESS = filling. DONE = submitted. EXPIRED = outside validity window from createdAt. */
export type HealthScreeningStatus = 'IN_PROGRESS' | 'DONE' | 'EXPIRED';

export interface HealthScreeningListItem {
  id: string;
  userId: string;
  companyId?: string | null;
  quizId: string;
  quizAttemptId: string;
  workPermitWorkerId?: string | null;
  status: HealthScreeningStatus;
  /** ISO timestamp when submit included both declaration acknowledgements (audit). */
  declarationTermsAcceptedAt?: string | null;
  /** Derived: createdAt + health_declaration_validity_days (API). */
  validUntil?: string | null;
  createdAt: string;
  updatedAt: string;
  quiz?: { id: string; title: string };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface StartHealthScreeningResponse {
  screening: HealthScreeningListItem;
  attempt: QuizAttemptDTO;
}

export interface HealthScreeningDetailView extends HealthScreeningListItem {
  quiz: Quiz;
  quizAttempt: QuizAttempt;
  workPermitWorker?: {
    id: string;
    workPermit?: { id: string; code: string };
  } | null;
}
