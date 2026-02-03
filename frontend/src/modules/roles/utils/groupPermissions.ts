import { Permission } from '@/core/lib/types';

/** Format resource key to display label (e.g. "risk-assessment" → "Risk Assessment") */
function formatGroupLabel(key: string): string {
  if (!key) return 'Other';
  return key
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export interface PermissionGroupItem {
  groupKey: string;
  groupLabel: string;
  permissions: Permission[];
}

/**
 * Group permissions by resource (prefix before ":" in name, e.g. "user:list" → "user").
 * Returns groups sorted by label; permissions within each group sorted by name.
 */
export function groupPermissionsByResource(permissions: Permission[]): PermissionGroupItem[] {
  const map = new Map<string, Permission[]>();
  for (const p of permissions) {
    const name = p.name || '';
    const colonIndex = name.indexOf(':');
    const key = colonIndex >= 0 ? name.slice(0, colonIndex) : 'other';
    const list = map.get(key) ?? [];
    list.push(p);
    map.set(key, list);
  }
  const groups: PermissionGroupItem[] = [];
  map.forEach((perms, key) => {
    groups.push({
      groupKey: key,
      groupLabel: formatGroupLabel(key),
      permissions: perms.sort((a, b) => (a.name || '').localeCompare(b.name || '')),
    });
  });
  groups.sort((a, b) => a.groupLabel.localeCompare(b.groupLabel));
  return groups;
}
