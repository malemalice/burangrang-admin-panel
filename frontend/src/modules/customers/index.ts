/**
 * Customers module barrel exports
 * Following the TRD.md module structure template
 */

// Pages - Group by functionality
export { default as CustomersPage } from './pages/CustomersPage';
export { default as CreateCustomerPage } from './pages/CreateCustomerPage';
export { default as EditCustomerPage } from './pages/EditCustomerPage';
export { default as CustomerDetailPage } from './pages/CustomerDetailPage';

// Routes - Single export per module
export { default as customerRoutes } from './routes/customerRoutes';

// Services - Export all services
export { default as customerService } from './services/customerService';

// Types - Group related types
export type {
  // Core entity types
  Customer,
  CustomerDTO,

  // CRUD operation types
  CreateCustomerDTO,
  UpdateCustomerDTO,

  // Form and UI types
  CustomerFormData,
  CustomerFilters,
  CustomerSearchParams,

  // Statistics and analytics
  CustomerStats,

  // Common shared types
  PaginatedResponse,
  PaginationParams,
  FilterField,
} from './types/customer.types';

// Hooks - Export all custom hooks
export {
  useCustomers,
  useCustomer,
  useCustomerStats,
} from './hooks/useCustomers';
