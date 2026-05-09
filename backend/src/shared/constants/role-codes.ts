/**
 * Role codes from m_roles.code.
 * Use for comparisons (e.g. user?.role?.code === ROLE_CODES.SUPER_ADMIN).
 */
export const ROLE_CODES = {
  SUPER_ADMIN: 'SUPER_ADMIN',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  USER: 'USER',
  GUEST: 'GUEST',
  CONTRACTOR: 'CONTRACTOR',
} as const;

export type RoleCode = (typeof ROLE_CODES)[keyof typeof ROLE_CODES];
