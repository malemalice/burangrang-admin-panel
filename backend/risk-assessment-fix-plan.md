# Risk Assessment Schema Fix Implementation Plan

## Overview
This document outlines the implementation plan to align the Prisma schema with the ERD specification for the risk assessment use case, following TRD guidelines.

**Reference Documents:**
- Comparison: `backend/risk-assessment-comparison.md`
- TRD: `backend/TRD.md`
- ERD: `backend/erd-pre.md`
- Current Schema: `backend/prisma/schema.prisma`

---

## Implementation Phases

### Phase 1: Prisma Schema Updates

#### 1.1 Add RiskControl Model

**Priority:** HIGH  
**Estimated Time:** 30 minutes

**Action:**
Add new `RiskControl` model to `backend/prisma/schema.prisma` following the ERD specification.

**Location:** After `ThreatMitigation` model (around line 249)

```prisma
model RiskControl {
  id                String   @id @default(uuid())
  eliminate         String?  @db.Text
  transfer          String?  @db.Text
  reduce            String?  @db.Text
  isOpen            Boolean  @default(true)
  isAccept          Boolean  @default(false)
  isActive          Boolean  @default(true)
  entity            String   // Polymorphic: table name (e.g., "t_risk_assessment_item", "t_inspections")
  entityId          String   // Polymorphic: row id
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt

  @@map("t_risk_control")
  @@index([entity, entityId])
  @@index([isActive])
}
```

**Notes:**
- Polymorphic relationship via `entity` (table name) and `entityId` (row id)
- Supports both `t_risk_assessment_item` and `t_inspections` entities
- Index on `(entity, entityId)` for efficient lookups

---

#### 1.2 Update RiskAssessmentItem Model

**Priority:** HIGH  
**Estimated Time:** 15 minutes

**Action:**
Add missing fields to `RiskAssessmentItem` model.

**Location:** `backend/prisma/schema.prisma` lines 287-300

**Changes:**
```prisma
model RiskAssessmentItem {
  id                  String         @id @default(uuid())
  riskAssessmentId    String
  riskAssessment      RiskAssessment @relation(fields: [riskAssessmentId], references: [id])
  mThreatId           String
  mThreat             Threat         @relation(fields: [mThreatId], references: [id])
  mHseCategoryId      String
  mHseCategory        HseCategory    @relation(fields: [mHseCategoryId], references: [id])
  
  // Initial risk assessment (pre-mitigation)
  riskDescription     String         @db.Text  // ✅ ADD THIS
  likelihoodLevel     Int
  consequenceLevel    Int
  riskMatrixRating    RiskRatingEnum
  interpretation      RiskRatingEnum  // ✅ ADD THIS
  
  // Post-mitigation risk assessment
  postLikelihoodLevel Int             // ✅ ADD THIS
  postConsequenceLevel Int            // ✅ ADD THIS
  postRiskMatrixRating RiskRatingEnum // ✅ ADD THIS
  postInterpretation   RiskRatingEnum // ✅ ADD THIS

  @@map("t_risk_assessment_item")
}
```

**Breaking Changes:**
- All new fields are required (not nullable) according to ERD
- Existing data migration required - need default values or backfill strategy

---

#### 1.3 Fix RiskAssessment.createdBy Relation

**Priority:** MEDIUM  
**Estimated Time:** 10 minutes

**Action:**
Add User relation to `RiskAssessment.createdBy` field.

**Location:** `backend/prisma/schema.prisma` lines 267-285

**Changes:**
```prisma
model RiskAssessment {
  id             String               @id @default(uuid())
  code           String               @unique
  description    String?              @db.Text
  departmentId   String
  department     Department           @relation(fields: [departmentId], references: [id])
  assessmentDate DateTime             @default(now())
  createdAt      DateTime             @default(now())
  updatedAt      DateTime             @updatedAt
  createdBy      String
  creator        User                 @relation("RiskAssessmentCreator", fields: [createdBy], references: [id]) // ✅ ADD THIS
  status         GeneralStatusEnum    // ✅ CHANGE FROM String
  isActive       Boolean              @default(true)
  items          RiskAssessmentItem[]
  assigneeId     String?
  assignee       User?                @relation(fields: [assigneeId], references: [id])
  actionPlan     String?              @db.Text

  @@map("t_risk_assessment")
}
```

**Also update User model** (around line 31):
```prisma
model User {
  // ... existing fields ...
  riskAssessments              RiskAssessment[]
  riskAssessmentsCreated       RiskAssessment[]  @relation("RiskAssessmentCreator") // ✅ ADD THIS
  // ... rest of fields ...
}
```

---

#### 1.4 Update RiskAssessment.status Type

**Priority:** MEDIUM  
**Estimated Time:** 5 minutes

**Action:**
Change `RiskAssessment.status` from `String` to `GeneralStatusEnum`.

**Location:** Already included in section 1.3 above.

**Note:**
- `GeneralStatusEnum` already exists in schema (line 1612)
- Values: `SCHEDULED`, `DRAFT`, `OPEN`, `WAITING_APPROVAL`, `DONE`, `REJECTED`

---

### Phase 2: Database Migration

#### 2.1 Generate Migration

**Priority:** HIGH  
**Estimated Time:** 15 minutes

**Actions:**
1. Review schema changes
2. Generate migration: `npx prisma migrate dev --name add_risk_assessment_fields`
3. Review generated SQL migration file
4. Check for data migration needs (default values for new required fields)

**Migration Considerations:**
- `RiskAssessmentItem` new fields are required - need migration strategy:
  - Option A: Add fields as nullable first, backfill data, then make required
  - Option B: Provide default values during migration
  - Option C: Use `@default()` in Prisma schema (if applicable)

**Recommended Approach:**
```sql
-- Step 1: Add nullable fields
ALTER TABLE t_risk_assessment_item 
  ADD COLUMN risk_description TEXT,
  ADD COLUMN interpretation "RiskRatingEnum",
  ADD COLUMN post_likelihood_level INTEGER,
  ADD COLUMN post_consequence_level INTEGER,
  ADD COLUMN post_risk_matrix_rating "RiskRatingEnum",
  ADD COLUMN post_interpretation "RiskRatingEnum";

-- Step 2: Backfill with default values (example)
UPDATE t_risk_assessment_item 
SET 
  risk_description = '',
  interpretation = 'LOW',
  post_likelihood_level = likelihood_level,
  post_consequence_level = consequence_level,
  post_risk_matrix_rating = risk_matrix_rating,
  post_interpretation = interpretation
WHERE risk_description IS NULL;

-- Step 3: Make fields NOT NULL
ALTER TABLE t_risk_assessment_item
  ALTER COLUMN risk_description SET NOT NULL,
  ALTER COLUMN interpretation SET NOT NULL,
  -- ... etc
```

---

### Phase 3: Backend Code Updates

#### 3.1 Update DTOs

**Priority:** HIGH  
**Estimated Time:** 45 minutes

**Files to Update:**

##### 3.1.1 RiskAssessmentItemDto
**Location:** `backend/src/modules/risk-assessment/dto/risk-assessment-item.dto.ts`

**Add fields:**
```typescript
@ApiProperty()
@Expose()
@IsString()
@IsNotEmpty()
riskDescription: string;

@ApiProperty({ enum: RiskRatingEnum })
@Expose()
@IsEnum(RiskRatingEnum)
interpretation: RiskRatingEnum;

@ApiProperty()
@Expose()
@IsInt()
postLikelihoodLevel: number;

@ApiProperty()
@Expose()
@IsInt()
postConsequenceLevel: number;

@ApiProperty({ enum: RiskRatingEnum })
@Expose()
@IsEnum(RiskRatingEnum)
postRiskMatrixRating: RiskRatingEnum;

@ApiProperty({ enum: RiskRatingEnum })
@Expose()
@IsEnum(RiskRatingEnum)
postInterpretation: RiskRatingEnum;
```

##### 3.1.2 CreateRiskAssessmentItemDto
**Location:** `backend/src/modules/risk-assessment/dto/create-risk-assessment-item.dto.ts`

**Add validation:**
- All new fields should be required
- Use `@IsString()`, `@IsInt()`, `@IsEnum()` decorators
- Add `@ApiProperty()` for Swagger documentation

##### 3.1.3 RiskAssessmentDto
**Location:** `backend/src/modules/risk-assessment/dto/risk-assessment.dto.ts`

**Updates:**
- Change `status` type from `string` to `GeneralStatusEnum`
- Add `creator` relation field (UserDto)
- Ensure `createdBy` field is still exposed if needed

##### 3.1.4 Create RiskControl DTOs
**Location:** `backend/src/modules/risk-assessment/dto/`

**Create new files:**
- `risk-control.dto.ts` - Response DTO with `@Expose()` decorators
- `create-risk-control.dto.ts` - Input DTO with validation
- `update-risk-control.dto.ts` - Update DTO extending PartialType

**Follow TRD DTO patterns:**
- Use `@ApiProperty()` for Swagger
- Use `class-validator` decorators
- Constructor with `Object.assign(this, partial)`

---

#### 3.2 Update Service Layer

**Priority:** HIGH  
**Estimated Time:** 60 minutes

**File:** `backend/src/modules/risk-assessment/services/risk-assessment.service.ts`

**Updates Required:**

##### 3.2.1 Update DTO Mappers
- Update `RiskAssessmentItemDto` mapper to include new fields
- Update `RiskAssessmentDto` mapper to include creator relation
- Ensure proper mapping for post-mitigation fields

##### 3.2.2 Update CRUD Methods
- `create()`: Handle new RiskAssessmentItem fields
- `update()`: Handle updates to post-mitigation fields
- `findOne()`: Include creator relation in query

##### 3.2.3 Add RiskControl Methods (if needed)
```typescript
async createRiskControl(createDto: CreateRiskControlDto): Promise<RiskControlDto>
async findRiskControlsByEntity(entity: string, entityId: string): Promise<RiskControlDto[]>
async updateRiskControl(id: string, updateDto: UpdateRiskControlDto): Promise<RiskControlDto>
async deleteRiskControl(id: string): Promise<void>
```

**Follow TRD Service Patterns:**
- Use `ErrorHandlingService.throwIfNotFoundById()`
- Use `DtoMapperService` for entity-to-DTO transformation
- Proper error handling with try-catch and error handler

---

#### 3.3 Update Controller

**Priority:** MEDIUM  
**Estimated Time:** 30 minutes

**File:** `backend/src/modules/risk-assessment/controllers/risk-assessment.controller.ts`

**Updates:**
- Update existing endpoints to handle new DTOs
- Add RiskControl endpoints if needed:
  - `GET /risk-assessments/:assessmentId/items/:itemId/controls` - List risk controls
  - `POST /risk-assessments/:assessmentId/items/:itemId/controls` - Create risk control
  - `PATCH /risk-assessments/:assessmentId/items/:itemId/controls/:id` - Update risk control
  - `DELETE /risk-assessments/:assessmentId/items/:itemId/controls/:id` - Delete risk control

**Follow TRD Controller Patterns:**
- Use `@ApiTags()`, `@ApiBearerAuth()`
- Use `@UseGuards(JwtAuthGuard, RolesGuard)`
- Add `@Roles()` decorators
- Complete Swagger documentation with `@ApiOperation()`, `@ApiResponse()`

---

### Phase 4: Frontend Updates

#### 4.1 Update TypeScript Types

**Priority:** MEDIUM  
**Estimated Time:** 30 minutes

**File:** `frontend/src/core/lib/types.ts`

**Update interfaces:**

```typescript
export interface RiskAssessmentItem {
  id: string;
  riskAssessmentId: string;
  mThreatId: string;
  mHseCategoryId: string;
  
  // Pre-mitigation fields
  riskDescription: string;        // ✅ ADD
  likelihoodLevel: number;
  consequenceLevel: number;
  riskMatrixRating: RiskRatingEnum;
  interpretation: RiskRatingEnum;  // ✅ ADD
  
  // Post-mitigation fields
  postLikelihoodLevel: number;     // ✅ ADD
  postConsequenceLevel: number;    // ✅ ADD
  postRiskMatrixRating: RiskRatingEnum; // ✅ ADD
  postInterpretation: RiskRatingEnum;   // ✅ ADD
  
  // Relations
  mThreat?: Threat;
  mHseCategory?: HseCategory;
  riskAssessment?: RiskAssessment;
}

export interface RiskAssessment {
  // ... existing fields ...
  status: GeneralStatusEnum;  // ✅ CHANGE from string
  creator?: User;             // ✅ ADD
  createdBy: string;
  // ... rest of fields ...
}

// ✅ ADD NEW INTERFACE
export interface RiskControl {
  id: string;
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  isOpen: boolean;
  isAccept: boolean;
  isActive: boolean;
  entity: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
}
```

---

### Phase 5: Testing & Validation

#### 5.1 Unit Tests

**Priority:** HIGH  
**Estimated Time:** 90 minutes

**Test Coverage:**
- Service methods with new fields
- DTO validation
- RiskControl CRUD operations
- Post-mitigation risk calculation logic

---

#### 5.2 Integration Tests

**Priority:** HIGH  
**Estimated Time:** 60 minutes

**Test Scenarios:**
1. Create risk assessment with new fields
2. Update risk assessment item with post-mitigation fields
3. Create/update/delete risk controls
4. Verify creator relation in responses
5. Verify status enum validation

---

#### 5.3 API Testing

**Priority:** MEDIUM  
**Estimated Time:** 30 minutes

**Manual Testing:**
- Test all endpoints with Swagger UI
- Verify DTOs match schema
- Test error handling
- Verify role-based access control

---

## Implementation Checklist

### Prisma Schema ✅
- [ ] Add RiskControl model
- [ ] Update RiskAssessmentItem with new fields
- [ ] Fix RiskAssessment.createdBy relation
- [ ] Change RiskAssessment.status to GeneralStatusEnum
- [ ] Update User model with RiskAssessmentCreator relation

### Database Migration ✅
- [ ] Review schema changes
- [ ] Generate migration file
- [ ] Plan data migration strategy
- [ ] Test migration on dev database
- [ ] Document migration steps

### Backend DTOs ✅
- [ ] Update RiskAssessmentItemDto
- [ ] Update CreateRiskAssessmentItemDto
- [ ] Update RiskAssessmentDto
- [ ] Create RiskControlDto
- [ ] Create CreateRiskControlDto
- [ ] Create UpdateRiskControlDto

### Backend Service ✅
- [ ] Update DTO mappers
- [ ] Update CRUD methods
- [ ] Add RiskControl service methods
- [ ] Add error handling
- [ ] Update tests

### Backend Controller ✅
- [ ] Update existing endpoints
- [ ] Add RiskControl endpoints (if needed)
- [ ] Add Swagger documentation
- [ ] Add role guards
- [ ] Test endpoints

### Frontend Types ✅
- [ ] Update RiskAssessmentItem interface
- [ ] Update RiskAssessment interface
- [ ] Add RiskControl interface
- [ ] Update type exports

### Testing ✅
- [ ] Unit tests
- [ ] Integration tests
- [ ] API manual testing
- [ ] Frontend integration testing

---

## Risk Mitigation

### Breaking Changes

1. **RiskAssessmentItem new required fields**
   - **Risk:** Existing data won't have values
   - **Mitigation:** Migration strategy with default values

2. **RiskAssessment.status type change**
   - **Risk:** Existing status values may not match enum
   - **Mitigation:** Validate all existing status values before migration

3. **RiskAssessment.createdBy relation**
   - **Risk:** Existing createdBy values must be valid user IDs
   - **Mitigation:** Add foreign key constraint after data validation

### Data Migration Strategy

1. **Phase 1:** Add nullable columns
2. **Phase 2:** Backfill with appropriate defaults
3. **Phase 3:** Make columns NOT NULL
4. **Phase 4:** Add foreign key constraints

---

## Estimated Timeline

| Phase | Tasks | Estimated Time |
|-------|-------|----------------|
| Phase 1: Schema Updates | 4 tasks | 1 hour |
| Phase 2: Migration | 1 task | 30 minutes |
| Phase 3: Backend Code | 3 tasks | 2.5 hours |
| Phase 4: Frontend | 1 task | 30 minutes |
| Phase 5: Testing | 3 tasks | 3 hours |
| **Total** | **12 tasks** | **~7.5 hours** |

---

## Notes

- Follow TRD patterns consistently throughout implementation
- All DTOs must have proper validation and Swagger documentation
- Service layer must use ErrorHandlingService and DtoMapperService
- Controllers must have proper guards and role restrictions
- Test thoroughly before merging to main branch

---

## References

- **Comparison Document:** `backend/risk-assessment-comparison.md`
- **TRD:** `backend/TRD.md`
- **ERD:** `backend/erd-pre.md`
- **Prisma Schema:** `backend/prisma/schema.prisma`

