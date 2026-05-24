> [← Frontend TRD Index](./index.md)

# Technical Requirements Document (TRD)
## Frontend Modular Architecture Restructuring

### 📋 Document Information
- **Version**: 1.13
- **Date**: 2025-02-21
- **Status**: Active
- **Author**: Development Team
- **Last Updated**: Route-level code splitting (`React.lazy`) and edit-page vs form data-fetch principles

---

## 🎯 Executive Summary

This document outlines the technical requirements and architectural principles for restructuring the frontend application from a traditional layered architecture to a modular, feature-based architecture. The restructuring aims to improve maintainability, scalability, and developer experience while following modern frontend best practices.

**Version 1.13 Updates**: Added **Route-level code splitting** and **Edit page vs form data fetching** under Technical Implementation Guidelines. Module route files should use `React.lazy()` for page components so each route loads on demand (smaller dev-time graphs per navigation, clearer production chunks). Root `Suspense` is required (see `App.tsx`). Edit pages that only wrap a form must not duplicate entity hooks (`useX`, `fetchX`) already used inside the form—avoid redundant API calls and keep the page a thin shell (header + navigation). Reference: `quizRoutes.ts`, `certificateRoutes.tsx`, `EditCertificatePage.tsx`, `CertificateForm.tsx`.
**Version 1.12 Updates**: Added **PDF — Verification and approval (digital)** under Advanced Features: mandatory structure for PDF templates when an entity uses Master Approvals (`ApprovalStatusHistory`: summary line, workflow-by-step table, chronological log, empty state). Reference: `EnvironmentalMeasurementPDFTemplate`, `WeightReportPDFTemplate`.
**Version 1.11 Updates**: Added "Workflow Guideline UI — Principles for Creating Workflow Information" under Document Workflow & Status Management Patterns. Defines content principles (status per step, concrete ownership Who/Role-Dept, one-line description, terminal state), structure principles (sequential steps, consistent fields per step, short intro), and UI/UX principles (one card per step, semantic color, connectors, terminal callout, dialog layout). **Workflow guidelines must be dynamic**: approval steps (who approves) are driven by Master Approval configuration — fetch by entity from `approval-entities`, render approval lines from `masterApproval.items` (with sentinel labels), fallback when no config. Reference: MasterApprovalForm, InspectionItemsPage.
**Version 1.10 Updates**: Added "Data-Level Access (Backend)" — for data-scoped modules (Enrollments, Work Permits, Certificates, PPE Withdrawals) the backend enforces row-level access (SELF / DEPARTMENT / SUPER). Lists may return fewer rows or empty; single-record requests (get by id, update, delete) may return 403. Handle 403 with a clear message (e.g. "You do not have access to this record"); treat empty lists as valid, not as errors. Reference: Error Handling Patterns, docs/auth.md.
**Version 1.9 Updates**: Added "Options Bypass for Select/Dropdown Data" — when fetching list data for form dropdowns/selects, add `options: true` to query params so users without the specific `*:list` permission can still load options for forms they have access to. Use: `departmentService.getDepartments({ page: 1, limit: 100, options: true })`. Reference: UserForm, CertificateForm, Inter-Module API Calls.
**Version 1.8 Updates**: Added "PDF Export (Detail Page) — Implementation Principles" under Advanced Features: react-to-pdf, dedicated PDF template, full data fetch before capture, hidden target, data fallback, filename/UX, template structure. Reference: RiskAssessmentDetailPage, RiskAssessmentPDFTemplate.
**Version 1.7 Updates**: Added "List page state persistence (index → view → back)" under Search & Filters: URL as source of truth for list state, derive state from `useSearchParams`, sync URL on list actions, Back button uses `navigate(-1)`. Reference: AuditResultsPage, RiskRegisterPage, RisksPage.
**Version 1.6 Updates**: Added "Searchable Select/Combobox Inside Dialog Pattern" documenting critical aria-hidden conflicts when using portaled components (Popover, Select) inside Dialog modals. Provides solution using ModalCombobox component with absolute positioning (no portals) for guaranteed interactivity. Includes root cause analysis, failed solution attempts, implementation principles, and usage patterns.
**Version 1.5 Updates**: Added Dropdown + Dialog pattern to prevent focus trap issues when dropdown menus interact with dialogs. Includes state management, event handling, and cleanup patterns to ensure proper dropdown closing and prevent `aria-hidden` focus traps that block user interactions.
**Version 1.4 Updates**: Merged form layout principles from `frontend-form-general-layout.md`, including page structure patterns (PageHeader → max-w-4xl wrapper → Form Component), component hierarchy guidelines, layout patterns (two-column grid, spacing standards), state patterns (loading/error states), and action button patterns. Enhanced "Form Page Specific Guidelines" and "Form Component Patterns" sections with complete implementation examples and quick reference checklist.

**Version 1.3 Updates**: Added comprehensive UI/UX principles section for back-office systems, including user-centered design principles, layout patterns (Master-Detail, Data Density), component patterns (Data Tables, Search & Filters, Modal vs Page), advanced features (Bulk Actions, Undo/Redo, Audit Trails, Export), form-specific guidelines, and enhanced design system details (typography scale, spacing system, button hierarchy, icon usage, semantic status colors). Merged UI/UX principles from `ui-ux-principle.md` to provide complete design guidance.

**Version 1.2 Updates**: Added comprehensive design system documentation including color system, typography, spacing, component patterns, theme system, animations, and design system best practices. Provides complete reference for UI/UX consistency across all modules.

**Version 1.1 Updates**: Added comprehensive module interaction patterns including API calling conventions, table display standards, CRUD operation patterns, form handling guidelines, data transformation patterns, error handling strategies, and cross-module communication protocols. Includes implementation checklists, code examples library, and development workflow guidelines.

---

## 🏗️ Current State Analysis

### Current Modules Identified
1. **Core Module** (Dashboard, Settings, Login, NotFound)
2. **Users Module** (User management)
3. **Roles Module** (Role & permissions management)
4. **Menus Module** (Navigation menu management)
5. **Master Data Module** (Offices, Departments, Job Positions, Approvals)

---

## 🎯 Target Architecture

### Architectural Principles

#### 1. Domain-Driven Design (DDD)
- Groups related functionality by business domain
- Reduces cognitive load when working on specific features
- Follows the "screaming architecture" principle

#### 2. Feature-Based Architecture
- Each module is self-contained
- Easier to maintain, test, and scale
- Supports micro-frontend patterns if needed later

#### 3. Separation of Concerns
- Clear boundaries between modules
- Reduces coupling between different business areas
- Follows Single Responsibility Principle

#### 4. Scalability & Maintainability
- New modules won't affect existing ones
- Team members can work on different modules independently
- Easier onboarding for new developers
