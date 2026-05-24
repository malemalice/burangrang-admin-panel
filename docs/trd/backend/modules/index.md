# Backend Module-Specific TRDs — Index

> [← Backend TRD Index](../index.md)

These files document the design and contracts of specific backend modules that have non-trivial behaviour beyond the standard CRUD/guard pattern.

| Module | File | What it covers |
|---|---|---|
| Uploads | [upload.md](./upload.md) | File upload + storage abstraction (local now, cloud-ready), categories/limits, public/private access, audit |
| Reminders | [reminder.md](./reminder.md) | One-time + recurring reminders, cron job, notification + email integration |
| Approvals | [approval.md](./approval.md) | Master Approval workflow engine, sentinel resolution, sequential steps, audit history |
| Mail | [mail.md](./mail.md) | DB-backed Handlebars email templates, transport config, typed flows |

For generic backend patterns (controllers, services, DTOs, guards, etc.), see the parent [Backend TRD Index](../index.md).
