import type { QuizAttemptDTO } from '@/modules/quizzes/types/quiz.types';
import type { Quiz, QuizAttempt } from '@/modules/quizzes/types/quiz.types';

/** IN_PROGRESS = filling. DONE = submitted. EXPIRED = legacy row force-expired by single-use migration. */
export type HealthScreeningStatus = 'IN_PROGRESS' | 'DONE' | 'EXPIRED';

export interface HealthScreeningListItem {
  id: string;
  userId: string;
  companyId?: string | null;
  quizId: string;
  quizAttemptId: string;
  workerId?: string | null;
  status: HealthScreeningStatus;
  /** ISO timestamp when submit included both declaration acknowledgements (audit). */
  declarationTermsAcceptedAt?: string | null;
  /** Single-use binding: set to the WorkPermit id once linked to a permit; cleared on reject. */
  consumedByWorkPermitId?: string | null;
  /** WorkPermit.code joined for display. */
  consumedByWorkPermitCode?: string | null;
  /** API-derived: status === 'DONE' && consumedByWorkPermitId == null. */
  isAvailable?: boolean;
  createdAt: string;
  updatedAt: string;
  quiz?: { id: string; title: string };
  company?: { id: string; name: string } | null;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    profession?: { name: string; code: string } | null;
  };
}

export interface StartHealthScreeningResponse {
  screening: HealthScreeningListItem;
  attempt: QuizAttemptDTO;
}

export interface HealthScreeningDetailView extends HealthScreeningListItem {
  quiz: Quiz;
  quizAttempt: QuizAttempt;
  worker?: {
    id: string;
    workPermitWorkers?: Array<{
      workPermit?: { id: string; code: string };
    }>;
  } | null;
}
