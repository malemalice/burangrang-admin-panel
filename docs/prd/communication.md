# PRD: Communication System

**Document type:** PRD
**Status:** Draft
**Audience:** Product, Backend, Frontend
**Last updated:** 2026-05-12

## Overview

The Communication System covers in-app **notifications** (CRUD, list for current user, mark read), **reminders** (CRUD, list for current user, scheduler for triggering), and **mail templates** (backend mail module: templates and sending; frontend mail-templates module: manage email templates). Notifications and reminders are user-facing; mail templates are used by the system for sending emails (password reset, course assignment, etc.).

**Scope:** Backend `notifications`, `reminders`, `mail` modules; frontend `notifications`, `reminders`, `mail-templates` modules.

## Key Features

- **Notifications:** Create (system or user), list for current user (paginated, isRead, search, sort), get one, update (e.g. mark read), delete. Used for in-app alerts (e.g. approval requested, certificate expiry). May have context (entity type, entity id) for deep links.
- **Reminders:** Create, list for current user (paginated, filters; options bypass), read, update, delete. Reminder has schedule (cron or date/time); reminders scheduler runs in backend to create notifications or send emails when due.
- **Mail templates:** Backend: Handlebars templates (password-reset, verification, course-assignment, notification, etc.); MailService sends emails. Frontend: List, create, edit, view email templates (mail-templates module) so that admins can manage template content. Template keys/placeholders documented or configurable.

## User Roles & Permissions

- **Notifications:** List/get/update/delete typically scoped to current user (own notifications). Create may require notification:create for system use. Role-based access on list (e.g. SUPER_ADMIN sees all or per-role).
- **Reminders:** reminder:create, reminder:list (options bypass), reminder:read, reminder:update, reminder:delete. List often filtered by current user.
- **Mail templates:** setting or mail-template permissions for CRUD on template entities. Sending is server-side (no direct "send" from client for arbitrary emails; used by auth, enrollment, etc.).

## User Stories

- As a user, I can see my notifications and mark them read so that I stay informed without clutter.
- As a user, I can create reminders (title, due date/schedule, message) so that I get notified or emailed when due.
- As an admin, I can manage email templates so that system emails (password reset, course assignment) use the right content and branding.
- As the system, I send emails using configured templates and mail provider so that users receive transactional emails.

## Key Workflows

1. **Notifications:** System or user creates notification (recipient, title, message, context) → recipient sees in list/dropdown → marks read (update). List filtered by user and optionally isRead, search.
2. **Reminders:** User creates reminder (schedule, message, recipient) → scheduler evaluates due reminders → creates notification or sends email. User lists/edits/deletes own reminders.
3. **Mail templates:** Admin edits template (subject, body with placeholders) → MailService uses template when sending (e.g. forgot-password calls mail.sendResetPassword with token link). No "send test" required for PRD scope; optional feature.

## Data Model Summary

- **Notification:** id, userId (recipient), title, message, context?, isRead, createdAt, etc. Relation: User.
- **Reminder:** id, userId (creator), title, message, remindAt/schedule, entity/context?, createdAt, etc. Scheduler reads remindAt or cron and triggers action.
- **Email template (mail):** Stored in DB or files (e.g. templates/*.hbs). Keys: app name, reset link, user name, etc. Mail module has MailService with sendResetPassword, sendVerification, sendCourseAssignment, etc.

## API Endpoints Summary

### Notifications
- GET /notifications — list (page, limit, search, sortBy, sortOrder, isRead) for current user
- GET /notifications/:id — get one
- POST /notifications — create (if permitted)
- PATCH /notifications/:id — update (e.g. mark read)
- DELETE /notifications/:id — delete

### Reminders
- POST /reminders — create
- GET /reminders — list (page, limit, sortBy, sortOrder, ...; options bypass)
- GET /reminders/:id — get one
- PATCH /reminders/:id — update
- DELETE /reminders/:id — delete
- (Optional) GET /reminders/logs or similar for reminder execution log

### Mail (backend)
- MailService used internally (no direct REST for "send email" from client; auth/forgot-password, enrollment assignment, etc. call MailService). Frontend may have GET/POST/PATCH for template CRUD if mail module exposes template API (e.g. /mail/templates).

## Frontend Pages & Components

- **Notifications:** NotificationsPage (full list), NotificationDropdown (navbar), NotificationItem, NotificationList. useNotifications hook. Routes: /notifications.
- **Reminders:** RemindersPage, CreateReminderPage, EditReminderPage, ReminderDetailPage, ReminderForm. useReminders. Routes: /reminders (list, new, :id, :id/edit).
- **Mail templates:** EmailTemplatesPage, CreateEmailTemplatePage, EditEmailTemplatePage, EmailTemplateDetailPage, EmailTemplateForm. useEmailTemplates. Routes: /mail-templates (or as configured).

## Dependencies

- **Backend:** Prisma (Notification, Reminder, User), MailModule (MailService, templates), RemindersScheduler (cron), JwtAuthGuard, PermissionsGuard, AllowOptionsBypass.
- **Frontend:** Auth, core API. Notification dropdown and list consume notifications API; settings/app name may affect mail template branding.

## Functional Requirements

- [FR-1] The system must support creating, listing (for current user, paginated), reading, updating (e.g. mark as read), and deleting in-app notifications.
- [FR-2] Notifications may carry a context (entity type + entity ID) to enable deep-link navigation from the notification.
- [FR-3] The system must support full CRUD for reminders, each with a schedule (cron or specific date/time) and recipient.
- [FR-4] The reminders scheduler must run in the backend and trigger notification creation or email sending when a reminder is due.
- [FR-5] The reminder list must support `options=true` bypass for dropdown use.
- [FR-6] Admins must be able to manage email templates (list, create, edit, view) for all system-generated emails.
- [FR-7] The mail service must send transactional emails using the stored templates and a configurable SMTP provider.

## Non-Functional Requirements

- [NFR-1] All list endpoints must return paginated results (default 10 per page; max 100).
- [NFR-2] All write operations must require a valid JWT and the corresponding permission.
- [NFR-3] Email sending must be asynchronous and non-blocking; a failed email must not cause the triggering API call to fail.
- [NFR-4] API responses must return within 2 seconds under normal load.
- [NFR-5] All UI components must support light and dark mode via semantic design tokens.

## Acceptance Criteria

| # | Scenario | Expected |
|---|---|---|
| AC-1 | System creates a notification for a user | Notification appears in `GET /notifications` for that user |
| AC-2 | User marks notification as read | `isRead: true` set; notification still visible until deleted |
| AC-3 | User creates a reminder with a future date | Reminder saved; scheduler triggers notification/email when date arrives |
| AC-4 | Admin creates an email template with placeholders | Template saved; MailService uses it when sending the corresponding email type |
| AC-5 | User deletes a notification | 200; notification no longer returned in list |

## Related Documents

- [`trd-authorization.md`](trd-authorization.md) — RBAC guard chain and permission enforcement
- [`notifications.md`](notifications.md) — detailed notification system specification
