/**
 * Audit Criteria module constants
 */

/**
 * Transition type enum values
 */
export const TRANSITION_TYPES = ['INITIAL', 'TRANSITION_LEVEL', 'ADVANCE_LEVEL'] as const;

/**
 * Transition type type
 */
export type TransitionType = typeof TRANSITION_TYPES[number];

/**
 * Transition type labels for display
 */
export const TRANSITION_TYPE_LABELS: Record<TransitionType, string> = {
  INITIAL: 'Initial',
  TRANSITION_LEVEL: 'Transition Level',
  ADVANCE_LEVEL: 'Advance Level',
};

/**
 * Transition type options for select dropdowns
 */
export const TRANSITION_TYPE_OPTIONS = TRANSITION_TYPES.map((value) => ({
  value,
  label: TRANSITION_TYPE_LABELS[value],
}));
