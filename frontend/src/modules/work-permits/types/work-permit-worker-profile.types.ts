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
  assignments: WorkPermitWorkerProfileAssignmentDTO[];
}
