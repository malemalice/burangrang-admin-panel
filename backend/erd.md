# Entity Relationship Diagram (DBML)

```dbml
// ============================================================================
// Core User Management
// ============================================================================

Table t_users {
  id uuid [pk, default: `uuid()`]
  email varchar [unique, not null]
  password varchar
  firstName varchar [not null]
  lastName varchar [not null]
  isActive boolean [default: true, not null]
  roleId uuid [not null, ref: > m_roles.id]
  officeId uuid [not null, ref: > m_offices.id]
  departmentId uuid [ref: > m_departments.id]
  jobPositionId uuid [ref: > m_job_positions.id]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  lastLoginAt timestamp
  Note: 'Central user management entity'
}

Table t_customers {
  id uuid [pk, default: `uuid()`]
  userId uuid [unique, not null, ref: - t_users.id]
  phone varchar
  address varchar
  city varchar
  state varchar
  country varchar
  postalCode varchar
  dateOfBirth timestamp
  gender varchar
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Extended user profile for ecommerce'
}

Table m_roles {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Role-based access control'
}

Table m_permissions {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Granular access control'
}

Table t_refresh_tokens {
  id uuid [pk, default: `uuid()`]
  token varchar [unique, not null]
  userId uuid [not null, ref: > t_users.id]
  expiresAt timestamp [not null]
  createdAt timestamp [default: `now()`, not null]
  Note: 'JWT refresh token management'
}

Table t_password_reset_tokens {
  id uuid [pk, default: `uuid()`]
  token varchar [unique, not null]
  userId uuid [not null, ref: > t_users.id]
  email varchar [not null]
  expiresAt timestamp [not null]
  isUsed boolean [default: false, not null]
  createdAt timestamp [default: `now()`, not null]
  Note: 'Password reset token tracking'
}

// ============================================================================
// Organizational Structure
// ============================================================================

Table m_offices {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  address varchar
  phone varchar
  email varchar
  parentId uuid [ref: > m_offices.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Hierarchical office structure'
}

Table m_departments {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Organizational departments'
}

Table m_job_positions {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  code varchar [unique, not null]
  level integer [not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Job positions with hierarchy levels'
}

// ============================================================================
// Navigation & Access
// ============================================================================

Table m_menus {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  path varchar
  icon varchar
  parentId uuid [ref: > m_menus.id]
  order integer [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Dynamic navigation system'
}

// ============================================================================
// Approval System
// ============================================================================

Table m_approval {
  id uuid [pk, default: `uuid()`]
  entity varchar [not null]
  isActive boolean [default: true, not null]
  Note: 'Approval workflow templates'
}

Table m_approval_item {
  id uuid [pk, default: `uuid()`]
  mApprovalId uuid [not null, ref: > m_approval.id]
  order integer [not null]
  job_position_id uuid [not null, ref: > m_job_positions.id]
  department_id uuid [not null, ref: > m_departments.id]
  createdBy uuid [not null, ref: > t_users.id]
  createdAt timestamp [default: `now()`, not null]
  Note: 'Approval workflow steps'
}

Table t_approvals {
  id uuid [pk, default: `uuid()`]
  mApprovalId uuid [not null]
  entityId varchar [not null]
  department_id uuid [not null, ref: > m_departments.id]
  job_position_id uuid [not null, ref: > m_job_positions.id]
  status varchar [not null]
  notes text [not null]
  createdAt timestamp [default: `now()`, not null]
  createdBy uuid [not null, ref: > t_users.id]
  Note: 'Transaction-level approvals'
}

// ============================================================================
// System Configuration
// ============================================================================

Table m_settings {
  id uuid [pk, default: `uuid()`]
  key varchar [unique, not null]
  value text [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Application configuration'
}

// ============================================================================
// Email Templates
// ============================================================================

Table m_email_templates {
  id uuid [pk, default: `uuid()`]
  code varchar [unique, not null]
  name varchar [not null]
  subjectTemplate text [not null]
  bodyTemplate text [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Email template master data'
}

// ============================================================================
// Product Management (Ecommerce Core)
// ============================================================================

Table t_products {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  slug varchar [unique, not null]
  description text
  shortDescription text
  price decimal(10,2) [not null]
  salePrice decimal(10,2)
  sku varchar [unique, not null]
  productType varchar [not null]
  status varchar [default: 'DRAFT', not null]
  stockQuantity integer [default: 0, not null]
  downloadLimit integer
  viewCount integer [default: 0, not null]
  rating decimal(3,2) [default: 0, not null]
  reviewCount integer [default: 0, not null]
  thumbnailUrl varchar
  fileUrl varchar
  isFreePrice boolean [default: false, not null]
  minFreePrice decimal(10,2) [default: 1000, not null]
  maxFreePrice decimal(10,2)
  createdBy uuid [not null, ref: > t_users.id]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Digital products (ebooks, courses, videos, bundles). Product types: EBOOK, COURSE, VIDEO, BUNDLE. isFreePrice allows users to set custom price during checkout within minFreePrice and maxFreePrice constraints'
}

Table m_categories {
  id uuid [pk, default: `uuid()`]
  name varchar [not null]
  slug varchar [unique, not null]
  description text
  imageUrl varchar
  parentId uuid [ref: > m_categories.id]
  order integer [default: 0, not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Hierarchical product and course categorization'
}

Table m_product_types {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Product type master data'
}

Table _ProductToCategory {
  productId uuid [ref: > t_products.id]
  categoryId uuid [ref: > m_categories.id]
  Note: 'Junction table for Product-Category many-to-many relationship'
}

Table t_product_files {
  id uuid [pk, default: `uuid()`]
  productId uuid [not null, ref: > t_products.id]
  fileName varchar [not null]
  originalName varchar [not null]
  filePath varchar [not null]
  fileType varchar [not null]
  fileSize bigint [not null]
  mimeType varchar [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Digital files for products'
}

Table t_product_downloads {
  id uuid [pk, default: `uuid()`]
  userId uuid [not null, ref: > t_users.id]
  productId uuid [not null, ref: > t_products.id]
  fileId uuid [ref: > t_product_files.id]
  ipAddress varchar [not null]
  userAgent varchar [not null]
  downloadedAt timestamp [default: `now()`, not null]
  Note: 'Track product file downloads'
}

// ============================================================================
// Course Management (LMS)
// ============================================================================

Table t_courses {
  id uuid [pk, default: `uuid()`]
  productId uuid [unique, ref: > t_products.id]
  title varchar [not null]
  slug varchar [unique, not null]
  description text
  shortDescription text
  thumbnailUrl varchar
  totalChapters integer [default: 0, not null]
  totalDuration integer [default: 0, not null]
  difficulty varchar [default: 'beginner', not null]
  language varchar [default: 'en', not null]
  rating decimal(3,2) [default: 0, not null]
  reviewCount integer [default: 0, not null]
  studentCount integer [default: 0, not null]
  instructorId uuid [not null, ref: > t_users.id]
  status varchar [default: 'draft', not null]
  isPublished boolean [default: false, not null]
  publishedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Learning management system courses. Pricing inherited from associated Product'
}

Table t_chapters {
  id uuid [pk, default: `uuid()`]
  courseId uuid [not null, ref: > t_courses.id]
  title varchar [not null]
  description text
  order integer [not null]
  duration integer [default: 0, not null]
  contentType varchar [not null]
  contentUrl varchar
  youtubeVideoId varchar
  content text
  isFree boolean [default: false, not null]
  isPublished boolean [default: false, not null]
  publishedAt timestamp
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Course content chapters/lessons. Content types: VIDEO, PDF, TEXT, YOUTUBE'
}

// ============================================================================
// Order Management
// ============================================================================

Table t_orders {
  id uuid [pk, default: `uuid()`]
  orderNumber varchar [unique, not null]
  customerId uuid [not null, ref: > t_customers.id]
  status varchar [default: 'PENDING', not null]
  subtotal decimal(10,2) [not null]
  taxAmount decimal(10,2) [default: 0, not null]
  discountAmount decimal(10,2) [default: 0, not null]
  totalAmount decimal(10,2) [not null]
  currency varchar [default: 'USD', not null]
  paymentStatus varchar [default: 'PENDING', not null]
  shippingAddress text
  billingAddress text
  notes text
  orderDate timestamp [default: `now()`, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Customer purchase orders'
}

Table t_order_items {
  id uuid [pk, default: `uuid()`]
  orderId uuid [not null, ref: > t_orders.id]
  productId uuid [ref: > t_products.id]
  courseId uuid [ref: > t_courses.id]
  quantity integer [default: 1, not null]
  unitPrice decimal(10,2) [not null]
  totalPrice decimal(10,2) [not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Individual items in an order. Can reference either Product or Course. When product allows free pricing, customPrice from request is stored as unitPrice'
}

// ============================================================================
// Payment Management
// ============================================================================

Table t_payments {
  id uuid [pk, default: `uuid()`]
  orderId uuid [not null, ref: > t_orders.id]
  paymentMethodId uuid [not null, ref: > m_payment_methods.id]
  transactionId varchar [unique, not null]
  amount decimal(10,2) [not null]
  currency varchar [default: 'USD', not null]
  status varchar [default: 'PENDING', not null]
  gatewayResponse jsonb
  processedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Payment transactions'
}

Table m_payment_methods {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  code varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Payment method master data'
}

// ============================================================================
// Course Enrollment & Progress (LMS)
// ============================================================================

Table t_enrollments {
  id uuid [pk, default: `uuid()`]
  userId uuid [not null, ref: > t_users.id]
  courseId uuid [not null, ref: > t_courses.id]
  orderId uuid [ref: > t_orders.id]
  status varchar [default: 'ACTIVE', not null]
  enrolledAt timestamp [default: `now()`, not null]
  completedAt timestamp
  progress decimal(5,2) [default: 0, not null]
  lastAccessedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Student course enrollments. Status: ACTIVE, COMPLETED, CANCELLED, EXPIRED'
}

Table t_progress {
  id uuid [pk, default: `uuid()`]
  enrollmentId uuid [not null, ref: > t_enrollments.id]
  chapterId uuid [not null, ref: > t_chapters.id]
  status varchar [default: 'NOT_STARTED', not null]
  timeSpent integer [default: 0, not null]
  progress decimal(5,2) [default: 0, not null]
  startedAt timestamp
  completedAt timestamp
  lastAccessedAt timestamp
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Track student learning progress. Status: NOT_STARTED, IN_PROGRESS, COMPLETED'
}

// ============================================================================
// Notification System
// ============================================================================

Table m_notification_types {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  description text
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'Master data for notification categories'
}

Table t_notifications {
  id uuid [pk, default: `uuid()`]
  title varchar [not null]
  message text [not null]
  context varchar
  contextId varchar
  typeId uuid [not null, ref: > m_notification_types.id]
  isRead boolean [default: false, not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  readAt timestamp
  createdBy uuid [not null, ref: > t_users.id]
  Note: 'System notifications and alerts'
}

Table t_notification_recipients {
  id uuid [pk, default: `uuid()`]
  notificationId uuid [not null, ref: > t_notifications.id]
  roleId uuid [not null, ref: > m_roles.id]
  userId uuid [ref: > t_users.id]
  isRead boolean [default: false, not null]
  readAt timestamp
  createdAt timestamp [default: `now()`, not null]
  Note: 'Target recipients for notifications'
}

// ============================================================================
// File Management System
// ============================================================================

Table m_file_categories {
  id uuid [pk, default: `uuid()`]
  name varchar [unique, not null]
  allowedTypes jsonb [not null]
  maxSize integer [not null]
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'File type categorization and validation rules'
}

Table t_file_uploads {
  id uuid [pk, default: `uuid()`]
  originalName varchar [not null]
  storedName varchar [not null]
  mimeType varchar [not null]
  size bigint [not null]
  hash varchar [not null]
  storageProvider varchar [not null]
  categoryId uuid [not null, ref: > m_file_categories.id]
  uploadedBy uuid [not null, ref: > t_users.id]
  isPublic boolean [default: false, not null]
  accessToken varchar [unique, not null]
  expiresAt timestamp
  metadata jsonb
  isActive boolean [default: true, not null]
  createdAt timestamp [default: `now()`, not null]
  updatedAt timestamp [default: `now()`, not null]
  Note: 'File metadata; storageProvider is local or aws-s3 (credentials in env)'
}

Table t_file_access_logs {
  id uuid [pk, default: `uuid()`]
  fileId uuid [not null, ref: > t_file_uploads.id]
  accessedBy uuid [ref: > t_users.id]
  ipAddress varchar [not null]
  userAgent varchar [not null]
  accessType varchar [not null]
  accessedAt timestamp [default: `now()`, not null]
  Note: 'Track file access for security and analytics'
}

// ============================================================================
// Many-to-Many Relationships
// ============================================================================

Table _PermissionToRole {
  permissionId uuid [ref: > m_permissions.id]
  roleId uuid [ref: > m_roles.id]
  Note: 'Junction table for Role-Permission many-to-many relationship'
}

Table _MenuToRole {
  menuId uuid [ref: > m_menus.id]
  roleId uuid [ref: > m_roles.id]
  Note: 'Junction table for Role-Menu many-to-many relationship'
}

Table _CourseToCategory {
  courseId uuid [ref: > t_courses.id]
  categoryId uuid [ref: > m_categories.id]
  Note: 'Junction table for Course-Category many-to-many relationship'
}

// ============================================================================
// Relationships Documentation
// ============================================================================

// User Management Relationships
Ref: t_users.roleId > m_roles.id
Ref: t_users.officeId > m_offices.id
Ref: t_users.departmentId > m_departments.id
Ref: t_users.jobPositionId > m_job_positions.id
Ref: t_users.id - t_customers.userId
Ref: t_users.id > t_refresh_tokens.userId
Ref: t_users.id > t_password_reset_tokens.userId

// Organizational Hierarchy
Ref: m_offices.parentId > m_offices.id
Ref: m_menus.parentId > m_menus.id
Ref: m_categories.parentId > m_categories.id

// Approval System
Ref: m_approval_item.mApprovalId > m_approval.id
Ref: m_approval_item.job_position_id > m_job_positions.id
Ref: m_approval_item.department_id > m_departments.id
Ref: m_approval_item.createdBy > t_users.id
Ref: t_approvals.department_id > m_departments.id
Ref: t_approvals.job_position_id > m_job_positions.id
Ref: t_approvals.createdBy > t_users.id

// Product Management
Ref: t_products.createdBy > t_users.id
Ref: t_products.id - t_courses.productId
Ref: t_product_files.productId > t_products.id
Ref: t_product_downloads.userId > t_users.id
Ref: t_product_downloads.productId > t_products.id
Ref: t_product_downloads.fileId > t_product_files.id
Ref: _ProductToCategory.productId > t_products.id
Ref: _ProductToCategory.categoryId > m_categories.id

// Course Management
Ref: t_courses.instructorId > t_users.id
Ref: t_courses.id > t_chapters.courseId
Ref: t_courses.id > t_order_items.courseId
Ref: _CourseToCategory.courseId > t_courses.id
Ref: _CourseToCategory.categoryId > m_categories.id

// Order Management
Ref: t_orders.customerId > t_customers.id
Ref: t_order_items.orderId > t_orders.id
Ref: t_order_items.productId > t_products.id
Ref: t_order_items.courseId > t_courses.id

// Payment Management
Ref: t_payments.orderId > t_orders.id
Ref: t_payments.paymentMethodId > m_payment_methods.id

// Enrollment & Progress
Ref: t_enrollments.userId > t_users.id
Ref: t_enrollments.courseId > t_courses.id
Ref: t_enrollments.orderId > t_orders.id
Ref: t_progress.enrollmentId > t_enrollments.id
Ref: t_progress.chapterId > t_chapters.id

// Notification System
Ref: t_notifications.typeId > m_notification_types.id
Ref: t_notifications.createdBy > t_users.id
Ref: t_notification_recipients.notificationId > t_notifications.id
Ref: t_notification_recipients.roleId > m_roles.id
Ref: t_notification_recipients.userId > t_users.id

// File Management
Ref: t_file_uploads.categoryId > m_file_categories.id
Ref: t_file_uploads.uploadedBy > t_users.id
Ref: t_file_access_logs.fileId > t_file_uploads.id
Ref: t_file_access_logs.accessedBy > t_users.id

// Many-to-Many Relationships
Ref: _PermissionToRole.permissionId > m_permissions.id
Ref: _PermissionToRole.roleId > m_roles.id
Ref: _MenuToRole.menuId > m_menus.id
Ref: _MenuToRole.roleId > m_roles.id
```
