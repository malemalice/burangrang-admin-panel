# Risk Assessment Schema Comparison: Prisma vs ERD

## Overview
Comparison between `backend/prisma/schema.prisma` and `backend/erd-pre.md` for the **risk_assessment** use case.

---

## 1. Core Models/Tables

### ✅ `t_risk_assessment` / `RiskAssessment`

**ERD (erd-pre.md lines 524-538):**
```sql
Table t_risk_assessment {
  id varchar [pk, default: `uuid()`]
  code varchar [unique, not null]
  description text
  departmentId varchar [not null, ref: > m_departments.id]
  assessmentDate timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]
  isActive boolean [default: true, not null]
  assigneeId varchar [ref: > t_users.id]
  status GeneralStatusEnum [not null]
  Note: 'Risk assessment records'
}
```

**Prisma (schema.prisma lines 267-285):**
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
  createdBy      String                // ⚠️ Missing relation to User
  status         String                // ⚠️ Should be GeneralStatusEnum
  isActive       Boolean              @default(true)
  items          RiskAssessmentItem[]
  assigneeId     String?
  assignee       User?                @relation(fields: [assigneeId], references: [id])
  actionPlan     String?              @db.Text  // ✅ Present in Prisma
}
```

**Differences:**
- ❌ `createdBy` in Prisma lacks relation to `User` (ERD has `ref: > t_users.id`)
- ⚠️ `status` in Prisma is `String` instead of `GeneralStatusEnum`
- ✅ `actionPlan` exists in Prisma but not explicitly shown in ERD table definition

---

### ⚠️ `t_risk_assessment_item` / `RiskAssessmentItem`

**ERD (erd-pre.md lines 540-556):**
```sql
Table t_risk_assessment_item {
  id varchar [pk, default: `uuid()`]
  riskAssessmentId varchar [not null, ref: > t_risk_assessment.id]
  mRiskId varchar [not null, ref: > m_risks.id]              // Note: ERD uses m_risks
  riskDescription text [not null]                            // ❌ MISSING in Prisma
  mHseCategoryId varchar [not null, ref: > m_hse_categories.id]
  likelihoodLevel int [not null]
  consequenceLevel int [not null]
  riskMatrixRating RiskRatingEnum [not null]
  interpretation RiskRatingEnum [not null]                   // ❌ MISSING in Prisma
  postLikelihoodLevel int [not null]                         // ❌ MISSING in Prisma
  postConsequenceLevel int [not null]                        // ❌ MISSING in Prisma
  postRiskMatrixRating RiskRatingEnum [not null]             // ❌ MISSING in Prisma
  postInterpretation RiskRatingEnum [not null]               // ❌ MISSING in Prisma

  Note: 'Individual items within risk assessments - risk controls accessed via polymorphic relation in t_risk_control'
}
```

**Prisma (schema.prisma lines 287-300):**
```prisma
model RiskAssessmentItem {
  id               String         @id @default(uuid())
  riskAssessmentId String
  riskAssessment   RiskAssessment @relation(fields: [riskAssessmentId], references: [id])
  mThreatId        String         // ✅ Uses Threat (maps to m_threats, ERD uses m_risks)
  mThreat          Threat         @relation(fields: [mThreatId], references: [id])
  mHseCategoryId   String
  mHseCategory     HseCategory    @relation(fields: [mHseCategoryId], references: [id])
  likelihoodLevel  Int
  consequenceLevel Int
  riskMatrixRating RiskRatingEnum
  // ❌ Missing: riskDescription
  // ❌ Missing: interpretation
  // ❌ Missing: postLikelihoodLevel
  // ❌ Missing: postConsequenceLevel
  // ❌ Missing: postRiskMatrixRating
  // ❌ Missing: postInterpretation
}
```

**Missing Fields in Prisma:**
1. ❌ `riskDescription` (text, not null) - Description of the risk
2. ❌ `interpretation` (RiskRatingEnum, not null) - Initial risk interpretation
3. ❌ `postLikelihoodLevel` (int, not null) - Likelihood after mitigation
4. ❌ `postConsequenceLevel` (int, not null) - Consequence after mitigation
5. ❌ `postRiskMatrixRating` (RiskRatingEnum, not null) - Risk rating after mitigation
6. ❌ `postInterpretation` (RiskRatingEnum, not null) - Interpretation after mitigation

**Naming Difference:**
- ERD uses `m_risks` / `mRiskId`
- Prisma uses `Threat` / `mThreatId` (maps to `m_threats` table)
- ✅ This is acceptable - Prisma renamed the model but maintains the same relationship

---

### ❌ `t_risk_control` - COMPLETELY MISSING in Prisma

**ERD (erd-pre.md lines 499-513):**
```sql
Table t_risk_control {
  id varchar [pk, default: `uuid()`]
  eliminate text [null]
  transfer text [null]
  reduce text [null]
  isOpen boolean [default: true, not null]
  isAccept boolean [default: false, not null]
  isActive boolean [default: true, not null]
  entity varchar [not null]          // Polymorphic: table name
  entityId varchar [not null]        // Polymorphic: row id
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Mitigation strategies for risks - polymorphic relation to t_inspections and t_risk_assessment_item (entity: table name, entityId: row id)'
}
```

**Prisma:**
- ❌ This model/table is **completely missing** from the Prisma schema

**Impact:**
- Risk mitigation strategies (eliminate, transfer, reduce) cannot be stored
- The polymorphic relationship to both `t_inspections` and `t_risk_assessment_item` is not implemented
- Workflow status (`isOpen`, `isAccept`) for risk controls is missing

---

### ✅ `m_risk_matrix` / `RiskMatrix`

**Both match:**
- `likelihoodLevel` (int)
- `consequenceLevel` (int)
- `risk_rating` / `risk_rating` (RiskRatingEnum)

---

## 2. Related Master Data

### ✅ `m_hse_categories` / `HseCategory`
- **Status:** ✅ Present in both
- **Mapping:** ✅ Correct

### ⚠️ `m_risks` / `Threat`
- **ERD:** `m_risks` table
- **Prisma:** `Threat` model (maps to `m_threats` table)
- **Status:** ✅ Functional - renamed but equivalent
- **Note:** ERD uses `m_risks`, Prisma uses `m_threats` - same concept, different naming

### ✅ `m_departments` / `Department`
- **Status:** ✅ Present in both
- **Relation:** ✅ Correct in Prisma

---

## 3. Summary of Issues

### Critical Missing Components:

1. **❌ `t_risk_control` Table/Model**
   - **Impact:** HIGH - Cannot store risk mitigation strategies
   - **Fields Missing:** eliminate, transfer, reduce, isOpen, isAccept
   - **Relation:** Polymorphic (entity, entityId) to t_risk_assessment_item and t_inspections

2. **❌ Post-Mitigation Fields in `RiskAssessmentItem`**
   - **Impact:** HIGH - Cannot track risk ratings after mitigation
   - **Missing Fields:**
     - `postLikelihoodLevel`
     - `postConsequenceLevel`
     - `postRiskMatrixRating`
     - `postInterpretation`

3. **❌ Additional Fields in `RiskAssessmentItem`**
   - **Impact:** MEDIUM
   - **Missing:**
     - `riskDescription` (text, not null)
     - `interpretation` (RiskRatingEnum, not null)

### Minor Issues:

4. **⚠️ `RiskAssessment.createdBy` Missing Relation**
   - Should have relation to `User` model
   - Currently just `String` without foreign key constraint

5. **⚠️ `RiskAssessment.status` Type**
   - ERD: `GeneralStatusEnum`
   - Prisma: `String`
   - Should be enum for type safety

---

## 4. Recommendations

### High Priority:

1. **Add `RiskControl` model to Prisma:**
   ```prisma
   model RiskControl {
     id                String   @id @default(uuid())
     eliminate         String?  @db.Text
     transfer          String?  @db.Text
     reduce            String?  @db.Text
     isOpen            Boolean  @default(true)
     isAccept          Boolean  @default(false)
     isActive          Boolean  @default(true)
     entity            String   // Polymorphic: table name
     entityId          String   // Polymorphic: row id
     createdAt         DateTime @default(now())
     updatedAt         DateTime @updatedAt

     @@map("t_risk_control")
     @@index([entity, entityId])
   }
   ```

2. **Add missing fields to `RiskAssessmentItem`:**
   ```prisma
   model RiskAssessmentItem {
     // ... existing fields ...
     riskDescription      String         @db.Text  // Add this
     interpretation       RiskRatingEnum           // Add this
     postLikelihoodLevel  Int                      // Add this
     postConsequenceLevel Int                      // Add this
     postRiskMatrixRating RiskRatingEnum           // Add this
     postInterpretation   RiskRatingEnum           // Add this
   }
   ```

3. **Fix `RiskAssessment.createdBy` relation:**
   ```prisma
   model RiskAssessment {
     // ... existing fields ...
     createdBy     String
     creator       User   @relation("RiskAssessmentCreator", fields: [createdBy], references: [id])
   }
   ```

4. **Add `status` enum (if GeneralStatusEnum exists):**
   ```prisma
   enum GeneralStatusEnum {
     SCHEDULED
     DRAFT
     OPEN
     WAITING_APPROVAL
     DONE
     REJECTED
   }

   model RiskAssessment {
     // ... existing fields ...
     status GeneralStatusEnum  // Change from String
   }
   ```

---

## 5. Data Flow Considerations

### Current State (Prisma):
- Risk assessment items store **initial** risk ratings only
- No way to track **residual risk** after mitigation
- No mitigation strategy storage

### Expected State (ERD):
- Risk assessment items have **pre-mitigation** and **post-mitigation** ratings
- Mitigation strategies stored in `t_risk_control` via polymorphic relation
- Can track risk reduction effectiveness

---

## Conclusion

The Prisma schema is **missing critical functionality** for risk assessment workflows:
- ❌ Cannot store post-mitigation risk ratings
- ❌ Cannot store mitigation strategies (eliminate, transfer, reduce)
- ⚠️ Missing some descriptive fields

The ERD shows a more complete risk management workflow that supports the full risk assessment lifecycle including mitigation planning and residual risk tracking.

