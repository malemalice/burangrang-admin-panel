> [← PRD Index](./index.md)
>
> *Problem statement, goals, non-goals, and the "why this exists" link to `principles.md`.*

# Problem & Goals

## Problem

HSE (Health, Safety, Environment) operations at the target organisation are tracked across spreadsheets, paper forms, and ad-hoc tools. This makes it hard to:

- Enforce consistent workflows (incident reporting, work permits, inspections, risk assessment)
- Surface analytics (IFR, hazard trends, KPI dashboards)
- Govern access (department-scoped, role-scoped, approval-line scoped)
- Run audits and certifications with traceability

## Goals

- Single backoffice ERP for HSE: incidents, work permits, inspections, risk register, PPE, certificates, learning, communications, audits, waste, environmental measurements
- Strong RBAC + data-level access (department / approval-assignee scoped)
- Configurable approval workflows (never hardcoded approver names)
- Dashboards: admin overview, hazard analytic, incident profile, security team
- Integration: Zoho, Google Site embeds, email notifications

## Non-goals

- Not a public-facing app — backoffice only, behind auth
- Not a mobile-native app — responsive web sufficient (desktop-first ≥1280px)
- Not a generic project-management tool — HSE-domain-specific entities and workflows

## Why this exists

See [principles.md](../../principles.md) for the engineering values that shape every decision. Per-domain product detail lives in [docs/prd/*.md](../) (32 files indexed by [prd/index.md](./index.md)).
