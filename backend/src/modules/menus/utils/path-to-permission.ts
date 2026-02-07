/**
 * Dynamic path → permission mapping for sidebar menu visibility.
 * See backend/docs/sidebar-permission-lookup-trd.md §4.1.1.
 *
 * Convention: last path segment → singularize/kebab → resource:list;
 * fallback: first path segment → resource:list.
 * Outliers: '/' and '/master/approvals' handled explicitly.
 */

/** Normalize path: trim, no trailing slash (except root '/') */
function normalizePath(path: string | null): string {
  if (path == null || path === '') return '';
  const trimmed = path.trim().replace(/\/+$/, '');
  return trimmed === '' ? '/' : (trimmed.startsWith('/') ? trimmed : `/${trimmed}`);
}

/** Override map for paths that don't follow the convention (TRD §4.1.1 outliers) */
const PATH_OVERRIDES: Record<string, string | null> = {
  '/': null, // Caller treats as always visible when authenticated
  '/master/approvals': 'master-approval:list',
};

/**
 * Generic singularization so we can match path segments to permission resources
 * without a hardcoded map. Tries: ies→y, then trailing s/es; for kebab-case
 * applies to the last part only (e.g. risk-categories → risk-category).
 */
function singularizeSegment(segment: string): string {
  if (!segment) return segment;
  const lower = segment.toLowerCase();
  const singularizeWord = (word: string): string => {
    if (word.endsWith('ies')) return word.slice(0, -3) + 'y';
    if (word.endsWith('es') && word.length > 2) return word.slice(0, -2);
    if (word.endsWith('s') && word.length > 1) return word.slice(0, -1);
    return word;
  };
  const parts = lower.split('-');
  if (parts.length > 1) {
    parts[parts.length - 1] = singularizeWord(parts[parts.length - 1]);
    return parts.join('-');
  }
  return singularizeWord(lower);
}

/**
 * Derive required permission for a menu path using convention (TRD §4.1.1).
 * Returns permission name (e.g. 'user:list') if path maps to an allowed permission, null otherwise.
 * Caller: for path '/' and null return, treat as always visible when authenticated.
 */
export function pathToRequiredPermission(
  path: string | null,
  permissionNames: Set<string>,
): string | null {
  const normalized = normalizePath(path);
  const override = PATH_OVERRIDES[normalized];
  if (override !== undefined) return override;
  if (normalized === '' || normalized === '/') return null;

  const segments = normalized.split('/').filter(Boolean);
  if (segments.length === 0) return null;

  const lastSegment = segments[segments.length - 1].toLowerCase();
  const firstSegment = segments[0].toLowerCase();

  // Try last segment as-is, then singularized (e.g. risk-assessment → risk-assessment:list, users → user:list)
  if (permissionNames.has(`${lastSegment}:list`)) return `${lastSegment}:list`;
  const resourceFromLast = singularizeSegment(lastSegment);
  if (permissionNames.has(`${resourceFromLast}:list`)) return `${resourceFromLast}:list`;

  // Fallback: first segment as-is, then singularized (e.g. waste-management/* → waste-management:list)
  if (permissionNames.has(`${firstSegment}:list`)) return `${firstSegment}:list`;
  const resourceFromFirst = singularizeSegment(firstSegment);
  if (permissionNames.has(`${resourceFromFirst}:list`)) return `${resourceFromFirst}:list`;

  return null;
}
