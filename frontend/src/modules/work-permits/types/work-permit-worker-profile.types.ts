import type { UserDTO } from '@/modules/users/types/user.types';

export interface WorkPermitWorkerProfileAssignmentDTO {
  id: string;
  order: number;
  createdAt: string;
  idNumber?: string | null;
  certificateUrl?: string | null;
  healthDeclarationUrl?: string | null;
  profession?: {
    id: string;
    name: string;
    code: string;
  };
  workPermit: {
    id: string;
    code: string;
    projectName: string;
    status: string;
    company?: {
      id: string;
      name: string;
      code: string;
    };
  };
  healthScreening: {
    id: string;
    status: string;
    quizId: string;
    quiz?: {
      id: string;
      title: string;
    };
  } | null;
}

/** GET /users/:id/work-permit-worker-profile */
export interface WorkPermitWorkerProfileDTO {
  user: UserDTO & { permissions?: string[]; roleName?: string };
  /** Latest health screening from worker profile even if `assignments` is empty. */
  latestHealthScreening?: {
    id: string;
    status: string;
    quizId: string;
    quiz?: {
      id: string;
      title: string;
    };
  } | null;
  /** URLs from `t_worker`; present even when `assignments` is empty. */
  workerDocuments?: {
    certificateUrl?: string | null;
    healthDeclarationUrl?: string | null;
  };
  assignments: WorkPermitWorkerProfileAssignmentDTO[];
}
