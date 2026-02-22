# Notification System — Bug Register

This document lists identified bugs with code locations, root cause, impact, and fix approach. See [prd-notifications.md](prd-notifications.md) for product requirements and [notification-qa-test-plan.md](notification-qa-test-plan.md) for verification.

---

## Bug #1: Double Notifications in Approval Workflows (CRITICAL)

### Summary
When an incident or work permit is approved or rejected, the requester (and optionally the next approver) receive **two** in-app notifications and **two** emails for the same event.

### Root Cause
1. `MasterApprovalsService.submitApproval()` is called by the incident/work-permit service.
2. `submitApproval()` **always** calls `sendApprovalNotifications()`, which creates notifications and sends emails (via `NotificationsService.createNotificationForRoles()` / `createNotificationByDepartmentAndJobPosition()`, which in turn send emails asynchronously).
3. The calling service **then** calls its own notification method (e.g. `sendApprovalCompletedNotification()`, `sendRejectionNotification()`), creating a second notification and triggering a second email.

### Affected Modules
- **Incidents:** approve and reject flows.
- **Work Permits:** approve and reject flows.

### Code Evidence

#### Master Approvals (sends first notification)
**File:** `backend/src/modules/approvals/master-approvals.service.ts`

```typescript
// Inside submitApproval(), after approval record is submitted:
// Send notifications
await this.sendApprovalNotifications(
  submitApprovalDto.dataId,
  submitApprovalDto.entity,
  submitApprovalDto.status,
  checkApprovalStatus,
  user,
);
```

`sendApprovalNotifications()` (same file, ~lines 1281–1330) calls:
- `this.notificationsService.createNotificationForRoles(...)` to notify the requester (approved/rejected).
- `this.notificationsService.createNotificationByDepartmentAndJobPosition(...)` to notify the next approver when status is APPROVED.

Each of these creates one in-app notification and triggers email sending inside `NotificationsService`.

#### Incidents (sends duplicate)
**File:** `backend/src/modules/incidents/services/incidents.service.ts`

**Approval flow (lines 893–962):**
```typescript
// Submit approval record
await this.masterApprovalsService.submitApproval(
  { entity: 'INCIDENT', dataId: id, status: ApprovalStatus.APPROVED, notes: notes || '' },
  user,
);
// ... status check and incident update ...

// Send notifications  <-- DUPLICATE: masterApprovalsService already sent
if (nextStatus === GeneralStatusEnum.CLOSE) {
  await this.sendApprovalCompletedNotification(id, updated);
} else {
  await this.sendApprovalProgressNotification(id, updated);
}
```

**Rejection flow (lines 996–1047):**
```typescript
await this.masterApprovalsService.submitApproval(
  { entity: 'INCIDENT', dataId: id, status: ApprovalStatus.REJECTED, notes: reason },
  user,
);
// ... incident update ...

// Send rejection notification  <-- DUPLICATE
await this.sendRejectionNotification(id, updated, reason);
```

#### Work Permits (sends duplicate)
**File:** `backend/src/modules/work-permits/work-permits.service.ts`

**Approval flow (lines 1405–1457):**
```typescript
await this.masterApprovalsService.submitApproval(
  { entity: APPROVAL_ENTITIES.WORK_PERMIT, dataId: id, status: ApprovalStatus.APPROVED, notes: approveDto.notes || '' },
  user,
);
// ... status update ...

// Send notifications  <-- DUPLICATE
if (nextStatus === WorkPermitStatusEnum.APPROVED) {
  await this.sendApprovalNotifications(id, updated);
} else if (nextStatus === WorkPermitStatusEnum.IN_REVIEW_SECURITY) {
  await this.sendNotificationToSecurity(id, updated);
}
```

**Rejection flow (lines 1510–1521):**
```typescript
await this.masterApprovalsService.submitApproval(
  { entity: APPROVAL_ENTITIES.WORK_PERMIT, dataId: id, status: ApprovalStatus.REJECTED, notes: ... },
  user,
);
// Send rejection notification  <-- DUPLICATE
await this.sendRejectionNotification(id, updated, rejectDto.reason);
```

### Impact
- **User:** Two in-app notifications and two emails per approval/rejection event.
- **UX:** Confusion, notification fatigue, loss of trust in “one event = one notification”.
- **Support:** QA and users report “doubled notifications”.

### Fix (see implementation)
Remove the **second** notification call from the calling services and rely on `MasterApprovalsService.sendApprovalNotifications()` as the single source for approval/rejection notifications.  
Concretely: remove calls to `sendApprovalCompletedNotification`, `sendApprovalProgressNotification`, and `sendRejectionNotification` from incidents service after `submitApproval()`; remove `sendApprovalNotifications` and `sendRejectionNotification` from work-permits service after `submitApproval()`.  
Work-permit–specific flows (e.g. “forward to Security”) may still send their own **additional** notification (e.g. `sendNotificationToSecurity`) if that is a distinct event not already covered by master approvals.

---

## Bug #2: Double Emails in Reminder System (MEDIUM)

### Summary
When a reminder is due, each recipient receives **two** emails: one from `NotificationsService` (triggered by `createNotificationForRoles`) and one from `RemindersScheduler.sendReminderEmail()`.

### Root Cause
1. `RemindersScheduler.processReminder()` calls `this.notificationsService.createNotificationForRoles(...)`.
2. `NotificationsService.createNotificationForRoles()` **always** sends emails asynchronously (see `notifications.service.ts` ~311–323: `collectEmailAddresses` then `sendNotificationEmails`).
3. The scheduler then loops over recipients and calls `this.sendReminderEmail(recipient, reminder)` for each, sending a second email per recipient.

### Code Evidence

#### NotificationsService sends email on create
**File:** `backend/src/modules/notifications/services/notifications.service.ts`

```typescript
// After creating notification and recipients (inside createNotificationForRoles):
// Send email notifications asynchronously (don't block notification creation)
this.collectEmailAddresses(recipients)
  .then((emailAddresses) => {
    return this.sendNotificationEmails(
      createDto.title,
      createDto.message,
      emailAddresses,
      createDto.context,
      createDto.contextId,
    );
  })
  .catch((error) => {
    this.logger.error(`Failed to send notification emails: ${error}`);
  });
```

#### Scheduler sends email again
**File:** `backend/src/modules/reminders/reminders.scheduler.ts`

```typescript
// Lines 105–116: creates notification (which triggers emails above)
const notification = await this.notificationsService.createNotificationForRoles(
  { title: 'Reminder', message: reminder.message, context: reminder.entity ?? undefined, contextId: reminder.entityId ?? undefined, typeId: ..., roleIds },
  reminder.createdBy,
);

// Lines 131–145: sends emails again per recipient
for (const recipient of recipients) {
  try {
    await this.sendReminderEmail(recipient, reminder);
    emailSentCount++;
  } catch (emailError) { ... }
}
```

### Impact
- **User:** Two emails per reminder per recipient.
- **Email load:** Unnecessary SMTP traffic and risk of being flagged as noisy.

### Fix (see implementation)
Remove the duplicate email loop from the reminder scheduler. Rely on `NotificationsService.createNotificationForRoles()` to send the single email; remove the `for (const recipient of recipients) { await this.sendReminderEmail(...) }` block (and adjust any reminder log that depends on `emailSent` to use the fact that notification creation triggers email, or leave logging as-is if it can be inferred from notification creation).

---

## Bug #3: No Real-time Updates (Feature Gap)

### Summary
New notifications appear only after a full refresh, route change, or manual “Refresh” click. There is no WebSocket, SSE, or polling.

### Code Evidence
- **Frontend:** No subscription to a real-time channel; `useUnreadCount` and list data are fetched only on mount or explicit refetch.
- **Backend:** No WebSocket/SSE endpoint for notifications.

### Impact
- Users may miss or delay seeing time-sensitive notifications (e.g. approval requests).
- Unread count in the navbar can be stale until the user refreshes or navigates.

### Fix
Out of scope for the current bug-fix set. Consider adding WebSocket/SSE or polling in a future iteration; documented in PRD and here for awareness.

---

## Bug #4: No Notification Deduplication / Idempotency

### Summary
Repeated calls for the same logical event (e.g. retries, double-clicks, or multiple code paths) can create multiple identical notifications. There is no idempotency key or “recent duplicate” check.

### Code Evidence
- `NotificationsService.createNotificationForRoles()` and `createNotificationByDepartmentAndJobPosition()` do not accept an idempotency key.
- No check such as “same title + context + contextId + recipient set within last N minutes” before creating.

### Impact
- Duplicate in-app and email notifications under retries or race conditions.
- Harder to diagnose “doubled” reports if both Bug #1 and duplicate calls occur.

### Fix
Optional follow-up: add an optional idempotency key or a deduplication window (e.g. same context + contextId + type + main recipients within 1–5 minutes) in `NotificationsService` to skip or merge duplicates. Not implemented in the current fix set; documented for future work.

---

## Summary Table

| Bug | Severity | Affected Area | Fix in this pass |
|-----|----------|---------------|------------------|
| #1 Double notifications (approval workflows) | Critical | Incidents, Work Permits | Yes – remove duplicate calls |
| #2 Double emails (reminders) | Medium | Reminders scheduler | Yes – remove duplicate email loop |
| #3 No real-time | Low (gap) | Frontend | No – documented |
| #4 No deduplication | Low | NotificationsService | No – documented |

---

## Fix Implementation Summary

### Bug #1 (Double notifications – approval workflows)

**backend/src/modules/incidents/services/incidents.service.ts**
- Removed call to `sendApprovalCompletedNotification()` and `sendApprovalProgressNotification()` after `submitApproval()` in the approve flow. Replaced with a comment that notifications are sent by `MasterApprovalsService.submitApproval()`.
- Removed call to `sendRejectionNotification()` after `submitApproval()` in the reject flow. Replaced with the same comment.
- Removed unused private methods: `sendApprovalCompletedNotification`, `sendApprovalProgressNotification`, `sendRejectionNotification`.

**backend/src/modules/work-permits/work-permits.service.ts**
- Removed the entire “Send notifications” block after approve (including `sendApprovalNotifications`, `sendNotificationToSecurity`, and the else branch). Replaced with a comment that notifications are sent by `MasterApprovalsService.submitApproval()`.
- Removed call to `sendRejectionNotification()` after `submitApproval()` in the reject flow. Replaced with the same comment.
- Removed unused private methods: `sendNotificationToSecurity`, `sendApprovalNotifications`, `sendRejectionNotification`.

### Bug #2 (Double emails – reminders)

**backend/src/modules/reminders/reminders.scheduler.ts**
- Removed the `for (const recipient of recipients) { await this.sendReminderEmail(recipient, reminder); }` loop so emails are sent only by `NotificationsService.createNotificationForRoles()`.
- When a notification is created successfully and there are recipients, set `emailSent = true` and `emailSentCount = recipients.length` for reminder execution logging, and added a debug log that emails are sent via NotificationsService.
- The private method `sendReminderEmail` remains in the file but is no longer called (dead code; can be removed in a later cleanup if desired).
