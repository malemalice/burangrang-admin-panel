/**
 * Global soft-delete contract (see docs/soft-delete-inventory.md).
 *
 * - `deletedAt: null` means the row is not soft-deleted.
 * - `deletedBy` stores the `t_users.id` of the actor when available.
 * - If the model has `isActive`, soft delete should also set `isActive: false`.
 *
 * **Queries**
 * - Default list/search/picker: filter with `isNotDeleted` / `isNotDeletedRecord`.
 * - Historical/detail: load referenced rows by id without hiding deleted, so old FKs still display.
 *
 * **Removal**
 * - Use `buildSoftDeleteData` instead of `prisma.delete` for in-scope entities.
 */
export const isNotDeletedRecord = { deletedAt: null } as const;

/** Prisma `where` fragment for "active" rows (use spread in `where: { ...isNotDeleted, ... }`) */
export const isNotDeleted = isNotDeletedRecord;

export function buildSoftDeleteData(actorUserId: string | undefined): {
  deletedAt: Date;
  deletedBy: string | null;
  isActive?: false;
} {
  return {
    deletedAt: new Date(),
    deletedBy: actorUserId ?? null,
  };
}

/**
 * For models that also carry `isActive` (default true) — combine with buildSoftDeleteData spread.
 */
export function buildSoftDeleteDataWithInactive(actorUserId: string | undefined): {
  deletedAt: Date;
  deletedBy: string | null;
  isActive: false;
} {
  return {
    ...buildSoftDeleteData(actorUserId),
    isActive: false,
  };
}

export function isSoftDeletedRow(
  row: { deletedAt: Date | null } | null | undefined,
): boolean {
  if (!row) return false;
  return row.deletedAt != null;
}
