# QA Test Plan: Notification System

**Scope:** Notification delivery (in-app and email), no duplicate notifications/emails, list/filter/mark-read, and regression after double-notification fixes.  
**References:** [prd-notifications.md](prd-notifications.md), [notification-bugs.md](notification-bugs.md).

---

## 1. Prerequisites

- Backend and frontend running; SMTP configured (or use a test inbox) so email can be verified.
- At least two users: **Requester** (submits incident/work permit), **Approver** (in approval chain). Requester and Approver must have valid email addresses in profile.
- Notification types seeded (e.g. APPROVAL_APPROVED, APPROVAL_REJECTED, INCIDENT_APPROVED, WORK_PERMIT_APPROVED, REMINDER, etc.).
- For reminders: at least one reminder configured (target USER or ROLE) that will become due during the test window, or trigger manually if supported.

---

## 2. Regression: No Duplicate Notifications (Critical)

These tests verify the fix for Bug #1: one approval/rejection must produce at most one in-app notification and one email per recipient.

### 2.1 Incident – Approve (final approval, status → CLOSE)

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| I-A1 | 1   | Requester submits incident (POST incident submit). | 200; incident status = pending approval. |
| I-A2 | 2   | Approver approves incident (final step so status → CLOSE). | 200; incident status = CLOSE. |
| I-A3 | 3   | As **Requester**: open Notifications (dropdown or page), filter by context “incident”. | **Exactly one** in-app notification for this incident approval (e.g. “INCIDENT Approval Approved” or similar from master approvals). |
| I-A4 | 4   | As **Requester**: check email inbox. | **Exactly one** email for this incident approval. |
| I-A5 | 5   | As **Requester**: count DB rows in `t_notifications` for this incident (contextId = incident id, title/message indicating approval). | **One** notification record for “approval completed” type message. |

### 2.2 Incident – Approve (progress to next approver)

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| I-B1 | 1   | Requester submits incident. | 200. |
| I-B2 | 2   | First approver approves (chain has more steps; status stays WAITING_APPROVAL). | 200. |
| I-B3 | 3   | As **Requester**: check in-app notifications. | **Exactly one** notification about approval progress (from master approvals). |
| I-B4 | 4   | As **Next approver**: check in-app notifications. | **Exactly one** “approval request” / “pending your approval” notification for this incident. |
| I-B5 | 5   | As **Next approver**: check email. | **Exactly one** email for this approval request. |

### 2.3 Incident – Reject

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| I-R1 | 1   | Requester submits incident. | 200. |
| I-R2 | 2   | Approver rejects incident (with reason). | 200; incident status = REJECTED. |
| I-R3 | 3   | As **Requester**: in-app notifications. | **Exactly one** rejection notification for this incident. |
| I-R4 | 4   | As **Requester**: email. | **Exactly one** rejection email. |
| I-R5 | 5   | DB: count notifications for this incident with “rejected” type. | **One** such notification. |

### 2.4 Work Permit – Approve (final or forward to Security)

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| W-A1 | 1   | Requester creates and submits work permit. | 200. |
| W-A2 | 2   | HSE approver approves (final or forward to Security). | 200. |
| W-A3 | 3   | As **Requester**: in-app notifications. | **Exactly one** approval/forward notification for this work permit. |
| W-A4 | 4   | As **Requester**: email. | **Exactly one** email. |
| W-A5 | 5   | If forwarded to Security: as **Security user**: in-app and email. | **Exactly one** in-app and **one** email for “pending your approval” / approval request. |

### 2.5 Work Permit – Reject

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| W-R1 | 1   | Requester submits work permit. | 200. |
| W-R2 | 2   | Approver rejects work permit. | 200. |
| W-R3 | 3   | As **Requester**: in-app and email. | **Exactly one** rejection in-app and **one** rejection email. |

---

## 3. Regression: No Duplicate Reminder Emails (Bug #2)

| ID   | Step | Action | Expected |
|------|------|--------|----------|
| RM1  | 1   | Create a reminder targeting a user (or role) with a valid email; set due time so it runs in the next cron cycle (e.g. within 1–2 minutes). | Reminder is due. |
| RM2  | 2   | Wait for reminder scheduler to run (cron every minute). | One notification created for the reminder (e.g. in `t_notifications` with context/contextId matching reminder). |
| RM3  | 3   | As target user: check email inbox. | **Exactly one** email for this reminder (no duplicate from scheduler + NotificationsService). |
| RM4  | 4   | As target user: in-app notifications. | One reminder notification. |

---

## 4. Functional: In-App Notifications

| ID   | Scenario | Action | Expected |
|------|----------|--------|----------|
| F1   | List     | GET /notifications (authenticated). | 200; list of notifications for current user (filtered by role/department/job position). |
| F2   | Unread count | GET /notifications/unread-count. | 200; number matches unread notifications for user. |
| F3   | Mark one read | PATCH /notifications/:id/read. | 200; that notification marked read; unread count decreases by 1. |
| F4   | Mark all read | PATCH /notifications/mark-all-read. | 200; all user’s notifications marked read; unread count = 0. |
| F5   | Filter by context | GET /notifications?context=incident. | 200; only notifications with context incident. |
| F6   | Filter by read status | GET /notifications?isRead=false. | 200; only unread. |
| F7   | Search | GET /notifications?search=Approved. | 200; only notifications whose title/message/context match. |
| F8   | Pagination | GET /notifications?page=1&limit=5. | 200; at most 5 items; total/count consistent. |
| F9   | Types | GET /notifications/types. | 200; list of notification types. |

---

## 5. Functional: UI and Navigation

| ID   | Scenario | Action | Expected |
|------|----------|--------|----------|
| U1   | Bell badge | Log in as user with unread notifications. | Navbar bell shows unread count (e.g. red badge). |
| U2   | Dropdown | Click bell; open dropdown. | Recent notifications visible; “Mark all read” and “View all” work. |
| U3   | Notifications page | Navigate to /notifications. | Page loads; list, filters (context, type, read), search, pagination work. |
| U4   | Context navigation | Click a notification with contextId (e.g. incident). | User is navigated to the correct detail page (e.g. incident/:id). |
| U5   | Mark read on click | Click a single notification in dropdown/page. | Notification marked read; unread count updates (after refresh if no real-time). |

---

## 6. Edge Cases and Sanity

| ID   | Scenario | Action | Expected |
|------|----------|--------|----------|
| E1   | Approver = Requester | Same user submits and approves (if allowed by config). | Notifications still created without duplicate; no crash. |
| E2   | No email address | User has no email in profile; trigger notification targeting them. | In-app notification created; email skip or graceful failure (no 500). |
| E3   | Multiple roles | User has multiple roles; notification targets one role. | User receives one notification (recipient matching works). |

---

## 7. Sign-Off Checklist

- [ ] All test cases in section 2 (no duplicate notifications) passed for incident and work permit approve/reject.
- [ ] Reminder test (section 3): exactly one email per reminder per recipient.
- [ ] Core API and UI tests (sections 4–5) passed.
- [ ] No new regression in approval workflows (approve/reject still update status and timeline correctly).
- [ ] Bug register [notification-bugs.md](notification-bugs.md) and fix implementation summary reviewed.
