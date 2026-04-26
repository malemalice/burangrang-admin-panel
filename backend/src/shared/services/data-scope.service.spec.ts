import { DataScopeService } from './data-scope.service';
import type { UserContext } from '../types/user-context';

describe('DataScopeService (WorkPermit applicant scope)', () => {
  let service: DataScopeService;

  beforeEach(() => {
    service = new DataScopeService();
  });

  it('buildWhereForList(WorkPermit) includes applicantUserId for SELF scope', () => {
    const ctx: UserContext = {
      userId: 'u1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };

    const where = service.buildWhereForList(ctx, 'WorkPermit');
    expect(where).toEqual({
      OR: [{ createdBy: 'u1' }, { applicantUserId: 'u1' }],
    });
  });

  it('canAccessRecord(WorkPermit) allows applicantUserId for SELF scope', () => {
    const ctx: UserContext = {
      userId: 'applicant-1',
      roleId: 'r1',
      roleName: 'Contractor',
      dataLevel: 'SELF',
      departmentId: null,
      jobPositionId: null,
      companyId: null,
    };

    const ok = service.canAccessRecord(ctx, 'WorkPermit', {
      createdBy: 'internal-1',
      applicantUserId: 'applicant-1',
      creator: { departmentId: null },
    });
    expect(ok).toBe(true);
  });
});

