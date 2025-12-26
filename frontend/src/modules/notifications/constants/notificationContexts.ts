/**
 * Notification context identifiers
 * Normalized to kebab-case (matches route paths)
 * 
 * These constants represent the normalized context values that can appear
 * in notifications. Backend may send contexts in different formats (snake_case
 * or kebab-case), but they should be normalized to kebab-case for consistency.
 */
export const NOTIFICATION_CONTEXTS = {
  // Operational Modules
  RISK_ASSESSMENT: 'risk-assessment',
  WORK_PERMIT: 'work-permit',
  ENVIRONMENTAL_MEASUREMENT: 'environmental-measurement',
  WASTE_MANAGEMENT: 'waste-management',
  
  // Master Data
  OFFICE: 'office',
  DEPARTMENT: 'department',
  JOB_POSITION: 'job-position',
  RISK_CATEGORY: 'risk-category',
  RISK: 'risk',
  APPROVAL: 'approval',
  AREA: 'area',
  ROOM: 'room',
  
  // PPE Management
  PPE_STOCK: 'ppe-stock',
  PPE_WITHDRAWAL: 'ppe-withdrawal',
  SAFETY_EQUIPMENT: 'safety-equipment',
  
  // LMS
  COURSE: 'course',
  ENROLLMENT: 'enrollment',
  QUIZ: 'quiz',
  
  // Certificates
  CERTIFICATE: 'certificate',
  
  // User Management
  USER: 'user',
  ROLE: 'role',
  SYSTEM: 'system',
} as const;

export type NotificationContext = typeof NOTIFICATION_CONTEXTS[keyof typeof NOTIFICATION_CONTEXTS];

