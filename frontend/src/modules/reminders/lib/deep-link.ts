import { getEntityEntry } from './entity-registry';

export interface DeepLinkInput {
  entity?: string;
  entityId?: string;
  subjectType?: string;
  subjectId?: string;
  /** Used as fallback when no entity is set (free-form reminder). */
  reminderId?: string;
}

/**
 * Resolve where a reminder/occurrence should deep-link to:
 *   - record-bound  → /<module>/:entityId
 *   - module+subject → /<module>?<subjectQueryKey>=<subjectId>
 *   - module-only   → /<module>
 *   - free-form     → /reminders/:reminderId
 */
export function resolveReminderDeepLink(input: DeepLinkInput): string {
  const { entity, entityId, subjectType, subjectId, reminderId } = input;

  if (!entity) {
    return reminderId ? `/reminders/${reminderId}` : '/reminders';
  }

  const entry = getEntityEntry(entity);

  if (entityId && entry.recordRoute) {
    return entry.recordRoute.replace('{entityId}', entityId);
  }

  if (subjectType && subjectId) {
    const queryKey = entry.subjectQueryKey?.[subjectType];
    if (queryKey) {
      const params = new URLSearchParams({ [queryKey]: subjectId });
      return `${entry.listRoute}?${params.toString()}`;
    }
  }

  return entry.listRoute;
}
