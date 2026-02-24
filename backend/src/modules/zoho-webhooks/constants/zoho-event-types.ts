/**
 * Zoho webhook event type identifiers.
 */
export const ZOHO_EVENT_TYPES = {
  CONTACT_CREATED: 'contact.created',
  CONTACT_UPDATED: 'contact.updated',
  LEAD_CREATED: 'lead.created',
  LEAD_UPDATED: 'lead.updated',
  DEAL_CREATED: 'deal.created',
  DEAL_UPDATED: 'deal.updated',
} as const;

export type ZohoEventType = (typeof ZOHO_EVENT_TYPES)[keyof typeof ZOHO_EVENT_TYPES];
