import { SetMetadata } from '@nestjs/common';

export const DATA_SCOPED_KEY = 'dataScoped';

/**
 * Marks a controller as data-scoped. The DataScopeGuard will run and set request.userContext
 * (userId, roleId, roleName, dataLevel, departmentId) for use by DataScopeService.
 * Pass the entity name used in DataScopeService: 'Enrollment' | 'Certificate' | 'WorkPermit' | 'PPEWithdrawal'.
 */
export const DataScoped = (entityName: string) =>
  SetMetadata(DATA_SCOPED_KEY, entityName);
