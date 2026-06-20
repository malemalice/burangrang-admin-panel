# React Hook Form Reference

> Version: 7.53.0 (`react-hook-form`), `@hookform/resolvers@3.9.0`
> Source: https://react-hook-form.com/docs
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

Form state library on the frontend. Paired with Zod via `@hookform/resolvers/zod`. Always used through the shadcn `Form` / `FormField` / `FormMessage` wrappers — they wire ARIA correctly.

## Key APIs used in this project

<!-- TODO: populate. Expected:
- useForm({ resolver, defaultValues, mode })
- FormProvider + useFormContext (when splitting form sections)
- Controller (for non-native inputs like custom Select)
- useFieldArray (for dynamic rows — approval lines, checklist items)
- watch, setValue, getValues, reset
- handleSubmit
-->

## Common patterns

- Standard form bootstrap:
  ```tsx
  const form = useForm<FormValues>({
    resolver: zodResolver(FormSchema),
    defaultValues: { ... },
  })
  ```
- Wrap inputs in `<FormField>` from `@/core/components/ui/form` — handles `Label`, `FormControl`, `FormMessage`
- Use `Controller` for `Select`, `Combobox`, `DatePicker`, file uploads
- Use `useFieldArray` for dynamic lists (approval lines, sub-items)

## Gotchas

- `defaultValues` must be set at `useForm` time — setting after mount causes uncontrolled→controlled warnings
- `mode: 'onBlur'` is usually the right default (validates on blur, after first submit)
- Disable submit during mutation (`form.formState.isSubmitting` or manual flag) and show transitional label
- Reset form after successful submit (`form.reset()`) for create flows

## Do not use

- Direct DOM manipulation (`document.getElementById('email').value`) — go through `useForm`
- Mixing controlled state for a form field outside of `useForm`
