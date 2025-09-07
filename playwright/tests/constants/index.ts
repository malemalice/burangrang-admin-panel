/**
 * Global constants for Playwright tests
 * Keep It Simple, Stupid (KISS) - centralized configuration
 */

// Base URLs
export const BASE_URLS = {
  FRONTEND: 'http://localhost:8080',
  BACKEND: 'http://localhost:3000',
} as const;

// Test Credentials
export const TEST_CREDENTIALS = {
  ADMIN: {
    email: 'admin@example.com',
    password: 'admin123',
  },
  USER: {
    email: 'user@example.com',
    password: 'user123',
  },
} as const;

// API Endpoints
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
  },
  USERS: '/users',
  ROLES: '/roles',
  OFFICES: '/offices',
  DEPARTMENTS: '/departments',
  JOB_POSITIONS: '/job-positions',
} as const;

// Test Data
export const TEST_DATA = {
  USERS: {
    VALID_USER: {
      firstName: 'John',
      lastName: 'Doe',
      email: `john.doe.${Date.now()}@example.com`, // Unique email
      password: 'password123',
      role: 'User',
      office: 'Headquarters',
    },
    INVALID_USER: {
      firstName: '',
      lastName: '',
      email: 'invalid-email',
      password: '123',
      role: '',
      office: '',
    },
  },
  ROLES: ['Admin', 'User', 'Manager'],
  OFFICES: ['Headquarters', 'Branch Office', 'Remote'],
} as const;

// Timeouts
export const TIMEOUTS = {
  NAVIGATION: 10000,
  ELEMENT_WAIT: 5000,
  API_RESPONSE: 10000,
  FORM_SUBMIT: 15000,
  DROPDOWN_LOAD: 3000,
  PAGE_LOAD: 10000,
} as const;

// Selectors (commonly used across tests)
export const SELECTORS = {
  // Form elements
  FORM: 'form',
  SUBMIT_BUTTON: 'button[type="submit"]',
  CANCEL_BUTTON: 'button[type="submit"], button:has-text("cancel"), button:has-text("Cancel")',

  // Navigation
  SIDEBAR: 'aside[class*="sidebar"], aside[class*="fixed"]',
  SIDEBAR_TOGGLE: 'button:has-text("close"), button:has-text("menu"), button:has-text("toggle")',

  // Loading states
  LOADING_SPINNER: '.loading, .spinner, [aria-busy="true"]',
  LOADING_TEXT: '.loading, .spinner, [aria-busy="true"]',

  // Error states
  ERROR_MESSAGE: '.error, [role="alert"], .text-red-600, .text-destructive',
  SUCCESS_MESSAGE: '.success, [role="alert"], .text-green-600',

  // Validation
  REQUIRED_ERROR: '.error:has-text("required"), [role="alert"]:has-text("required")',
  VALIDATION_ERROR: '.error, [role="alert"]',

  // Tables
  TABLE_ROW: 'tbody tr, [role="row"]',
  TABLE_HEADER: 'thead th, [role="columnheader"]',

  // Dropdowns
  DROPDOWN_OPTION: '[role="option"], .option',
} as const;

// Common test configurations
export const TEST_CONFIG = {
  BROWSERS: ['chromium', 'firefox', 'webkit'],
  VIEWPORTS: {
    DESKTOP: { width: 1280, height: 720 },
    MOBILE: { width: 375, height: 667 },
    TABLET: { width: 768, height: 1024 },
  },
  RETRY_COUNT: 2,
} as const;

// Environment-specific configurations
export const ENVIRONMENT = {
  CURRENT: process.env.NODE_ENV || 'development',
  IS_CI: !!process.env.CI,
  IS_DEBUG: !!process.env.DEBUG,
} as const;
