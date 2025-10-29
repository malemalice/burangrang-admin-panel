# PPE Management System - Entity Relationship Diagram

## Overview

This document defines the database schema for the Personal Protective Equipment (PPE) Management System. The system manages PPE stock inventory, expiry tracking, and withdrawal processes.

## Business Process Summary

1. **Stock Management**: HSE records PPE stock with expiry dates
2. **Withdrawal Process**: Users request and collect PPE from Central Store

## Design Notes

- **Reuses Existing Master Data**: Uses `m_safety_equipment` table from main ERD (no duplicate master tables)
- **Simplified Scope**: Focuses on stock and withdrawal management only
- **Flexible Input**: Supports both equipment reference and free-text input for type and size

## Database Schema (DBML)

> **Visualize this ERD**: Copy the DBML code below and paste it into [dbdiagram.io](https://dbdiagram.io) for interactive visualization.

```dbml
Project BSJ_PPE_Management {
  database_type: 'PostgreSQL'
  Note: 'BSJ Admin Panel - PPE Management System'
}

//// -- ENUMS --

Enum PPEWithdrawalStatusEnum {
  PENDING
  APPROVED
  COLLECTED
  CANCELLED
}

Enum PPEStockStatusEnum {
  AVAILABLE
  RESERVED
  ISSUED
  EXPIRED
  DISPOSED
}

//// -- PPE STOCK MANAGEMENT --

Table t_ppe_stock {
  id varchar [pk, default: `uuid()`]
  stockCode varchar [unique, not null]
  receivedDate timestamp [not null]
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'PPE stock header - one stock entry can contain multiple equipment items via t_ppe_stock_items'
}

Table t_ppe_stock_items {
  id varchar [pk, default: `uuid()`]
  stockId varchar [not null, ref: > t_ppe_stock.id]
  safetyEquipmentId varchar [ref: > m_safety_equipment.id]
  expiryDate timestamp
  initialQuantity int [not null]
  currentQuantity int [not null]
  reservedQuantity int [default: 0, not null]
  status PPEStockStatusEnum [default: 'AVAILABLE', not null]
  order int [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'PPE stock items detail - multiple equipment items per stock entry. References m_safety_equipment (optional) but allows free-text input for equipmentName, equipmentType, and equipmentSize for flexibility.'
}

Table t_ppe_stock_adjustments {
  id varchar [pk, default: `uuid()`]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  adjustmentType varchar [not null]
  quantityBefore int [not null]
  quantityAfter int [not null]
  quantityChange int [not null]
  reason text [not null]
  adjustedBy varchar [not null, ref: > t_users.id]
  adjustedAt timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Track stock adjustments (DISPOSAL, DAMAGE, CORRECTION, EXPIRY_REMOVAL, RETURN) for audit trail'
}

Table t_ppe_expiry_alerts {
  id varchar [pk, default: `uuid()`]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  alertDate timestamp [not null]
  daysUntilExpiry int [not null]
  isSent boolean [default: false, not null]
  sentAt timestamp
  recipientId varchar [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]

  Note: 'Expiry date alerts sent to HSE team for proactive management (90, 60, 30, 7 days before)'
}

//// -- PPE WITHDRAWAL & DISTRIBUTION --

Table t_ppe_withdrawals {
  id varchar [pk, default: `uuid()`]
  withdrawalCode varchar [unique, not null]
  withdrawalDate timestamp [not null]
  requestedBy varchar [not null, ref: > t_users.id]
  requestedFor varchar [ref: > t_users.id]
  requestedForName varchar
  departmentId varchar [not null, ref: > m_departments.id]
  jobPositionId varchar [ref: > m_job_positions.id]
  jobPositionName varchar
  status PPEWithdrawalStatusEnum [default: 'PENDING', not null]
  withdrawalLetterUrl varchar
  collectedDate timestamp
  collectedBy varchar [ref: > t_users.id]
  notes text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  createdBy varchar [not null, ref: > t_users.id]

  Note: 'PPE withdrawal requests. Can be for a specific user (requestedFor) or free-text name (requestedForName). Job position can be from master data or free-text.'
}

Table t_ppe_withdrawal_items {
  id varchar [pk, default: `uuid()`]
  withdrawalId varchar [not null, ref: > t_ppe_withdrawals.id]
  stockItemId varchar [not null, ref: > t_ppe_stock_items.id]
  requestedQuantity int [not null]
  approvedQuantity int
  issuedQuantity int
  order int [not null]
  notes text
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Individual PPE items in withdrawal request with quantity tracking. References t_ppe_stock_items for available stock.'
}

//// -- RELATIONSHIPS TO EXISTING TABLES --
// Note: These tables are references from the main ERD (erd.md)

Table m_safety_equipment {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  safety_equiipment_type_id varchar [not null, ref: > m_safety_equipment_type.id]
  size varchar
  description text
  category SafetyEquipmentCategoryEnum [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Safety equipment master data (PPE and safety/emergency equipment)'
}

Table m_safety_equipment_type {
  id varchar [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]

  Note: 'Safety equipment type master data (PPE and safety/emergency equipment). eg:  safety shoes: Boots, Regular safety Shoes; Glove: Anticuting Glove atau Welding Glove'
}

Table t_users {
  id varchar [pk]
  
  Note: 'Reference to existing t_users table from main ERD'
}

Table m_departments {
  id varchar [pk]
  
  Note: 'Reference to existing m_departments table from main ERD'
}

Table m_job_positions {
  id varchar [pk]
  
  Note: 'Reference to existing m_job_positions table from main ERD'
}

//// -- TABLE GROUPS --

TableGroup ppe_stock_management {
  t_ppe_stock
  t_ppe_stock_items
  t_ppe_stock_adjustments
  t_ppe_expiry_alerts
}

TableGroup ppe_withdrawal_system {
  t_ppe_withdrawals
  t_ppe_withdrawal_items
}

TableGroup existing_system_tables {
  m_safety_equipment
  t_users
  m_departments
  m_job_positions
}
```

## Entity Descriptions

### Master Data Integration

#### m_safety_equipment (from main ERD)
- **Purpose**: Reused from main ERD for PPE/safety equipment master data
- **Key Fields**: name, code (unique), category
- **Category Filter**: Use `category = 'PERSONAL_PROTECTIVE_EQUIPMENT'` for PPE items
- **Examples**: Safety Helmet, Safety Shoes, Safety Vest, Safety Goggle, Safety Glasses, Mask, Hard Hat, Ear Plug, Ear Muff, Glove, Full Body Harness, Lanyard Body Harness
- **Usage**: Optional reference in t_ppe_stock_items via safetyEquipmentId

### Transactional Tables

#### t_ppe_stock
- **Purpose**: PPE stock header - one entry for each stock receipt/delivery batch
- **Key Fields**: 
  - `stockCode`: Unique stock code (auto-generated)
  - `receivedDate`: Date PPE received by store team (Input Form Field 1)
  - `notes`: Optional notes for the entire stock entry
- **Design Pattern**: One stock entry can contain multiple equipment items via t_ppe_stock_items

#### t_ppe_stock_items
- **Purpose**: Individual PPE items within a stock entry - supports multiple items per stock
- **Key Fields**: 
  - `stockId`: Reference to parent stock entry
  - `safetyEquipmentId`: Optional reference to m_safety_equipment
  - `equipmentName`: PPE name - free-text (Input Form Field 2: Safety Helmet, Safety Shoes, etc.)
  - `equipmentType`: PPE type variation - free-text (Input Form Field 3: Boots, Anti-cutting Glove, etc.)
  - `equipmentSize`: PPE size - free-text (Input Form Field 4: S, M, L, XL, 38, 39, 40, etc.)
  - `expiryDate`: PPE expiry date - nullable (Input Form Field 5)
  - `initialQuantity`: Original quantity received (Input Form Field 6)
  - `currentQuantity`: Current available quantity
  - `order`: Display order within stock entry
- **Design Pattern**: Hybrid approach - can reference m_safety_equipment or use free-text input for maximum flexibility. Multiple items per stock entry.

#### t_ppe_stock_adjustments
- **Purpose**: Audit trail for stock item changes
- **Adjustment Types**: DISPOSAL, DAMAGE, CORRECTION, EXPIRY_REMOVAL, RETURN
- **Tracks**: quantity before, quantity after, reason, who made the adjustment
- **References**: stockItemId (not stockId) - tracks adjustments per item

#### t_ppe_expiry_alerts
- **Purpose**: Proactive expiry date monitoring per stock item
- **Alert Triggers**: 90 days, 60 days, 30 days, 7 days before expiry
- **Recipients**: HSE team members
- **References**: stockItemId (not stockId) - alerts generated per item expiry date

#### t_ppe_withdrawals
- **Purpose**: PPE withdrawal request and tracking
- **Key Fields**:
  - `withdrawalDate`: Date of withdrawal
  - `requestedFor`: User requesting PPE (can be userId or free-text name)
  - `departmentId`: Department of requester
  - `jobPositionId`: Job position (can be from master or free-text)
  - `status`: Workflow status (PENDING → APPROVED → COLLECTED)
  - `withdrawalLetterUrl`: Uploaded withdrawal letter document
- **Status Flow**: PENDING → APPROVED → COLLECTED (or CANCELLED)

#### t_ppe_withdrawal_items
- **Purpose**: Individual items in withdrawal request (Stock Out Form)
- **Key Fields**: 
  - `stockItemId`: Reference to t_ppe_stock_items (specific stock item)
  - `equipmentName`: PPE name being withdrawn (copied for reference)
  - `equipmentType`: PPE type being withdrawn (copied for reference)
  - `equipmentSize`: PPE size being withdrawn (copied for reference)
  - `requestedQuantity`: Amount requested
  - `approvedQuantity`: Amount approved by HSE
  - `issuedQuantity`: Actual amount issued
- **Tracks**: Who (via t_ppe_withdrawals), Department, Job Position, What (equipment), How many (quantity), When (withdrawalDate)
- **References**: stockItemId links to specific stock item to deduct quantity

## Database Constraints

### Primary Keys
- All tables use UUID primary keys

### Unique Constraints
- `t_ppe_stock.stockCode`
- `t_ppe_withdrawals.withdrawalCode`

### Foreign Key Relationships
- **Stock → Users**: Required (createdBy)
- **Stock Items → Stock**: Required (parent stock entry)
- **Stock Items → SafetyEquipment**: Optional (supports free-text alternative)
- **Withdrawals → Users/Departments**: Required
- **Withdrawal Items → Stock Items**: Required (specific item to withdraw)
- **Stock Adjustments → Stock Items**: Required (per item adjustments)
- **Expiry Alerts → Stock Items/Users**: Required (per item expiry)

### Indexes
```sql
-- Performance indexes
CREATE INDEX idx_ppe_stock_items_expiry ON t_ppe_stock_items(expiryDate) WHERE expiryDate IS NOT NULL;
CREATE INDEX idx_ppe_stock_items_status ON t_ppe_stock_items(status, currentQuantity);
CREATE INDEX idx_ppe_stock_items_equipment ON t_ppe_stock_items(equipmentName, equipmentType);
CREATE INDEX idx_ppe_stock_items_stock ON t_ppe_stock_items(stockId, "order");
CREATE INDEX idx_ppe_stock_received ON t_ppe_stock(receivedDate);
CREATE INDEX idx_ppe_withdrawals_status ON t_ppe_withdrawals(status, withdrawalDate);
CREATE INDEX idx_ppe_withdrawals_dept ON t_ppe_withdrawals(departmentId, createdAt);
```

## Data Flow Patterns

### 1. Stock Input Flow
```
HSE Staff → Create t_ppe_stock record (header)
  ↓
Input: Received Date
  ↓
System: Generate stock code
  ↓
Add multiple t_ppe_stock_items (equipment items)
  For each item: Equipment Name, Type, Size, Expiry, Quantity
  ↓
System: Set each item status to AVAILABLE
  ↓
If expiry date exists per item → Create t_ppe_expiry_alerts (90, 60, 30, 7 days before)
```

### 2. Withdrawal Flow
```
User/Line Manager → Create t_ppe_withdrawals (header)
  ↓
Add t_ppe_withdrawal_items (multiple items)
  Each item references t_ppe_stock_items (available stock)
  ↓
HSE approves → Update status to APPROVED
  ↓
Generate withdrawal letter → Upload withdrawalLetterUrl
  ↓
User collects from Central Store → Update status to COLLECTED
  ↓
Deduct from t_ppe_stock_items.currentQuantity (per item)
  ↓
Create t_ppe_stock_adjustments (audit trail per item)
```

### 3. Expiry Management Flow
```
Scheduled job checks t_ppe_stock_items.expiryDate
  ↓
Find stock items expiring within alert thresholds
  ↓
Create t_ppe_expiry_alerts per item → Send notifications to HSE
  ↓
HSE reviews → Dispose expired stock items
  ↓
Create t_ppe_stock_adjustments (type: EXPIRY_REMOVAL) per item
  ↓
Update t_ppe_stock_items.status = EXPIRED
  ↓
Set t_ppe_stock_items.currentQuantity = 0
```

## Common Query Patterns

### Stock Queries

```typescript
// Get available stock items with low quantity alert
prisma.ppeStockItem.findMany({
  where: {
    stock: { isActive: true },
    status: 'AVAILABLE',
    currentQuantity: { lt: 10 }
  },
  include: {
    stock: {
      include: { createdByUser: true }
    },
    safetyEquipment: true
  }
})

// Get expiring stock items (within 30 days)
const thirtyDaysFromNow = new Date();
thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

prisma.ppeStockItem.findMany({
  where: {
    stock: { isActive: true },
    status: 'AVAILABLE',
    expiryDate: {
      lte: thirtyDaysFromNow,
      gte: new Date()
    }
  },
  include: { stock: true },
  orderBy: { expiryDate: 'asc' }
})

// Search PPE by equipment name
prisma.ppeStockItem.findMany({
  where: {
    stock: { isActive: true },
    OR: [
      { equipmentName: { contains: searchTerm, mode: 'insensitive' } },
      { equipmentType: { contains: searchTerm, mode: 'insensitive' } }
    ]
  },
  include: { stock: true },
  orderBy: { stock: { receivedDate: 'desc' } },
  take: 20
})

// Get stock entry with all items
prisma.ppeStock.findUnique({
  where: { id: stockId },
  include: {
    items: {
      orderBy: { order: 'asc' },
      include: { safetyEquipment: true }
    },
    createdByUser: true
  }
})
```

### Withdrawal Queries

```typescript
// Get pending withdrawals for approval
prisma.ppeWithdrawal.findMany({
  where: {
    status: 'PENDING',
    isActive: true
  },
  include: {
    requestedByUser: true,
    requestedForUser: true,
    department: true,
    jobPosition: true,
    items: {
      include: { 
        stockItem: {
          include: { stock: true }
        }
      },
      orderBy: { order: 'asc' }
    }
  },
  orderBy: { createdAt: 'asc' }
})

// Get user's withdrawal history
prisma.ppeWithdrawal.findMany({
  where: {
    OR: [
      { requestedBy: userId },
      { requestedFor: userId }
    ],
    isActive: true
  },
  include: {
    items: {
      include: { stock: true }
    }
  },
  orderBy: { withdrawalDate: 'desc' }
})
```

### Audit & Analytics Queries

```typescript
// PPE usage analytics by department
prisma.ppeWithdrawal.groupBy({
  by: ['departmentId'],
  where: {
    status: 'COLLECTED',
    withdrawalDate: {
      gte: startDate,
      lte: endDate
    }
  },
  _count: { id: true },
  _sum: {
    items: {
      _sum: { issuedQuantity: true }
    }
  }
})

// Most frequently requested PPE
prisma.ppeWithdrawalItem.groupBy({
  by: ['equipmentName', 'equipmentType'],
  where: {
    withdrawal: { status: 'COLLECTED' }
  },
  _sum: { issuedQuantity: true },
  orderBy: {
    _sum: {
      issuedQuantity: 'desc'
    }
  },
  take: 10
})

// Stock adjustment audit trail
prisma.ppeStockAdjustment.findMany({
  where: {
    stockItemId: stockItemId
  },
  include: {
    stockItem: {
      include: { stock: true }
    },
    adjustedByUser: true
  },
  orderBy: { adjustedAt: 'desc' }
})
```

## AI Assistant Guidelines

### When Working with PPE System:

1. **Stock Management**:
   - Create stock header first, then add multiple items
   - Always check expiry dates before issuing stock items
   - Update currentQuantity on stock items when processing withdrawals
   - Create adjustment records per item for audit trail
   - Alert when stock item levels are low (< 10 units)

2. **Withdrawal Processing**:
   - Validate stock item availability before approval
   - Generate unique withdrawal codes (format: PPE-YYYYMMDD-XXXX)
   - Track quantity at each stage (requested → approved → issued)
   - Deduct from stockItem.currentQuantity when withdrawal is collected

3. **Expiry Management**:
   - Scheduled jobs to check stock item expiry dates daily
   - Send alerts at 90, 60, 30, 7 days before expiry per item
   - Prevent issuing expired stock items
   - Proper disposal workflow with adjustments per item

4. **Search & Filtering**:
   - Case-insensitive search on index page by equipment name
   - Filter by equipment type, size, status, expiry date
   - Sort by received date, stock code, quantity

5. **Hybrid Data Approach**:
   - Can optionally reference m_safety_equipment via safetyEquipmentId
   - Always store equipmentName, equipmentType, equipmentSize as free-text
   - Allows flexibility for new equipment types without master data updates

## Integration Points with Main System

### Required Tables from Main ERD:
- `t_users` - For HSE staff, requesters, line managers
- `m_departments` - For withdrawal department tracking
- `m_job_positions` - For requester job position tracking

### Notification Integration:
- Send expiry alerts to HSE team
- Notify line managers about broken PPE
- Alert users when withdrawal is approved

### File Upload Integration:
- Withdrawal letter documents (withdrawalLetterUrl)
- PPE condition report photos (photoUrls)
- Stock receipt documents

### Approval Integration (Optional):
- Can integrate with existing approval workflow
- For high-value or bulk PPE withdrawals
- Department head or HSE manager approval

## Table Summary

| Table | Type | Purpose | Records |
|-------|------|---------|---------|
| m_safety_equipment | Master (Existing) | PPE equipment catalog | ~30-50 |
| t_ppe_stock | Transaction | Stock header (batches) | ~100+ |
| t_ppe_stock_items | Transaction | Stock items (multiple per stock) | ~500+ |
| t_ppe_stock_adjustments | Transaction | Audit trail | ~1000+ |
| t_ppe_expiry_alerts | Transaction | Expiry notifications | ~100+ |
| t_ppe_withdrawals | Transaction | Withdrawal requests | ~200+ |
| t_ppe_withdrawal_items | Transaction | Withdrawal line items | ~500+ |

## Future Enhancements

1. **Barcode/QR Code Support**: Track individual PPE items with barcodes
2. **Predictive Analytics**: Forecast PPE demand based on historical data
3. **Vendor Integration**: Auto-reorder when stock levels are low
4. **Cost Tracking**: Monitor PPE costs and ROI by department
5. **Batch Management**: Better tracking of batches with separate batch table

---

This ERD provides a focused foundation for managing PPE stock and withdrawal processes, with full audit trail and expiry monitoring capabilities. Reuses existing m_safety_equipment master data to avoid duplication. 🦺

