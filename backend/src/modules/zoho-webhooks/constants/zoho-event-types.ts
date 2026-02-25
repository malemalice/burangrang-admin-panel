/**
 * Zoho webhook event type identifiers.
 */
export const ZOHO_EVENT_TYPES = {
  TICKET_ADD: 'Ticket_Add',
} as const;

export type ZohoEventType =
  (typeof ZOHO_EVENT_TYPES)[keyof typeof ZOHO_EVENT_TYPES];
