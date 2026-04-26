/** Matches app soft-delete contract for seed `findFirst` / `update` filters. */
export const notDeleted = { deletedAt: null } as const;
