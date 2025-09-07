/**
 * TypeScript type definitions for Playwright tests
 */

// Test data interfaces
export interface UserFormData {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  role?: string;
  office?: string;
  department?: string;
  jobPosition?: string;
  isActive?: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface TestUser {
  id?: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  role: string;
  office: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// API response interfaces
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  status?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Test result interfaces
export interface TestResult {
  passed: boolean;
  duration: number;
  error?: string;
  screenshot?: string;
  video?: string;
}

export interface TestSuiteResult {
  name: string;
  tests: TestResult[];
  passed: number;
  failed: number;
  duration: number;
}

// Browser configuration
export interface BrowserConfig {
  name: string;
  viewport?: { width: number; height: number };
  device?: string;
  headless?: boolean;
}

// Test configuration
export interface TestConfig {
  baseURL: string;
  timeout: number;
  retries: number;
  workers: number;
  browsers: BrowserConfig[];
}

// Selector types for better type safety
export type SelectorType =
  | 'form'
  | 'input'
  | 'button'
  | 'dropdown'
  | 'table'
  | 'navigation'
  | 'modal'
  | 'alert';

// Test context interface
export interface TestContext {
  page: any; // Playwright Page
  browserName?: string;
  config: TestConfig;
  testData: Record<string, any>;
}

// Utility types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
