# PRD: Personal Protective Equipment (PPE)

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The PPE module manages safety equipment types, safety equipment (master data), stock entries (stock-in with items), stock items (availability, status, adjustments), and withdrawals (request, approve, collect, cancel). Withdrawals are data-scoped (self/department/super). List endpoints for stocks and withdrawals support an `options` bypass where applicable. Stock movement history supports audit trail.

**Scope:** Backend `ppe` module; frontend `ppe` module (safety-equipment-types, safety-equipments, stocks, withdrawals).

## Key Features

- **Safety equipment types:** CRUD; list with pagination, isActive, search (options bypass). Master data for categorizing equipment.
- **Safety equipment:** CRUD; list with pagination, typeId, isActive, search (options bypass). Each equipment belongs to a type; used in stock items and withdrawals.
- **Stocks (stock-in):** Create stock entry with items (safety equipment, quantity, expiry, etc.); list (paginated, search, isActive, received date range; options bypass); get, update, soft delete. Update stock item (e.g. expiry); create stock adjustment (audit trail).
- **Stock items:** Get available stock items (for withdrawal UI; filter by status, stockId, availableOnly, groupBySafetyEquipment, includeExpired); get all stock items (same filters without availableOnly forced).
- **Withdrawals:** Create withdrawal (department, items with equipment and quantity); list (paginated, status, departmentId, date range, isActive, search; options bypass; data-scoped); get, update (only PENDING), approve, collect (deduct stock), cancel, soft delete. Data-scoped so users see only own/department/all per role.
- **Movements:** List stock movements (audit) with filters (find-movements DTO).

## User Roles & Permissions

- **ppe:create** — create stock, create withdrawal.
- **ppe:list** — list stocks, list withdrawals (options bypass; withdrawals data-scoped).
- **ppe:read** — get stock, get stock items/available, get withdrawal, movements.
- **ppe:update** — update stock, update stock item, adjust stock item; update/approve/collect/cancel withdrawal.
- **ppe:delete** — soft delete stock, soft delete withdrawal.
- **safety-equipment-type:create/list/read/update/delete** — CRUD safety equipment types (list has options bypass).
- **safety-equipment:create/list/read/update/delete** — CRUD safety equipment (list has options bypass).

## User Stories

- As an admin, I can define safety equipment types and equipment so that stock and withdrawals use consistent master data.
- As a user, I can record stock-in (new stock with items and quantities/expiry) so that inventory is tracked.
- As a user, I can view available stock items and create a withdrawal request (department, items, quantities) so that PPE can be issued.
- As an approver, I can approve or cancel withdrawals so that only valid requests are fulfilled.
- As a user, I can collect an approved withdrawal so that stock is deducted and issuance is recorded.
- As a user with data scope, I see only withdrawals I am allowed to access (self/department/all).

## Key Workflows

1. **Stock-in:** User creates stock entry (e.g. received date, code) with items (safety equipment, quantity, expiry date) → POST /ppe/stocks. Later can update stock or item, or create adjustment for audit.
2. **Withdrawal request:** User opens available stock items (optional groupBySafetyEquipment) → creates withdrawal (department, list of items with equipment and quantity) → POST /ppe/withdrawals (status PENDING).
3. **Approve/Collect/Cancel:** Approver opens withdrawal → Approve (PATCH :id/approve) or Cancel (PATCH :id/cancel). After approval, user can Collect (PATCH :id/collect) to deduct stock and mark collected.
4. **List withdrawals:** List filtered by status, department, date range, search; results data-scoped by current user.

## Data Model Summary

- **SafetyEquipmentType:** id, name, code, description, isActive (master). Has many SafetyEquipment.
- **SafetyEquipment:** id, safetyEquipmentTypeId, name, code, size?, description, isActive (master). Referenced by PPEStockItem, PPEWithdrawalItem.
- **PPEStock:** id, code, receivedDate?, isActive, createdBy, etc. Has many PPEStockItem.
- **PPEStockItem:** id, stockId, safetyEquipmentId, quantity, status (AVAILABLE, RESERVED, ISSUED, EXPIRED, DISPOSED), expiryDate?, etc. Stock adjustments create movement records.
- **PPEWithdrawal:** id, code, departmentId, status (PENDING, APPROVED, COLLECTED, CANCELLED), withdrawalDate?, requestedBy, etc. Has many PPEWithdrawalItem. Data-scoped by department/user.
- **PPEWithdrawalItem:** withdrawalId, safetyEquipmentId (or stock item reference), quantity, etc.
- **Stock movement / adjustment:** Audit trail for item quantity changes.

## API Endpoints Summary

| Area | Method | Path | Permission | Description |
|------|--------|------|------------|-------------|
| Stock items | GET | /ppe/stock-items/available | ppe:read | Available items (for withdrawal) |
| Stock items | GET | /ppe/stock-items | ppe:read | All stock items (filtered) |
| Stocks | POST | /ppe/stocks | ppe:create | Create stock with items |
| Stocks | GET | /ppe/stocks | ppe:list | List stocks (options bypass) |
| Stocks | GET | /ppe/stocks/:id | ppe:read | Get stock |
| Stocks | PATCH | /ppe/stocks/:id | ppe:update | Update stock |
| Stocks | PATCH | /ppe/stocks/:id/items/:itemId | ppe:update | Update stock item |
| Stocks | POST | /ppe/stocks/:id/items/:itemId/adjust | ppe:update | Create adjustment |
| Stocks | DELETE | /ppe/stocks/:id | ppe:delete | Soft delete stock |
| Withdrawals | POST | /ppe/withdrawals | ppe:create | Create withdrawal |
| Withdrawals | GET | /ppe/withdrawals | ppe:list | List (options bypass; data-scoped) |
| Withdrawals | GET | /ppe/withdrawals/:id | ppe:read | Get one (data-scoped) |
| Withdrawals | PATCH | /ppe/withdrawals/:id | ppe:update | Update (PENDING only) |
| Withdrawals | PATCH | /ppe/withdrawals/:id/approve | ppe:update | Approve |
| Withdrawals | PATCH | /ppe/withdrawals/:id/collect | ppe:update | Collect (deduct stock) |
| Withdrawals | PATCH | /ppe/withdrawals/:id/cancel | ppe:update | Cancel |
| Withdrawals | DELETE | /ppe/withdrawals/:id | ppe:delete | Soft delete (data-scoped) |
| Safety equipment types | POST | /ppe/safety-equipment-types | safety-equipment-type:create | Create type |
| Safety equipment types | GET | /ppe/safety-equipment-types | safety-equipment-type:list | List (options bypass) |
| Safety equipment types | GET | /ppe/safety-equipment-types/:id | safety-equipment-type:read | Get one |
| Safety equipment types | PATCH | /ppe/safety-equipment-types/:id | safety-equipment-type:update | Update |
| Safety equipment types | DELETE | /ppe/safety-equipment-types/:id | safety-equipment-type:delete | Delete |
| Safety equipment | POST | /ppe/safety-equipment | safety-equipment:create | Create |
| Safety equipment | GET | /ppe/safety-equipment | safety-equipment:list | List (options bypass) |
| Safety equipment | GET | /ppe/safety-equipment/:id | safety-equipment:read | Get one |
| Safety equipment | PATCH | /ppe/safety-equipment/:id | safety-equipment:update | Update |
| Safety equipment | DELETE | /ppe/safety-equipment/:id | safety-equipment:delete | Delete |
| Movements | GET | /ppe/movements (or similar) | ppe:read | List movements (audit) |

## Frontend Pages & Components

- **Safety equipment types:** SafetyEquipmentTypesPage, CreateSafetyEquipmentTypePage, EditSafetyEquipmentTypePage, SafetyEquipmentTypeForm.
- **Safety equipment:** SafetyEquipmentsPage, CreateSafetyEquipmentPage, EditSafetyEquipmentPage, SafetyEquipmentDetailPage, SafetyEquipmentForm.
- **Stocks:** PPEStockInPage, CreatePPEStockPage, EditPPEStockPage, PPEStockDetailPage, PPEStockForm (under pages/stocks/).
- **Withdrawals:** PPEWithdrawPage, CreatePPEWithdrawalPage, EditPPEWithdrawalPage, PPEWithdrawalDetailPage, PPEWithdrawalForm (under pages/withdrawals/).
- **Components:** StockMovementHistory.
- **Hooks:** usePPE, useSafetyEquipments, useSafetyEquipmentTypes.

Routes defined in `ppe/routes/ppeRoutes.tsx` (imported in core routes).

## Dependencies

- **Backend:** Prisma (SafetyEquipmentType, SafetyEquipment, PPEStock, PPEStockItem, PPEWithdrawal, PPEWithdrawalItem, Department, User, and movement/audit tables), DataScopeGuard for withdrawals, JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, core API, master-data for department options. Data scope enforced by backend; list/detail of withdrawals reflect scope.

## Functional Requirements

- [FR-1] The system must support full CRUD for safety equipment types and safety equipment as master data.
- [FR-2] The system must support creating stock entries with inline items (safety equipment, quantity, expiry), updating stock and item details, and creating adjustments for audit purposes.
- [FR-3] The system must expose available stock items filtered by status and optional grouping by safety equipment for the withdrawal creation UI.
- [FR-4] The system must support creating a PPE withdrawal request (department, list of items with equipment and quantity) with initial status PENDING.
- [FR-5] Withdrawal status must follow the lifecycle: PENDING → APPROVED → COLLECTED (or CANCELLED).
- [FR-6] Only PENDING withdrawals may be updated; approved or collected withdrawals are immutable.
- [FR-7] Collecting a withdrawal must deduct the corresponding quantity from stock items.
- [FR-8] Withdrawal list and single-record access must be data-scoped (SELF/DEPARTMENT/SUPER) via `DataScopeGuard`.
- [FR-9] Stock entries and withdrawals must be soft-deletable.
- [FR-10] List endpoints for stocks, withdrawals, and master data must support `options=true` bypass.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] Soft-deleted stocks and withdrawals must be excluded from list responses.
- [NFR-3] All write operations must require a valid JWT and the corresponding `ppe:*` or `safety-equipment*:*` permission.
- [NFR-4] Data-scope filtering for withdrawals must be enforced server-side via `DataScopeGuard`.
- [NFR-5] API responses must return within 2 seconds under normal load.
- [NFR-6] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | User creates a stock entry with 3 items | 201; stock and all items created; available items endpoint reflects new stock |
| AC-2 | User creates a withdrawal request with 2 items | 201; withdrawal created with PENDING status |
| AC-3 | Approver approves withdrawal | Status changes to APPROVED |
| AC-4 | User collects approved withdrawal | Status changes to COLLECTED; stock item quantities decremented |
| AC-5 | SELF-scoped user lists withdrawals | Only withdrawals created by the user are returned |
| AC-6 | Soft-deleted stock excluded from list | `GET /ppe/stocks` does not return deleted record |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and data-scope enforcement
- [`prd-master-data.md`](prd-master-data.md) — master data module (departments used in withdrawals)
