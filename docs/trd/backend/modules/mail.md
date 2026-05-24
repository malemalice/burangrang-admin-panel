> [← Modules Index](./index.md) · [← Backend TRD Index](../index.md)
>
> *Mail module with DB-backed Handlebars templates (`m_email_templates`), typed flow methods (verification / password-reset / invitation / password-change), and settings-driven transport config.*

## Mail Services

### Overview

The Mail module centralizes email delivery using `@nestjs-modules/mailer` with Handlebars templates. Email templates are stored in the database and manageable via CRUD endpoints, enabling runtime updates without code deployments. The service provides typed methods for common flows (verification, password reset, invitations, password change notification) and a generic templated send method.

### Principles

- Use configuration-driven transports (from `app.mail.*` in config).
- Store templates in DB (`m_email_templates`) with subject/body Handlebars; compile at send-time.
- Use typed DTOs for payload validation and clear contracts.
- Prefer dedicated service methods for common flows; fall back to generic templated send for custom cases.
- Keep consistent template keys (`code`) to address templates from services.
- Never block critical flows on email failures; log and continue where appropriate.

### Configuration

Mail settings are resolved from the database `m_settings` table via `SettingsHelperService` with environment fallbacks. Precedence:

1) DB settings (preferred)
- `mail.provider` — smtp | gmail | mailgun
- `mail.host`
- `mail.port`
- `mail.secure` — "true" | "false"
- `mail.user`
- `mail.password`
- `mail.from`

2) Environment fallbacks (via `src/core/config/app.config.ts` → `config.get('app.mail.*')`):

- `MAIL_HOST`, `MAIL_PORT`, `MAIL_USER`, `MAIL_PASSWORD`, `MAIL_FROM`, `MAIL_SECURE`

The `MailModule` config uses an async factory that injects `SettingsHelperService` and constructs the transporter in the service (controller never builds transporters):

```ts
imports: [ConfigModule, SettingsModule]
useFactory: async (config: ConfigService, settings: SettingsHelperService) => ({
  /* resolves values from DB keys above with env fallbacks */
})
```

### Module Structure

```
src/modules/mail/
├── mail.module.ts
├── mail.service.ts
├── dto/
│   └── mail.dto.ts
└── templates/
    └── helpers.ts            # handlebars helpers (available to DB templates)
```

Default template subject/body content is defined in `prisma/seeds/mail-templates.seed.ts` (no separate template files).

### Service API

- `sendVerificationEmail({ email, name, verificationLink })`
- `sendPasswordResetEmail({ email, name, resetLink })`
- `sendTeamInvitationEmail({ email, name, inviterName, teamName, invitationLink })`
- `sendPasswordChangeNotification({ email, name, changedAt? })`
- `sendTemplatedMail({ email, template, subject?, context })`

DTOs are defined in `dto/mail.dto.ts`.

### Templates Storage (Database)

- Table: `m_email_templates`
  - `id` (uuid)
  - `code` (string, unique) — e.g. `verification`, `password-reset`
  - `name` (string)
  - `subjectTemplate` (text) — Handlebars template for subject
  - `bodyTemplate` (text) — Handlebars template for HTML body
  - `isActive` (boolean)
  - `createdAt`, `updatedAt`

- CRUD Endpoints:
  - `GET /mail/templates` — list with pagination/filtering
  - `GET /mail/templates/:id` — get template by id
  - `POST /mail/templates` — create template
  - `PATCH /mail/templates/:id` — update template
  - `PATCH /mail/templates/:id/toggle` — toggle active state
  - `DELETE /mail/templates/:id` — delete template

- The service compiles templates at send-time using Handlebars:
  - Finds template by `code`
  - Validates `isActive`
  - Compiles `subjectTemplate` and `bodyTemplate`
  - Sends via transporter configured from settings

### Error Handling

- Email send failures should be caught and logged; do not throw from user-critical flows (e.g. password reset initiation).
- Prefer structured logs including email and context identifiers.

### Example Integration (Auth)

The `AuthService.forgotPassword` generates a reset token and calls:
- `mailService.sendPasswordResetEmail({ email, name, resetLink })`
