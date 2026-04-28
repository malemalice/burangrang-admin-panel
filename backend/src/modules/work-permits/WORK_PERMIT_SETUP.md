# Work Permit Module Setup Guide

## Overview
This document provides setup instructions for the Work Permit module, including approval workflow configuration and notification setup.

## Approval Workflow Configuration

The Work Permit module uses the Master Approval system for multi-level approval workflows. To configure the approval workflow:

### Step 1: Create Master Approval for WORK_PERMIT

Create a master approval configuration through the admin UI or API:

**Endpoint:** `POST /master-approvals`

**Request Body:**
```json
{
  "entity": "WORK_PERMIT",
  "isActive": true,
  "items": [
    {
      "order": 1,
      "jobPositionId": "<HSE_MANAGER_JOB_POSITION_ID>",
      "departmentId": "<HSE_DEPARTMENT_ID>"
    },
    {
      "order": 2,
      "jobPositionId": "<SECURITY_HEAD_JOB_POSITION_ID>",
      "departmentId": "<SECURITY_DEPARTMENT_ID>"
    }
  ]
}
```

### Step 2: Configure Approval Entity Mapping

Add the following to your `.env` file:

```env
APPROVAL_ENTITY={"WORK_PERMIT":"t_work_permits"}
```

This maps the entity name to the actual database table name for status updates.

## Notification Types

Notification types for Work Permit events are automatically created when needed, but can also be seeded using:

```bash
npm run seed notification-types
```

The following notification types are available:
- `WORK_PERMIT_SUBMITTED` - When a work permit is submitted for review
- `WORK_PERMIT_APPROVED` - When a work permit is approved
- `WORK_PERMIT_REJECTED` - When a work permit is rejected
- `WORK_PERMIT_EXTENDED` - When a work permit is extended
- `WORK_PERMIT_CLOSED` - When a work permit is closed
- `WORK_PERMIT_EXPIRING_SOON` - Reminder notification (to be implemented)
- `WORK_PERMIT_FORWARDED_TO_SECURITY` - When HSE approves and forwards to Security

## Workflow States

The Work Permit module supports the following statuses:

1. **DRAFT** - Initial state, permit can be edited
2. **WAITING_APPROVAL** - Submitted, waiting for HSE review
3. **IN_REVIEW_HSE** - Under HSE review
4. **IN_REVIEW_SECURITY** - Under Security review
5. **APPROVED** - Approved by both HSE and Security
6. **REJECTED** - Rejected during approval process
7. **CLOSED** - Work completed, permit closed
8. **EXTENDED** - Permit end date extended

## Business Rules

1. **Editing**: Only permits with status `DRAFT` or `REJECTED` can be edited
2. **Submission**: Only `DRAFT` or `REJECTED` permits can be submitted
3. **Approval**: 
   - HSE can approve/reject when status is `WAITING_APPROVAL` or `IN_REVIEW_HSE`
   - Security can approve/reject when status is `IN_REVIEW_SECURITY`
4. **Extension**: Only `APPROVED` permits can be extended
5. **Closure**: Only `APPROVED` or `EXTENDED` permits can be closed

## API Endpoints

### Work Permit CRUD
- `POST /work-permits` - Create work permit
- `GET /work-permits` - List work permits with filters
- `GET /work-permits/:id` - Get work permit details
- `PATCH /work-permits/:id` - Update work permit
- `DELETE /work-permits/:id` - Soft delete work permit

### Workflow Actions
- `POST /work-permits/:id/submit` - Submit for approval
- `POST /work-permits/:id/approve` - Approve (HSE/Security)
- `POST /work-permits/:id/reject` - Reject with reason
- `POST /work-permits/:id/extend` - Extend permit end date
- `POST /work-permits/:id/close` - Close completed permit
- `GET /work-permits/:id/timeline` - Get approval timeline

## Frontend Routes

- `/work-permits` - List page
- `/work-permits/new` - Create page
- `/work-permits/:id` - Detail page
- `/work-permits/:id/edit` - Edit page

## Seeding Test Data

Untuk mengisi database dengan data testing work permit, jalankan:

```bash
# Seed hanya work permit data
npm run prisma:seed work-permits

# Atau menggunakan ts-node langsung
npx ts-node prisma/seed.ts work-permits
```

**Data yang akan dibuat:**

### Master Data
- **8 Work Classifications**: Hot Work, Electrical Work, Confined Space, Height Work, Excavation, Plumbing, Painting, General Maintenance
- **5 Heavy Equipment**: Excavator, Crane, Forklift, Bulldozer, Concrete Mixer
- **5 Tools**: Drill Machine, Welding Machine, Grinder, Hammer, Screwdriver Set
- **5 Materials**: Steel Plate, Concrete, Cement, Paint, Electrical Wire
- **4 Machines**: Generator, Compressor, Water Pump, Cutting Machine
- **3 Companies**: PT Konstruksi Jaya, CV Teknik Mandiri, PT Bangun Sejahtera
- **6 Professions**: Welder, Electrician, Plumber, Crane Operator, Safety Officer, Supervisor
- **5 Areas**: Building A, Building B, Warehouse, Parking Area, Outdoor Area

### Guest Data
- **7 Guests**: 5 workers dan 2 supervisors dengan informasi lengkap

### Sample Work Permits
1. **WP-2025-0001** - Status: DRAFT
   - Project: Maintenance Building A - Electrical System
   - Lengkap dengan classifications, employees, workers, equipment, tools, materials, machines, professions, hazards, supervisors, dan HSE officers

2. **WP-2025-0002** - Status: WAITING_APPROVAL
   - Project: Renovation Building B - Plumbing System
   - Siap untuk testing approval workflow

3. **WP-2025-0003** - Status: APPROVED
   - Project: Painting Warehouse Exterior
   - Untuk testing extension dan closure

4. **WP-2025-0004** - Status: REJECTED
   - Project: Hot Work - Welding Operations
   - Contoh work permit yang ditolak

5. **WP-2025-0005** - Status: CLOSED
   - Project: General Maintenance - Completed
   - Work permit yang sudah selesai

**Catatan:** Seeder ini memerlukan users yang sudah ada di database. Pastikan untuk menjalankan seed users terlebih dahulu jika belum ada.

## Testing Checklist

### Backend API Tests
- [ ] Create work permit (DRAFT)
- [ ] List work permits with filters
- [ ] Get work permit details with all relations
- [ ] Update work permit (DRAFT/REJECTED only)
- [ ] Submit work permit for approval
- [ ] HSE approve work permit
- [ ] HSE reject work permit
- [ ] Security approve work permit
- [ ] Security reject work permit
- [ ] Extend work permit
- [ ] Close work permit
- [ ] Get approval timeline
- [ ] Soft delete work permit

### Frontend Tests
- [ ] List page displays work permits correctly
- [ ] Filter by status, company, area works
- [ ] Search functionality works
- [ ] Create form validates required fields
- [ ] Create form saves work permit correctly
- [ ] Edit form loads existing data
- [ ] Edit form validates status (DRAFT/REJECTED only)
- [ ] Detail page displays all information
- [ ] Action buttons appear based on status and role
- [ ] Submit action works
- [ ] Approve dialog works
- [ ] Reject dialog validates reason
- [ ] Extend dialog validates date
- [ ] Close dialog works
- [ ] Timeline displays correctly

### Integration Tests
- [ ] Approval workflow triggers notifications
- [ ] Status updates correctly through workflow
- [ ] Notifications sent to correct recipients
- [ ] Approval records created in timeline
- [ ] Business rules enforced correctly

### Edge Cases
- [ ] Cannot edit non-DRAFT/REJECTED permits
- [ ] Cannot submit non-DRAFT/REJECTED permits
- [ ] Cannot approve/reject without proper role
- [ ] Cannot extend before current end date
- [ ] Cannot close non-APPROVED/EXTENDED permits
- [ ] Date validation (end date > start date)
- [ ] At least one worker required
- [ ] Required fields validation
