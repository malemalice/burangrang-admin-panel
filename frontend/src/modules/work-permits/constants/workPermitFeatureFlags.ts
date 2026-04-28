/**
 * Backend setting key (see backend/prisma/seeds/settings.seed.ts).
 * When false (default), hide work classification rich safety guideline + attachments in work permit flows.
 */
export const FEATURE_WORK_PERMIT_CLASSIFICATION_CONTENT_KEY =
  'feature.work_permit_classification_content.enabled';

export function parseBooleanSettingValue(value: string | null): boolean {
  if (value == null) return false;
  const v = value.trim().toLowerCase();
  return v === 'true' || v === '1';
}
