# PRD: Notification System

## Overview

The Notification System delivers in-app and email notifications to users based on events across the HSE Dashboard (approvals, incidents, work permits, enrollments, reminders). Notifications can be targeted by role, user, department, and job position. Users view notifications in the navbar dropdown and on a dedicated Notifications page with filtering, search, and mark-as-read.

**Scope:** Backend `notifications` and `mail` modules; frontend `notifications` module; integration points in incidents, work-permits, enrollments, reminders, and approvals.

**Channels:** In-app (stored in DB, shown in UI), Email (SMTP via Nodemailer, template-based).

## Key Features

- **In-app notifications:** Create, list (paginated), filter (context, type, read status), search, mark as read / mark all read, delete; unread count; context-based navigation to related entities.
- **Email notifications:** Automatic email sending when notifications are created (async, non-blocking); Handlebars template; configurable SMTP (Gmail, Mailgun, custom).
- **Targeting:** By role(s), specific user(s), department(s), job position(s), or combinations.
- **Notification types:** Master data (e.g. APPROVAL_APPROVED, INCIDENT_APPROVED, REMINDER); used for filtering and categorization.
- **Scheduled notifications:** Reminders module creates notifications when reminders are due (cron every minute); supports recurring (daily, weekly, monthly) and targets (user, role, department, office).
- **Integration:** Triggered from incidents (submit, approve, reject), work permits (submit, approve, reject, status changes), enrollments (course assigned), master approvals (approve/reject, next approver), and reminder scheduler.

## User Roles & Permissions

- **notification:list** — list own notifications (filtered by current user’s role/department/job position).
- **notification:read** — get one notification, unread count.
- **notification:create** — create notification (typically used by other modules, not end users).
- **notification:update** — update notification (e.g. mark as read), mark all read.
- **notification:delete** — delete notification (admin).

## Functional Requirements

| ID    | Requirement | Description |
|-------|-------------|-------------|
| FR-01 | In-app delivery | Notifications are stored and retrievable per user with correct targeting. |
| FR-02 | Email delivery | Notifications trigger email to recipients when created (async). |
| FR-03 | Targeting | Support role, user, department, job position (and combinations). |
| FR-04 | Read tracking | Per-recipient read status; unread count; mark one / mark all read. |
| FR-05 | Types & categorization | Notification types from master data; filter by type. |
| FR-06 | Search & filter | Search by title/message/context; filter by context, type, read status. |
| FR-07 | Pagination | List supports page, limit, sortBy, sortOrder. |
| FR-08 | Mark as read | PATCH :id/read and PATCH mark-all-read. |
| FR-09 | Context navigation | context + contextId map to routes (e.g. incident detail, work permit detail). |
| FR-10 | Scheduled (reminders) | Reminder scheduler creates notifications when due; no duplicate emails. |

## Non-Functional Requirements

| ID     | Requirement | Description |
|--------|-------------|-------------|
| NFR-01 | Performance | In-app notification creation and list response &lt; 3s under normal load. |
| NFR-02 | Scalability | Support 10k+ users; pagination and indexed queries. |
| NFR-03 | Reliability | In-app creation not blocked by email failures; email errors logged. |
| NFR-04 | Email | Email sending async, non-blocking; template-based. |
| NFR-05 | Data | Efficient queries; recipient matching by user’s role, department, job position. |

## User Stories

- As a user, I can see a notification bell in the navbar with unread count so that I am aware of new activity.
- As a user, I can open the dropdown to see recent notifications and mark them as read or mark all as read.
- As a user, I can open the full Notifications page to search, filter, and paginate so that I can manage my notifications.
- As a user, I can click a notification to go to the related entity (e.g. incident, work permit) so that I can act on it.
- As a requester, I receive one in-app and one email when my request is approved or rejected.
- As an approver, I receive one in-app and one email when a request is assigned to me.
- As a user, I receive reminder notifications (and at most one email per reminder) when a reminder is due.

## Key Workflows

1. **Create notification:** Module (e.g. incidents) calls `NotificationsService.createNotificationForRoles()` or `createNotificationByDepartmentAndJobPosition()` with title, message, context, contextId, typeId, and targets → one DB record + recipients; emails sent async.
2. **List notifications:** User opens dropdown or Notifications page → GET /notifications with filters → results filtered by current user’s role/department/job position.
3. **Unread count:** Navbar and page call GET /notifications/unread-count → badge and stats updated.
4. **Mark as read:** User clicks notification or “Mark all read” → PATCH :id/read or PATCH mark-all-read.
5. **Reminder due:** Cron runs every minute → due reminders → create notification (single path) → emails sent once (no duplicate send).

## Data Model Summary

- **NotificationType (m_notification_types):** id, name (unique), description, isActive. Master data for categorization.
- **Notification (t_notifications):** id, title, message, context, contextId, typeId, isRead, isActive, createdAt, updatedAt, readAt, createdBy. Relations: type, recipients, creator.
- **NotificationRecipient (t_notification_recipients):** id, notificationId, roleId, userId?, departmentId?, jobPositionId?, isRead, readAt. Unique on (notificationId, roleId, userId, departmentId, jobPositionId). Read status is per recipient.

## API Endpoints Summary

| Method | Path | Permission | Description |
|--------|------|------------|-------------|
| GET | /notifications | notification:list | List with page, limit, search, sortBy, sortOrder, isRead, context, typeId |
| GET | /notifications/unread-count | notification:read | Unread count for current user |
| GET | /notifications/types | notification:list | List notification types |
| GET | /notifications/:id | notification:read | Get one notification |
| POST | /notifications | notification:create | Create (title, message, context, contextId, typeId, roleIds, userIds?, departmentIds?, jobPositionIds?) |
| PATCH | /notifications/:id | notification:update | Update notification |
| PATCH | /notifications/:id/read | notification:update | Mark as read |
| PATCH | /notifications/mark-all-read | notification:update | Mark all as read |
| DELETE | /notifications/:id | notification:delete | Delete notification |

## Technical Architecture

- **Backend:** NestJS; Prisma (PostgreSQL); NotificationsService (create, list, mark read, unread count); MailService (Nodemailer, Handlebars); MailModule used by NotificationsService. Reminders use NotificationsService for creation; email must be sent only once (see Bug Register).
- **Frontend:** React; `notifications` module: NotificationDropdown, NotificationItem, NotificationList, NotificationsPage; hooks: useNotifications, useNotification, useNotificationTypes, useUnreadCount; notificationService (API); notificationRoutes (context → route mapping). No WebSocket/polling; manual refresh only.

## Frontend Implementation Details

- **Components:** `NotificationDropdown` (navbar bell with unread badge, recent list, mark all read, view all); `NotificationList` (reusable list with loading/empty states); `NotificationItem` (title, message, context badge, timestamp, read indicator, click-to-navigate, optional mark read/unread actions).
- **Pages:** `NotificationsPage` — full list with stats cards (total, unread, read), search, filters (context, type), tabs (All/Unread/Read), pagination (page controls, page size 10/25/50/100), mark all read, refresh.
- **Hooks:** `useNotifications` (list, fetch, create, update, delete, markAsRead, markAllAsRead); `useNotification(id)` (single notification); `useNotificationTypes` (types for filters); `useUnreadCount` (badge count, markAsRead/markAllAsRead sync).
- **Services:** `notificationService` — getNotifications (paginated), getNotificationById, getUnreadCount, getNotificationTypes, createNotification, updateNotification, markAsRead, markAllAsRead, deleteNotification; DTO mappers (DTO → frontend models).
- **Routing:** `notificationRoutes.ts` — route config for `/notifications`; `utils/notificationRoutes.ts` — `normalizeContext()` (snake_case → kebab-case), `getNotificationRoute(context, contextId)`, `useNotificationNavigation()`; context → route map for 20+ contexts (risk-assessment, work-permit, enrollment, approval, user, role, etc.).
- **Integration:** `NotificationDropdown` rendered in `TopNavbar`; no real-time transport (manual refresh only).

## Known Frontend Limitations

- **Pagination UI:** Fixed. NotificationsPage now has visible pagination controls (prev/next, page X of Y, page size selector 10/25/50/100).
- **Missing context mappings:** Backend may send `context: 'incident'` or reminder entity contexts; frontend route map does not include `incident` or generic reminder. Clicking such notifications falls back to `/notifications`. Acknowledged; not fixed in current scope.
- **DTO fields:** Frontend `NotificationRecipient` types omit `departmentId` and `jobPositionId`; `NotificationFormData` omits `departmentIds` and `jobPositionIds`. Acknowledged; creation/targeting from UI is limited to roles/users.
- **No auto-refresh:** No WebSocket, SSE, or polling; users must refresh or navigate to see new notifications. By design per current scope.

## Frontend–Backend Contract

- **Context naming:** Backend may send context in snake_case (e.g. `work_permit`, `risk_assessment`) or kebab-case; frontend normalizes to kebab-case for route lookup. Route paths are kebab-case (e.g. `/work-permits/:id`).
- **DTO alignment:** Backend NotificationRecipientDto includes `departmentId?`, `jobPositionId?`; frontend NotificationRecipientDTO does not. Backend create payload accepts `departmentIds?`, `jobPositionIds?`; frontend form data does not expose these. List and read behaviour is unchanged.
- **Pagination:** API uses `page` (1-based), `limit`; frontend uses `pageIndex` (0-based) and sends `page: pageIndex + 1`. Response `meta.total` drives total count and page count on the frontend.

## Acceptance Criteria

- Notification is created when an event (e.g. approval, submit) occurs.
- Each event results in at most one in-app notification and one email per recipient (no duplicates).
- Unread count is correct after mark-as-read and new notifications.
- List and filters (context, type, read status, search) return correct results.
- Context navigation from notification leads to the correct entity page.
- Reminder due creates one notification and sends email once.

## Edge Cases

- User has multiple roles: recipient matching includes any matching role/department/job position.
- User in multiple departments: targeting by department may yield multiple recipient rows for same user if schema allows; read status per recipient.
- Notification target (user/role/department) no longer exists: creation still allowed; list filters by current user so orphaned recipients do not break UX.
- Email delivery failure: logged; in-app notification still created; no retry in current design.
- Concurrent creation: no idempotency key in current design; duplicate events can cause duplicate notifications (see Bug Register).

## Security & Privacy

- All notification endpoints require JWT and permissions.
- List and unread count filtered by current user (recipient match).
- Email content uses title, message, context; no sensitive data in templates beyond what is in the notification.
- Only intended recipients receive notifications (role/department/job position and optional userId filter).

## Dependencies

- **Backend:** Prisma (Notification, NotificationRecipient, NotificationType, User, Role, Department, JobPosition), MailModule, SharedModule; modules that trigger notifications (incidents, work-permits, enrollments, reminders, approvals).
- **Frontend:** Auth, core API, routing, design system (TRD); no real-time transport.

## References

- Bug register and fix details: [docs/notification-bugs.md](notification-bugs.md)
- QA test plan: [docs/notification-qa-test-plan.md](notification-qa-test-plan.md)
