# PRD: Inspection Management

## Overview

The Inspection Management module supports creating and managing inspections: each inspection has a code, date, status, creator, optional done-at time, linked areas (many-to-many), inspectors (users), and items. Each item is scoped by area, risk category, risk, assigned department, assignee, and has findings, description, follow-up notes, due date, and images (with type: BEFORE/AFTER/GENERAL). Items can be managed under an inspection or listed/updated via a standalone inspection-items API. List endpoints support an `options` bypass for dropdown use.

**Scope:** Backend `inspections` module (inspections controller and inspection-items controller); frontend `inspections` module including `inspection-items` submodule.

## Key Features

- **Inspections:** Create, list (paginated, filter by code, isActive, areaId, status, search), read, update, delete. Inspections have many items, many inspectors, and many areas (junction).
- **Inspection items (under inspection):** Create, list (paginated per inspection, sort, search), read, update, delete. Items have area, risk category, risk, assigned department, assignee, status, findings, description, followUpNotes, dueDate, and images.
- **Inspection images (per item):** Create, list, read, update, delete. Image has imageUrl, caption, type (BEFORE/AFTER/GENERAL), order.
- **Inspection inspectors:** Create, list, read, update, delete. Inspector links inspection to user (inspectorId) with order.
- **Inspection items (standalone):** List all items with filters (status, assignedDepartmentId, assigneeId, riskId, riskCategoryId, inspectionCode, search); get one item; update one item. Used for cross-inspection item views.

## User Roles & Permissions

- **inspection:create** — create inspection, create item, create image, create inspector.
- **inspection:list** — list inspections (options bypass), list inspection items standalone (options bypass).
- **inspection:read** — get inspection, get items/images/inspectors of inspection, get item standalone.
- **inspection:update** — update inspection, update item, update image, update inspector; update item standalone.
- **inspection:delete** — delete inspection, delete item, delete image, delete inspector.

## User Stories

- As a user, I can create an inspection with date and link areas and inspectors so that a round is defined.
- As a user, I can add inspection items (area, risk category, risk, department, assignee, findings, due date) and attach images so that findings are recorded per location/risk.
- As a user, I can list inspections and filter by code, area, status so that I can track progress.
- As a user, I can list all inspection items across inspections and filter by department, assignee, risk so that I can manage follow-ups.
- As a user, I can view inspection detail with items, images, and inspectors and export (e.g. PDF) when supported.

## Key Workflows

1. **Create inspection:** User creates inspection (code, date, status, areas, createdBy) → adds inspectors → adds items (per area/risk/department/assignee) → optionally adds images per item (BEFORE/AFTER/GENERAL).
2. **List inspections:** User opens Inspections list → filters by code, area, status, search → paginated list.
3. **Edit inspection:** User opens inspection detail → edit header (date, status, areas, doneAt) or add/edit/remove items and inspectors; edit items (findings, assignee, due date, images).
4. **Standalone items view:** User opens Inspection Items page → list from GET /inspection-items with filters (status, department, assignee, risk, risk category, inspection code, search) → open item to view or edit (PATCH /inspection-items/:id).

## Data Model Summary

- **Inspection (t_inspections):** id, code (unique), inspectionDate, status, isActive, createdBy, doneAt. Relations: creator (User), items (InspectionItem[]), inspectors (InspectionInspector[]), areas (InspectionToArea[]).
- **InspectionItem (t_inspection_items):** id, inspectionId, areaId, riskCategoryId, riskId, assignedDepartmentId, assigneeId?, status, findings, description, followUpNotes, dueDateAt. Relations: inspection, area, riskCategory, risk, assignedDepartment, assignee (User), images (InspectionImage[]). Polymorphic link to RiskMitigationRecord (entity=INSPECTION_ITEM).
- **InspectionImage (t_inspection_images):** id, inspectionItemId, imageUrl, caption, type (BEFORE/AFTER/GENERAL), order.
- **InspectionInspector (t_inspection_inspectors):** id, inspectionId, inspectorId (User), order.
- **InspectionToArea (_InspectionToArea):** inspectionId, areaId (many-to-many).

## API Endpoints Summary

### Inspections (prefix /inspections)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| POST | /inspections | inspection:create | Create inspection |
| GET | /inspections | inspection:list | List (page, limit, sortBy, sortOrder, search, code, isActive, areaId, status; options bypass) |
| GET | /inspections/:id | inspection:read | Get one |
| PATCH | /inspections/:id | inspection:update | Update |
| DELETE | /inspections/:id | inspection:delete | Delete |
| POST | /inspections/:id/items | inspection:create | Create item |
| GET | /inspections/:id/items | inspection:read | List items (page, limit, sortBy, sortOrder, search) |
| GET | /inspections/:id/items/:itemId | inspection:read | Get item |
| PATCH | /inspections/:id/items/:itemId | inspection:update | Update item |
| DELETE | /inspections/:id/items/:itemId | inspection:delete | Delete item |
| POST | /inspections/:id/items/:itemId/images | inspection:create | Create image |
| GET | /inspections/:id/items/:itemId/images | inspection:read | List images |
| GET | /inspections/:id/items/:itemId/images/:imageId | inspection:read | Get image |
| PATCH | /inspections/:id/items/:itemId/images/:imageId | inspection:update | Update image |
| DELETE | /inspections/:id/items/:itemId/images/:imageId | inspection:delete | Delete image |
| POST | /inspections/:id/inspectors | inspection:create | Create inspector |
| GET | /inspections/:id/inspectors | inspection:read | List inspectors |
| GET | /inspections/:id/inspectors/:inspectorId | inspection:read | Get inspector |
| PATCH | /inspections/:id/inspectors/:inspectorId | inspection:update | Update inspector |
| DELETE | /inspections/:id/inspectors/:inspectorId | inspection:delete | Delete inspector |

### Inspection Items standalone (prefix /inspection-items)

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /inspection-items | inspection:list | List all items (page, limit, sortBy, sortOrder, status, assignedDepartmentId, assigneeId, riskId, riskCategoryId, inspectionCode, search; options bypass) |
| GET | /inspection-items/:id | inspection:read | Get one item |
| PATCH | /inspection-items/:id | inspection:update | Update item |

## Frontend Pages & Components

- **Inspections:** InspectionsPage (list), CreateInspectionPage, EditInspectionPage, InspectionDetailPage (detail with items, inspectors, areas). Routes: /inspections, /inspections/new, /inspections/:id/edit, /inspections/:id.
- **Inspection items:** InspectionItemsPage (standalone list), ViewInspectionItemPage, EditInspectionItemPage. Routes: /inspections/items, /inspections/items/:id, /inspections/items/:id/edit.
- **Components:** InspectionForm, InspectionItemForm, InspectionItemsTable, InspectionDetailsCard, InspectionPDFTemplate (if present), ViewItemDialog, InspectionBadgeHelpers (utils).

## Dependencies

- **Backend:** Prisma (Inspection, InspectionItem, InspectionImage, InspectionInspector, InspectionToArea, User, Area, RiskCategory, Risk, Department), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass. RiskMitigationRecord linked to item via entity/entityId.
- **Frontend:** Auth, master-data (areas, risk categories, risks, departments, users for assignee/inspectors), uploads for images, core API.
