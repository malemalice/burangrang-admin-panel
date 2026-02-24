/** PRD: unified "Needs my action" item (future backend GET /dashboard/home/needs-my-action). */
export type NeedsMyActionType =
  | 'work_permit_approval'
  | 'ppe_withdrawal_approval'
  | 'risk_assessment_approval'
  | 'enrollment_overdue'
  | 'certificate_renewal'
  | 'reminder'
  | string;

export interface NeedsMyActionItem {
  id: string;
  type: NeedsMyActionType;
  title: string;
  description?: string;
  link: string;
  dueDate?: string;
  priority?: 'high' | 'medium' | 'low';
  metadata?: Record<string, unknown>;
}

export interface NeedsMyActionResponse {
  items: NeedsMyActionItem[];
  total?: number;
}

export interface PersonalHomeData {
  userGreeting: {
    displayName: string;
    role?: string;
  };
  enrollments: {
    inProgress: number;
    overdue: number;
    total: number;
  };
  certificates: {
    expiringIn30Days: number;
    totalActive: number;
  };
  reminders: {
    upcoming: number;
    overdue: number;
    items: Array<{
      id: string;
      title: string;
      dueDate: string;
      status: 'UPCOMING' | 'OVERDUE' | 'DONE';
    }>;
  };
  pendingApprovals: {
    count: number;
    items: Array<{
      id: string;
      type: string;
      title: string;
    }>;
  };
  quickLinks: Array<{
    label: string;
    path: string;
    icon?: string;
  }>;
  /** Unified list for "Needs my action" (PRD); used by Home.tsx. */
  needsMyAction?: NeedsMyActionItem[];
}
