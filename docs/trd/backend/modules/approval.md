> [← Modules Index](./index.md) · [← Backend TRD Index](../index.md)
>
> *Master Approval workflow engine: sentinel values (`@ENTITY_DEPARTMENT`/`@ENTITY_JOB_POSITION`), sequential steps by department + job position, `t_approvals` write rules, and the module integration recipe (work-permits example).*

## Approval Module

### Overview
Multi-level sequential approval workflow system using template-based configuration. Supports department + job position matching for authorization.

### Database Schema

**Master Data:**
- `m_approval` - Workflow templates (entity, isActive)
- `m_approval_item` - Sequential steps (order, jobPositionId, departmentId)

**Transactional:**
- `t_approvals` - Approval records (mApprovalId, entityId, status, notes, createdBy)

### Key Features
- Template-based workflows per entity type
- Sequential approval steps (order 0, 1, 2...)
- Department + Job Position matching for authorization
- **Dynamic field resolution** via sentinel values for entity-based approvals
- Status flow: PENDING → WAITING_APPROVAL → COMPLETED/REJECTED
- Complete approval history tracking
- Automatic source entity status updates

### Dynamic Approval Options Principles

**Sentinel Values Approach**: Use special string constants (`@ENTITY_DEPARTMENT`, `@ENTITY_JOB_POSITION`) instead of fixed IDs to enable dynamic field resolution from entity data at approval creation time.

**Core Principles**:
1. **Sentinel Values**: Store sentinel strings in `m_approval_item.departmentId`/`jobPositionId` to indicate dynamic lookup
2. **Resolution at Creation**: Resolve sentinel values to actual UUIDs when creating `t_approvals` records (never store sentinels in transactional data)
3. **Backward Compatibility**: Fixed UUIDs continue to work unchanged; sentinel detection via `isApprovalFieldMarker()`
4. **Schema Handling**: Foreign key constraints removed from `m_approval_item` (via migration) to allow sentinel storage; `t_approvals` keeps constraints
5. **Relation Loading**: Load `department`/`jobPosition` relations separately, skip when sentinel detected, use display labels ("Dynamic: From Entity Data")
6. **Entity Resolution**: `ApprovalResolverService.getEntityData()` reads entity `departmentId`; `findDepartmentHead()` resolves job position via department head lookup

**Implementation**:
- Constants: `APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT`, `FROM_ENTITY_JOB_POSITION`
- Service: `ApprovalResolverService.resolveApprovalItem()` - resolves sentinels before creating approval records
- Usage: Master approval items can mix fixed IDs and sentinels (e.g., first step dynamic, second step fixed)

### Approval Record Creation Principles

**Separation of Workflow Definition and Execution Records**:
- **`m_approvals` / `m_approval_item`**: Define the approval workflow configuration (source of truth for pending/current lines)
- **`t_approvals`**: Record actual approval actions taken by approvers (execution history)

**Core Principles**:

1. **`t_approvals` Records Only After Approver Action**:
   - `t_approvals` should **ONLY** contain records AFTER an approver takes action (approves/rejects)
   - `t_approvals` should **NOT** be created when status changes to `WAITING_APPROVAL`
   - Records are created via `POST /master-approvals/approval` when approver submits their decision

2. **Workflow Definition vs. Execution**:
   - `m_approvals` defines the workflow (shown via `allApprovalLines` in API responses)
   - `t_approvals` records the execution history (shown via `history` in API responses)
   - These serve different purposes and should not duplicate each other

3. **Status Change to WAITING_APPROVAL**:
   - When entity status changes to `WAITING_APPROVAL`, do **NOT** call `createApproval()` service
   - The workflow is already defined in `m_approvals` and shown via `allApprovalLines`
   - Creating `t_approvals` records at this point causes duplication in the approval timeline

4. **Avoiding Duplication**:
   - The API response from `GET /master-approvals/check-approval-status/:dataId` includes:
     - `history[]`: Actual approval actions from `t_approvals` (after approvers act)
     - `allApprovalLines[]`: Workflow configuration from `m_approvals` (pending/current lines)
   - Frontend should render both separately, avoiding duplication by checking if a specific department/job position combination already exists in history before showing from `allApprovalLines`

**Implementation Guidelines**:
- **DO NOT** create `t_approvals` records when entity status changes to `WAITING_APPROVAL`
- **DO** create `t_approvals` records when approver submits via `POST /master-approvals/approval`
- **DO** rely on `m_approvals` configuration for showing pending/current approval lines
- **DO** use `t_approvals` records for showing completed approval history

### Module Structure
```
backend/src/modules/approvals/
├── dto/
│   ├── master-approval.dto.ts
│   ├── create-master-approval.dto.ts
│   ├── update-master-approval.dto.ts
│   └── submit-approval.dto.ts
├── master-approvals.controller.ts
├── master-approvals.service.ts
└── master-approvals.module.ts
```

### API Endpoints

**Template Management:**
- `POST /master-approvals` - Create template (SUPER_ADMIN, ADMIN)
- `GET /master-approvals` - List templates (SUPER_ADMIN, ADMIN, MANAGER)
- `GET /master-approvals/:id` - Get template
- `PATCH /master-approvals/:id` - Update template (SUPER_ADMIN, ADMIN)
- `DELETE /master-approvals/:id` - Delete template (SUPER_ADMIN, ADMIN)

**Approval Operations:**
- `GET /master-approvals/check-approval-status/:dataId` - Get status & history
- `GET /master-approvals/check-approval/:dataId` - Check if user can approve
- `POST /master-approvals/approval` - Submit approval/rejection

### Workflow Logic

**Status Determination:**
1. No approvals → PENDING, nextApprover = items[0]
2. Last approval APPROVED → Check if more steps exist
   - More steps → WAITING_APPROVAL, nextApprover = items[nextIndex]
   - No more steps → COMPLETED, nextApprover = null
3. Last approval REJECTED → REJECTED, nextApprover = null

**Authorization:**
```typescript
canApprove = 
  user.departmentId === nextApprover.departmentId &&
  user.jobPositionId === nextApprover.jobPositionId
```

**Source Entity Update:**
- Resolves the source table from `APPROVAL_ENTITY_TO_TABLE` in `backend/src/shared/constants/approval-entities.ts` (not environment variables).
- Updates source entity status via raw SQL: `UPDATE table SET status = ? WHERE id = ?`

### Configuration

**Module Integration:**
- Manual setup required: Create master approval template via API/UI
- Entity name must match exactly (case-sensitive)
- Source entity must have `status` column and `id` (uuid)

### Module Integration Examples

**1. Module Setup (Import MasterApprovalsModule):**
```typescript
// work-permits.module.ts
import { Module } from '@nestjs/common';
import { MasterApprovalsModule } from '../approvals/master-approvals.module';

@Module({
  imports: [PrismaModule, SharedModule, MasterApprovalsModule],
  // ...
})
export class WorkPermitsModule {}
```

**2. Service Injection:**
```typescript
// work-permits.service.ts
import { MasterApprovalsService } from '../approvals/master-approvals.service';
import { ApprovalStatus } from '../approvals/dto/submit-approval.dto';

@Injectable()
export class WorkPermitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly masterApprovalsService: MasterApprovalsService,
    // ...
  ) {}
}
```

**3. Approve Method Implementation:**
```typescript
async approve(id: string, approveDto: ApproveDto, userId: string) {
  // 1. Get entity and validate
  const entity = await this.prisma.workPermit.findUnique({ where: { id } });
  this.errorHandler.throwIfNotFoundById('WorkPermit', id, entity);

  // 2. Get user with department/jobPosition
  const userRecord = await this.prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  // 3. Convert to User type expected by MasterApprovalsService
  const user: any = {
    id: userRecord.id,
    departmentId: userRecord.departmentId,
    jobPositionId: userRecord.jobPositionId,
    // ... other required fields
  };

  // 4. Update entity status
  const updated = await this.prisma.workPermit.update({
    where: { id },
    data: { status: 'APPROVED' },
  });

  // 5. Submit approval record
  await this.masterApprovalsService.submitApproval(
    {
      entity: 'WORK_PERMIT', // Must match master approval entity name
      dataId: id,
      status: ApprovalStatus.APPROVED,
      notes: approveDto.notes || '',
    },
    user,
  );

  return updated;
}
```

**4. Reject Method Implementation:**
```typescript
async reject(id: string, rejectDto: RejectDto, userId: string) {
  const entity = await this.prisma.workPermit.findUnique({ where: { id } });
  this.errorHandler.throwIfNotFoundById('WorkPermit', id, entity);

  const updated = await this.prisma.workPermit.update({
    where: { id },
    data: { status: 'REJECTED' },
  });

  const userRecord = await this.prisma.user.findUnique({ where: { id: userId } });
  const user: any = {
    id: userRecord.id,
    departmentId: userRecord.departmentId,
    jobPositionId: userRecord.jobPositionId,
    // ... other fields
  };

  // Submit rejection record
  await this.masterApprovalsService.submitApproval(
    {
      entity: 'WORK_PERMIT',
      dataId: id,
      status: ApprovalStatus.REJECTED,
      notes: rejectDto.reason,
    },
    user,
  );

  return updated;
}
```

**5. Check Approval Status (Frontend/API):**
```typescript
// In controller or service
async getApprovalStatus(entityId: string) {
  return this.masterApprovalsService.checkApprovalStatus(
    entityId,
    'WORK_PERMIT', // Entity name
  );
}

// Returns:
// {
//   history: [...],
//   nextApprover: { department: {...}, jobPosition: {...} },
//   currentStatus: "WAITING_APPROVAL"
// }
```

**6. Check User Approval Rights:**
```typescript
async canUserApprove(entityId: string, user: User) {
  return this.masterApprovalsService.checkApprovalRights(
    entityId,
    user,
    'WORK_PERMIT',
  );
  // Returns: { canApprove: boolean }
}
```

### Usage Example

**Create Template:**
```json
POST /master-approvals
{
  "entity": "RiskAssessment",
  "isActive": true,
  "items": [
    {"order": 0, "jobPositionId": "uuid", "departmentId": "uuid"},
    {"order": 1, "jobPositionId": "uuid", "departmentId": "uuid"}
  ]
}
```

**Submit Approval:**
```json
POST /master-approvals/approval
{
  "dataId": "entity-uuid",
  "entity": "RiskAssessment",
  "status": "APPROVED", // or "REJECTED"
  "notes": "Approval comments"
}
```

### Entity Name Mapping

**Constants File:** `backend/src/shared/constants/approval-entities.ts`
- Central registry: `APPROVAL_ENTITIES` object
- Type-safe entity names
- Helper function: `getApprovalEntityName(moduleName)`

**Module Pattern:**
```typescript
// Each module exports its entity constant
import { APPROVAL_ENTITIES } from '../../shared/constants/approval-entities';
export const MODULE_NAME_APPROVAL_ENTITY = APPROVAL_ENTITIES.ENTITY_NAME;
```

**Usage:**
- Import constant from module: `import { RISK_ASSESSMENT_APPROVAL_ENTITY } from './risk-assessment.module'`
- Use in service methods: `entity: RISK_ASSESSMENT_APPROVAL_ENTITY`
- API endpoints accept `?entity=EntityName` query parameter

**Current Entities:**
- `RISK_ASSESSMENT` → 'RiskAssessment'
- `WORK_PERMIT` → 'WORK_PERMIT'

### Known Limitations
- Raw SQL for source entity updates (should use Prisma)
- Sequential only (no parallel approvals)
- No delegation or SLA tracking

### TRD Compliance
- ✅ Standard module structure with DTOs, controller, service
- ✅ Complete Swagger documentation
- ✅ ErrorHandlingService usage
- ✅ Role-based access control
- ✅ DTO validation and serialization
