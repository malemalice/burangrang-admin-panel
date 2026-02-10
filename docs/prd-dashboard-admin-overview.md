# PRD: Dashboard Admin Overview

**Document Version:** 1.0  
**Last Updated:** February 8, 2025  
**Related Modules:** LMS (Courses, Enrollments, Quizzes), Certificates, PPE, Work Permits, Environmental Measurements, Waste Management, Man Hours

---

## Overview

This document describes the **Admin Overview Dashboard**: an executive-level dashboard that surfaces critical metrics from modules outside the four core HSE modules (Risk Assessment, Incident, Inspection, Audit). It provides a single view for admins and superusers to monitor compliance, bottlenecks, and operational health across training, certificates, PPE, work permits, environmental monitoring, waste management, and workforce exposure.

**Current State:** All metrics use **mocked data** returned from the frontend service. No backend API exists yet. The dashboard is designed to support future integration with real data from the respective modules.

**Target Audience:** Admins, superusers, and executive stakeholders who need a high-level overview of non-core module health.

---

## Dashboard Layout

The dashboard is organized into **7 module sections**, each with **3 metric cards** in a responsive grid (1 column on mobile, 3 columns on desktop):

1. **Learning Management** – Overdue enrollments, course completion rate, quiz pass rate
2. **Certificates** – Expiring in 30 days, renewal backlog, categories count
3. **PPE & Equipment** – Low stock/expiring, withdrawals pending, top equipment by withdrawal
4. **Work Permits** – Pending approval, active permits, rejection rate
5. **Environmental Measurements** – Rooms not measured, coverage %, readings recorded
6. **Waste Management** – Reports pending review, missing reports, total waste weight
7. **Man Hours** – Total man-hours, student vs non-student split, YoY change

**Route:** `/dashboard/admin-overview`

---

## Data Shape

```typescript
interface AdminOverviewData {
  lms: {
    overdueEnrollments: number;
    totalEnrollments: number;
    courseCompletionRate: number;
    quizPassRate: number;
  };
  certificates: {
    expiringIn30Days: number;
    totalActive: number;
    renewalBacklog: number;
    categoriesCount: number;
  };
  ppe: {
    lowStockItems: number;
    expiringItems: number;
    withdrawalsPending: number;
    topEquipmentByWithdrawal: string;
  };
  workPermits: {
    pendingApproval: number;
    totalActive: number;
    activePermits: number;
    rejectionRate: number;
  };
  environmental: {
    roomsNotMeasured: number;
    totalRooms: number;
    coveragePercent: number;
    avgReadingsRecorded: number;
  };
  wasteManagement: {
    reportsPendingReview: number;
    totalReports: number;
    missingReports: number;
    totalWasteWeightKg: number;
  };
  manHours: {
    totalManHours: number;
    currentPeriod: string;
    studentManHours: number;
    nonStudentManHours: number;
    yoyChangePercent: number;
  };
}
```

---

## Metrics and Schema Mapping

### 1. Learning Management (LMS)

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Overdue Enrollments | Enrollments past `dueDate` with status ≠ COMPLETED | `t_enrollments` WHERE `dueDate < now()` AND `status NOT IN ('COMPLETED', 'CANCELLED', 'EXPIRED')` |
| Course Completion Rate | % of enrollments completed | `COUNT(status='COMPLETED') / COUNT(*) * 100` from `t_enrollments` |
| Quiz Pass Rate | % of quiz attempts passed | `t_quiz_attempts` WHERE `isPassed = true` / total attempts |

**Data Sources:** `t_enrollments`, `t_progress`, `t_quiz_attempts`, `t_quizzes`

---

### 2. Certificates

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Expiring in 30 Days | Certificates with `validityDate` within next 30 days | `t_certificates` WHERE `validityDate BETWEEN now() AND now() + 30 days` AND `isActive = true` |
| Renewal Backlog | Renewals in PENDING, REQUESTED, IN_PROGRESS | `t_certificate_renewals` WHERE `status IN ('PENDING', 'REQUESTED', 'IN_PROGRESS')` |
| Categories Count | Distinct certificate categories (personnel vs equipment) | `COUNT(DISTINCT categoryId)` from `t_certificates` or `m_certificate_categories` |

**Data Sources:** `t_certificates`, `t_certificate_renewals`, `m_certificate_categories`

---

### 3. PPE & Equipment

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Low Stock / Expiring | Items below threshold or expiring within 30 days | `t_ppe_stock_items` WHERE `currentQuantity < threshold` OR `expiryDate <= now() + 30 days` |
| Withdrawals Pending | Withdrawals with status PENDING | `t_ppe_withdrawals` WHERE `status = 'PENDING'` |
| Top Equipment by Withdrawal | Most withdrawn equipment (e.g. "Safety Helmets: 45") | Aggregate `t_ppe_withdrawal_items` JOIN `t_ppe_stock_items` JOIN `m_safety_equipment` |

**Data Sources:** `t_ppe_stock`, `t_ppe_stock_items`, `t_ppe_withdrawals`, `t_ppe_withdrawal_items`, `m_safety_equipment`

---

### 4. Work Permits

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Pending Approval | Permits in WAITING_APPROVAL, IN_REVIEW_HSE, IN_REVIEW_SECURITY | `t_work_permits` WHERE `status IN ('WAITING_APPROVAL', 'IN_REVIEW_HSE', 'IN_REVIEW_SECURITY')` |
| Active Permits | Permits APPROVED and not closed | `t_work_permits` WHERE `status = 'APPROVED'` (or not CLOSED/REJECTED) |
| Rejection Rate | % of permits rejected in period | `COUNT(status='REJECTED') / COUNT(*) * 100` for period |

**Data Sources:** `t_work_permits`

---

### 5. Environmental Measurements

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Rooms Not Measured | Rooms with no measurement in last 30 days | `m_rooms` NOT IN (rooms with `t_environmental_measurements` in last 30 days) |
| Coverage % | % of rooms with recent measurements | `(measured rooms / total rooms) * 100` |
| Readings Recorded | Total measurement records in period | `COUNT(*)` from `t_environmental_measurements` WHERE `date` in period |

**Data Sources:** `t_environmental_measurements`, `m_rooms`, `m_areas`

---

### 6. Waste Management

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Reports Pending Review | Flow, water quality, weight reports in SUBMITTED or UNDER_REVIEW | `t_monthly_flow_reports`, `t_water_quality_lab_reports`, `t_weight_reports` WHERE `status IN ('SUBMITTED', 'UNDER_REVIEW')` |
| Missing Reports | Reports not submitted for expected period | Compare expected reports (per plant/source/month) vs submitted |
| Total Waste Weight | Sum of waste weight in period | `SUM(t_weight_report_items.weight)` for period |

**Data Sources:** `t_monthly_flow_reports`, `t_water_quality_lab_reports`, `t_weight_reports`, `t_weight_report_items`

---

### 7. Man Hours

| Metric | Description | Schema Mapping (Future) |
|--------|-------------|-------------------------|
| Total Man Hours | Sum of man-hours for period | `SUM(t_man_hours.total)` WHERE `month`, `year` in period |
| Student vs Non-Student | Split by `ManHourGroupEnum` | `SUM(total)` WHERE `group = 'STUDENT'` vs `group = 'NON_STUDENT'` |
| YoY Change % | Year-over-year change in total man-hours | `(current - previous) / previous * 100` |

**Data Sources:** `t_man_hours`

---

## UI/UX Behavior

### Color Coding (Warning Metrics)

Metrics that require attention use semantic colors:

- **Critical (Red):** Value > 10
- **Warning (Amber):** Value 1–10
- **Good (Green):** Value = 0

Applied to: Overdue Enrollments, Certificates Expiring, PPE Low Stock/Expiring, Withdrawals Pending, Permits Pending Approval, Rooms Not Measured, Reports Pending Review, Missing Reports.

### Informational Metrics

Metrics such as Total Man Hours, Course Completion Rate, Quiz Pass Rate, and YoY Change use neutral styling (no warning colors).

### Responsive Layout

- **Mobile (sm):** 1 column per section
- **Tablet/Desktop (md+):** 3 columns per section

---

## Filter Parameters

**Current:** No period filter. All data is point-in-time or uses a fixed "current period" in mock data.

**Future Consideration:** Add optional `periodFrom` and `periodTo` (YYYY-MM) for:
- Man Hours (month/year filter)
- Environmental (date range for readings)
- Waste Management (report period)
- Work Permits (submission/approval date range)

---

## Implementation Notes

### Frontend

- **Module:** `frontend/src/modules/admin-overview/`
- **Page:** `AdminOverviewPage.tsx`
- **Service:** `adminOverviewService.ts` (returns mocked data with 500ms delay)
- **Types:** `admin-overview.types.ts`

### Backend (Future)

**Proposed Endpoint:** `GET /dashboard/admin-overview`

**Query Parameters (optional):**
- `periodFrom` (YYYY-MM)
- `periodTo` (YYYY-MM)

**Permissions:** `dashboard:admin-overview:read` or equivalent admin/superuser role.

**Response:** Single `AdminOverviewData` object.

### Data Aggregation Strategy

**Recommended:** Single endpoint that:
1. Runs parallel queries for each module's metrics
2. Aggregates results into one response
3. Respects data scope where applicable (e.g., certificates, PPE withdrawals)
4. Uses efficient aggregation (GROUP BY, COUNT, SUM) per metric

### Implementation Status

| Module | Data Source | Status |
|--------|-------------|--------|
| Learning Management | Mock | Pending |
| Certificates | Mock | Pending |
| PPE & Equipment | Mock | Pending |
| Work Permits | Mock | Pending |
| Environmental Measurements | Mock | Pending |
| Waste Management | Mock | Pending |
| Man Hours | Mock | Pending |

---

## Schema Summary

| Module | Table(s) | Key Fields |
|--------|----------|------------|
| LMS | t_enrollments, t_progress, t_quiz_attempts | dueDate, status, isPassed |
| Certificates | t_certificates, t_certificate_renewals | validityDate, status, categoryId |
| PPE | t_ppe_stock_items, t_ppe_withdrawals, t_ppe_withdrawal_items | currentQuantity, expiryDate, status |
| Work Permits | t_work_permits | status |
| Environmental | t_environmental_measurements, m_rooms | date, roomId |
| Waste | t_monthly_flow_reports, t_water_quality_lab_reports, t_weight_reports, t_weight_report_items | status, reportMonth, reportYear, weight |
| Man Hours | t_man_hours | month, year, total, group |

---

## Related Documents

- `backend/erd.md` – Entity relationship documentation
- `backend/prisma/schema.prisma` – Database schema
- `frontend/src/modules/admin-overview/` – Admin Overview module
- `docs/prd-learning-management.md` – LMS PRD
- `docs/prd-certificates.md` – Certificate Management PRD
- `docs/prd-ppe.md` – PPE module PRD
- `docs/prd-work-permits.md` – Work Permits PRD
- `docs/prd-environmental-measurements.md` – Environmental Measurements PRD
- `docs/prd-waste-management.md` – Waste Management PRD
- `docs/prd-man-hours.md` – Man Hours PRD
- `docs/dashboard-hazard-analytic.md` – Hazard Analytics dashboard (similar pattern)
- `docs/dashboard-security-team.md` – Security Team dashboard (similar pattern)
