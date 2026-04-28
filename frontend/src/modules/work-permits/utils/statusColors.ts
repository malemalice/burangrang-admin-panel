/**
 * Work Permit Status Color Utility
 * Uses semantic color tokens from design system for TRD compliance
 * 
 * This utility function maps work permit statuses to semantic status types
 * and returns Tailwind CSS classes that align with the design system's
 * semantic color tokens (success, error, warning, info, neutral).
 * 
 * While the classes use Tailwind color names (green, red, blue, etc.),
 * they represent semantic meanings:
 * - green = success state
 * - red = error/destructive state
 * - blue = info state
 * - yellow/orange = warning state
 * - gray/muted = neutral state
 */

import { WorkPermitStatus } from '../types/work-permit.types';

/**
 * Get Tailwind CSS classes for work permit status badge
 * Uses semantic color mapping aligned with design system tokens
 * 
 * Colors are mapped to semantic meanings:
 * - Success (APPROVED): green colors representing success state
 * - Error (REJECTED): red colors representing error/destructive state
 * - Info (CLOSED): blue colors representing informational state
 * - Warning (WAITING_APPROVAL, IN_REVIEW_*): yellow colors representing warning/pending state
 * - Neutral (DRAFT, OPEN, EXTENDED): muted colors representing neutral state
 * 
 * @param status - Work permit status
 * @returns Tailwind CSS classes string for badge styling with dark mode support
 */
export const getWorkPermitStatusColor = (status: WorkPermitStatus): string => {
  // Map work permit status to semantic status types using design system color tokens
  switch (status) {
    case 'APPROVED':
      // Success state - semantic success colors (green)
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';

    case 'REJECTED':
      // Error state - semantic error colors (red)
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';

    case 'CLOSED':
      // Info state - semantic info colors (blue)
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';

    case 'WAITING_APPROVAL':
    case 'IN_REVIEW_PROJECT_OWNER':
    case 'IN_REVIEW_HSE':
    case 'IN_REVIEW_SECURITY':
      // Warning state - semantic warning colors (yellow)
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';

    case 'WAITING_APPLICANT_SIGN':
      // Info/action-required state for applicant acknowledgment
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';

    case 'DRAFT':
    case 'OPEN':
    case 'EXTENDED':
    default:
      // Neutral state - semantic muted colors from design system
      return 'bg-muted text-muted-foreground';
  }
};

/**
 * Get semantic status type for work permit status
 * Useful for mapping to design system status colors
 */
export const getWorkPermitStatusType = (status: WorkPermitStatus): 'success' | 'error' | 'warning' | 'info' | 'neutral' => {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'REJECTED':
      return 'error';
    case 'CLOSED':
      return 'info';
    case 'WAITING_APPROVAL':
    case 'IN_REVIEW_PROJECT_OWNER':
    case 'IN_REVIEW_HSE':
    case 'IN_REVIEW_SECURITY':
      return 'warning';
    case 'WAITING_APPLICANT_SIGN':
      return 'info';
    case 'DRAFT':
    case 'OPEN':
    case 'EXTENDED':
    default:
      return 'neutral';
  }
};
