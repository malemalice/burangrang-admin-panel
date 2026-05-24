> [← Modules Index](./index.md) · [← Backend TRD Index](../index.md)

## Reminder Module

### Overview

The Reminder Module provides a comprehensive scheduling and notification system that allows users to create one-time and recurring reminders associated with various business entities (e.g., incidents, audits, inspections). The system automatically triggers notifications and sends emails when reminders are due.

### Key Features

1. **Reminder Scheduling**
   - Create one-time reminders for specific dates/times
   - Create recurring reminders (weekly, monthly)
   - Dynamic entity linking via context and contextId
   - Automatic expiration handling for recurring reminders

2. **Automated Execution**
   - Cron job runs every 1 minute to process due reminders
   - Processes up to 500 reminders per execution cycle
   - Prevents duplicate execution with lock mechanism
   - Comprehensive error handling and recovery

3. **Notification Integration**
   - Automatically creates in-app notifications when reminders trigger
   - Links reminders to business entities (incidents, audits, inspections)
   - Role-based notification delivery
   - Complete execution audit trail

4. **Email Notifications**
   - Email sending capability (placeholder ready for integration)
   - Email error tracking and logging
   - Supports Nodemailer, AWS SES, or SMTP integration

5. **Status Management**
   - Status lifecycle: PENDING → SENT/EXPIRED/CANCELLED/FAILED
   - Automatic status updates based on execution results
   - Manual cancellation support
   - Failed execution tracking with error details

### Database Schema

#### Transactional Data Tables
- `t_reminders` - Scheduled reminders with recurrence support
  - Fields: userId, entity, entityId, message, remindAt, repeatType, repeatUntil, status, lastSentAt
  - Indexes: (status, remindAt), userId, (entity, entityId)
- `t_reminder_logs` - Audit trail for reminder executions
  - Fields: reminderId, executionStatus, executionDuration, failureReason, notificationId, emailSent, emailError
  - Indexes: reminderId, executedAt, executionStatus

#### Enums
- `ReminderStatusEnum`: PENDING, SENT, EXPIRED, CANCELLED, FAILED
- `ReminderRepeatTypeEnum`: NONE, WEEKLY, MONTHLY

### Module Structure

```
backend/src/modules/reminders/
├── dto/
│   ├── reminder.dto.ts              # ReminderDto, ReminderLogDto, Enums
│   ├── create-reminder.dto.ts       # Create reminder input
│   ├── update-reminder.dto.ts       # Update reminder input
│   └── find-reminders.dto.ts        # Query parameters with filters
├── reminders.service.ts              # Business logic & CRUD operations
├── reminders.controller.ts           # REST API endpoints
├── reminders.scheduler.ts            # Cron job processor
├── reminders.module.ts               # Module configuration
├── README.md                         # Comprehensive documentation
└── QUICK_START.md                    # Quick start guide
```

### API Endpoints

#### Reminder Management
- `POST /reminders` - Create new reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
  - **Body**: CreateReminderDto (message, remindAt, entity, entityId, repeatType, repeatUntil)
- `GET /reminders` - List reminders with pagination and filtering
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
  - **Query Params**: page, limit, sortBy, sortOrder, search, status, entity, entityId, fromDate, toDate
- `GET /reminders/:id` - Get single reminder by ID
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `GET /reminders/:id/logs` - Get execution logs for a reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `PATCH /reminders/:id` - Update reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER
- `DELETE /reminders/:id` - Cancel/delete reminder
  - **Required Roles**: ADMIN, SUPER_ADMIN, MANAGER, USER

### Cron Job Specification

#### Execution Frequency
- Runs every 1 minute using `@Cron(CronExpression.EVERY_MINUTE)`
- Processes reminders where: `status = 'PENDING'` AND `remindAt <= NOW()`
- Maximum batch size: 500 reminders per execution cycle

#### Processing Flow
1. Fetch due reminders from database
2. For each reminder:
   - Get user details
   - Create in-app notification
   - Send email notification (if configured)
   - Log execution results
   - Update reminder status
3. Handle recurring reminders:
   - Calculate next execution time (weekly: +7 days, monthly: +1 month)
   - Check if exceeds repeatUntil date
   - Mark as EXPIRED if completed, otherwise reschedule

### Recurrence Logic

- **WEEKLY**: Adds 7 days to current remindAt date
- **MONTHLY**: Adds 1 month to current remindAt date
- **Expiration**: If next execution exceeds repeatUntil, reminder is marked as EXPIRED

### Usage Examples

#### Create One-time Reminder
```bash
POST /reminders
{
  "message": "Submit monthly HSE report",
  "remindAt": "2025-11-30T09:00:00Z"
}
```

#### Create Weekly Recurring Reminder
```bash
POST /reminders
{
  "entity": "t_incidents",
  "entityId": "incident-uuid",
  "message": "Weekly follow-up on unresolved incident",
  "remindAt": "2025-11-25T10:00:00Z",
  "repeatType": "WEEKLY",
  "repeatUntil": "2025-12-31T23:59:59Z"
}
```

### Security Features

- **Authentication**: JWT-based authentication required for all endpoints
- **Authorization**: Role-based access control (all roles can manage their own reminders)
- **Ownership**: Users can only view, update, and delete their own reminders
- **Input Validation**: Comprehensive validation using class-validator
- **SQL Injection Protection**: Prisma ORM provides parameterized queries

### Error Handling

- **Email Failure**: Logs error but doesn't mark reminder as failed if notification was created
- **Notification Failure**: Marks reminder as FAILED and logs reason
- **User Not Found**: Logs error and marks reminder as FAILED
- **Concurrent Execution**: Prevents duplicate processing using lock flag
- **Execution Logging**: All executions logged with duration, status, and error details

### Performance Requirements

- **Reminder Scan Latency**: < 200ms (per requirement)
- **Batch Size**: Maximum 500 reminders per execution cycle
- **Database Indexes**: Optimized indexes on (status, remindAt), userId, (entity, entityId)
- **Execution Duration Tracking**: Monitors processing time for performance optimization

### Integration with Other Modules

#### Notifications Module
- Creates in-app notifications when reminders are triggered
- Uses "REMINDER" notification type (auto-created if not exists)
- Targets user's role for notification delivery

#### Email Service (To Be Implemented)
- Placeholder for email sending logic in `reminders.scheduler.ts`
- Ready for integration with Nodemailer, AWS SES, or SMTP
- Email template includes reminder message and context

### Configuration

#### Environment Variables
```env
# No additional configuration required
# Cron job is automatically enabled when module is imported
```

#### Dependencies
- `@nestjs/schedule` - Required for cron job functionality
- `@nestjs/common` - Core NestJS functionality
- `@prisma/client` - Database access

### TRD Compliance

- **Module Structure**: Follows standard directory structure with DTOs, controller, service, and module files
- **Controller Pattern**: Uses required decorators (`@ApiTags`, `@ApiBearerAuth`, `@UseGuards`) and complete Swagger documentation
- **Service Pattern**: Injects necessary services (`PrismaService`, `ErrorHandlingService`, `DtoMapperService`) and uses standardized error handling and DTO mapping
- **DTO Pattern**: Implements proper validation, serialization, and documentation decorators
- **Security**: Implements role-based access control and user ownership validation
- **Error Handling**: Uses ErrorHandlingService consistently throughout
- **Pagination**: Standard pagination implementation with filtering and sorting

### Future Enhancements

- Queue-based processing (RabbitMQ / Redis)
- Multiple notification channels (SMS, Push Notification)
- Retry strategy with exponential backoff
- Reminder priority levels (High / Medium / Low)
- Timezone support for global users
- DST (Daylight Saving Time) handling
- Bulk reminder creation
- Reminder templates for common use cases

This TRD serves as the authoritative guide for backend development in the BurangrangAdmin Panel project. All new implementations must follow these established patterns and conventions. Any deviations must be documented and approved. 🚀
