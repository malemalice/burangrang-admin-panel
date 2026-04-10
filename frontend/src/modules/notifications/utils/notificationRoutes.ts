import { useNavigate } from 'react-router-dom';
import { NOTIFICATION_CONTEXTS, NotificationContext } from '../constants/notificationContexts';
import enrollmentService from '@/modules/enrollments/services/enrollmentService';
import quizService from '@/modules/quizzes/services/quizService';
import { usePermissions } from '@/core/hooks/usePermissions';

/**
 * Normalizes notification context values to a consistent format
 * Handles both snake_case (from approval system) and kebab-case (from modules)
 * 
 * @param context - Raw context value from notification
 * @returns Normalized context value (kebab-case) or null if context is empty
 * 
 * @example
 * normalizeContext('risk_assessment') // Returns 'risk-assessment'
 * normalizeContext('work_permit') // Returns 'work-permit'
 * normalizeContext('work-permit') // Returns 'work-permit'
 * normalizeContext('RISK_ASSESSMENT') // Returns 'risk-assessment'
 */
export function normalizeContext(context?: string): string | null {
  if (!context) {
    return null;
  }

  // Convert to lowercase and replace underscores with hyphens
  return context.toLowerCase().replace(/_/g, '-');
}

/**
 * Route mapping configuration
 */
interface RouteConfig {
  /** Base route path for list view (when contextId is missing) */
  listRoute: string;
  /** Route path template for detail view (when contextId exists) */
  detailRoute: (id: string) => string;
}

/**
 * Context to route mapping registry
 * Uses normalized kebab-case context values that match frontend route paths
 */
const CONTEXT_ROUTE_MAP: Record<string, RouteConfig> = {
  // Operational Modules
  [NOTIFICATION_CONTEXTS.RISK_ASSESSMENT]: {
    listRoute: '/risk-assessment',
    detailRoute: (id) => `/risk-assessment/${id}`,
  },
  [NOTIFICATION_CONTEXTS.WORK_PERMIT]: {
    listRoute: '/work-permits',
    detailRoute: (id) => `/work-permits/${id}`,
  },
  [NOTIFICATION_CONTEXTS.ENVIRONMENTAL_MEASUREMENT]: {
    listRoute: '/environmental-measurements',
    detailRoute: (id) => `/environmental-measurements/${id}`,
  },
  [NOTIFICATION_CONTEXTS.WASTE_MANAGEMENT]: {
    listRoute: '/waste-management',
    detailRoute: (id) => `/waste-management/${id}`,
  },
  
  // Master Data
  [NOTIFICATION_CONTEXTS.OFFICE]: {
    listRoute: '/master/offices',
    detailRoute: (id) => `/master/offices/${id}`,
  },
  [NOTIFICATION_CONTEXTS.DEPARTMENT]: {
    listRoute: '/master/departments',
    detailRoute: (id) => `/master/departments/${id}`,
  },
  [NOTIFICATION_CONTEXTS.JOB_POSITION]: {
    listRoute: '/master/job-positions',
    detailRoute: (id) => `/master/job-positions/${id}`,
  },
  [NOTIFICATION_CONTEXTS.RISK_CATEGORY]: {
    listRoute: '/master/risk-categories',
    detailRoute: (id) => `/master/risk-categories/${id}`,
  },
  [NOTIFICATION_CONTEXTS.RISK]: {
    listRoute: '/master/risks',
    detailRoute: (id) => `/master/risks/${id}`,
  },
  [NOTIFICATION_CONTEXTS.APPROVAL]: {
    listRoute: '/master/approvals',
    detailRoute: (id) => `/master/approvals/${id}`,
  },
  [NOTIFICATION_CONTEXTS.AREA]: {
    listRoute: '/master/areas',
    detailRoute: (id) => `/master/areas/${id}`,
  },
  [NOTIFICATION_CONTEXTS.ROOM]: {
    listRoute: '/master/rooms',
    detailRoute: (id) => `/master/rooms/${id}`,
  },
  
  // PPE Management
  [NOTIFICATION_CONTEXTS.PPE_STOCK]: {
    listRoute: '/ppe/stocks',
    detailRoute: (id) => `/ppe/stocks/${id}`,
  },
  [NOTIFICATION_CONTEXTS.PPE_WITHDRAWAL]: {
    listRoute: '/ppe/withdrawals',
    detailRoute: (id) => `/ppe/withdrawals/${id}`,
  },
  [NOTIFICATION_CONTEXTS.SAFETY_EQUIPMENT]: {
    listRoute: '/master/safety-equipments',
    detailRoute: (id) => `/master/safety-equipments/${id}`,
  },
  
  // LMS
  [NOTIFICATION_CONTEXTS.COURSE]: {
    listRoute: '/courses',
    detailRoute: (id) => `/courses/${id}`,
  },
  [NOTIFICATION_CONTEXTS.ENROLLMENT]: {
    listRoute: '/enrollments',
    detailRoute: (id) => `/enrollments/${id}`,
  },
  [NOTIFICATION_CONTEXTS.QUIZ]: {
    listRoute: '/quizzes',
    detailRoute: (id) => `/quizzes/${id}`,
  },
  
  // Certificates
  [NOTIFICATION_CONTEXTS.CERTIFICATE]: {
    listRoute: '/certificates',
    detailRoute: (id) => `/certificates/${id}`,
  },
  
  // User Management
  [NOTIFICATION_CONTEXTS.USER]: {
    listRoute: '/users',
    detailRoute: (id) => `/users/${id}`,
  },
  [NOTIFICATION_CONTEXTS.ROLE]: {
    listRoute: '/roles',
    detailRoute: (id) => `/roles/${id}`,
  },
};

/**
 * Resolves notification context to a route path
 * Automatically normalizes context format (snake_case → kebab-case)
 * 
 * @param context - Raw notification context (can be snake_case or kebab-case)
 * @param contextId - Optional entity ID for detail view
 * @returns Route path or '/notifications' if context is unknown/missing
 * 
 * @example
 * getNotificationRoute('risk_assessment', '123') // Returns '/risk-assessment/123'
 * getNotificationRoute('work-permit', '456') // Returns '/work-permits/456'
 * getNotificationRoute('RISK_ASSESSMENT') // Returns '/risk-assessment'
 * getNotificationRoute('unknown') // Returns '/notifications'
 */
export function getNotificationRoute(
  context?: string,
  contextId?: string
): string {
  // Normalize context to kebab-case
  const normalizedContext = normalizeContext(context);
  
  if (!normalizedContext) {
    return '/notifications'; // Fallback to notifications list
  }

  const routeConfig = CONTEXT_ROUTE_MAP[normalizedContext];
  
  if (!routeConfig) {
    console.warn(`Unknown notification context: ${context} (normalized: ${normalizedContext})`);
    return '/notifications'; // Fallback to notifications list
  }

  // If contextId exists, navigate to detail view
  if (contextId) {
    return routeConfig.detailRoute(contextId);
  }

  // Otherwise, navigate to list view
  return routeConfig.listRoute;
}

/**
 * Hook for navigating from notifications
 * 
 * @returns Function that navigates to the appropriate route based on notification context
 * 
 * @example
 * const navigateFromNotification = useNotificationNavigation();
 * navigateFromNotification({
 *   context: 'risk_assessment',
 *   contextId: '123'
 * });
 */
export function useNotificationNavigation() {
  const navigate = useNavigate();
  const { hasPermission } = usePermissions();

  return async (notification: {
    context?: string;
    contextId?: string;
    title?: string;
    message?: string;
  }) => {
    const normalizedContext = normalizeContext(notification.context);

    if (normalizedContext === NOTIFICATION_CONTEXTS.ENROLLMENT && notification.contextId) {
      try {
        if (hasPermission('quiz:view-attempts')) {
          const attempts = await quizService.getAttemptsByEnrollment(notification.contextId);

          const prioritizedAttempt =
            attempts.find((attempt) => attempt.needsGrading && attempt.status === 'COMPLETED') ||
            attempts.find((attempt) => attempt.status === 'COMPLETED') ||
            attempts.find((attempt) => attempt.status === 'IN_PROGRESS');

          if (prioritizedAttempt?.quizId) {
            navigate(`/quizzes/${prioritizedAttempt.quizId}/attempts/${prioritizedAttempt.id}/grade`);
            return;
          }
        }

        if (hasPermission('quiz:attempt')) {
          const enrollment = await enrollmentService.getEnrollmentById(notification.contextId);
          if (enrollment.courseId) {
            navigate(`/courses/${enrollment.courseId}/learn`);
            return;
          }
        }
      } catch {
        // Ignore enrichment errors and fallback to default route mapping
      }
    }

    if (normalizedContext === NOTIFICATION_CONTEXTS.QUIZ && notification.contextId) {
      if (hasPermission('quiz:view-attempts')) {
        navigate(`/quizzes/${notification.contextId}?tab=grading`);
        return;
      }

      if (hasPermission('quiz:attempt')) {
        navigate(`/quizzes/${notification.contextId}/attempt`);
        return;
      }
    }

    const route = getNotificationRoute(notification.context, notification.contextId);
    navigate(route);
  };
}
