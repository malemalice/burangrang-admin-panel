# Zod Reference

> Version: 3.23.8
> Source: https://zod.dev
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

Zod is the frontend validation library. Backend uses `class-validator` (different system). Zod schemas pair with React Hook Form via `@hookform/resolvers/zod`.

## Key APIs used in this project

<!-- TODO: populate. Expected:
- z.object, z.string, z.number, z.date, z.enum, z.array, z.union, z.literal
- .min/.max/.email/.uuid/.regex
- .optional/.nullable/.default
- .refine, .superRefine for cross-field validation
- z.infer<typeof Schema> for inferred types
-->

## Common patterns

- One schema per form, defined alongside the form component
- `z.infer<typeof FormSchema>` → form's TS type (single source of truth)
- `zodResolver(FormSchema)` passed to `useForm({ resolver: ... })`
- Reuse atomic schemas (e.g. `emailSchema`, `uuidSchema`) across forms

## Gotchas

- v3 default coercion: `z.coerce.number()` for string-to-number from form inputs
- `z.nativeEnum` for TS enums; `z.enum` for string-literal unions
- `.transform()` runs **after** validation — type returned changes
- Async refinements require `await schema.parseAsync()` (not `parse()`)

## Do not use

- Manual validation alongside zod — single source of truth
- `class-validator` on the frontend — that's a backend tool
