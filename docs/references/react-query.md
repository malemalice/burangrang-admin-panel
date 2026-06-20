# TanStack React Query Reference

> Version: @tanstack/react-query 5.56.2
> Source: https://tanstack.com/query/latest/docs
> Last updated: 2026-05-24 (stub — populate from llms.txt or official docs)

## Overview

Data fetching + caching layer for the React frontend. Wrapped in custom hooks per module (`useEntity()`, `useEntities()`); components never call services directly.

## Key APIs used in this project

<!-- TODO: populate. Expected:
- useQuery, useMutation, useInfiniteQuery
- queryClient.invalidateQueries on mutation success
- queryKey conventions per module
- Defaults from QueryClient provider (staleTime, retry policy)
-->

## Common patterns

- Custom hook per entity: `useIncident(id)`, `useIncidents(filters)`
- Mutation invalidates relevant queries on success
- Query keys: `['<module>', '<entity>', <id-or-filters>]`
- Single owner per remote resource — child components subscribe, do not re-fetch what the parent already loaded

## Gotchas

- v5 renamed callbacks: `onSuccess`/`onError` on `useQuery` were removed — handle in the component via `useEffect` or in `useMutation`
- `queryKey` changes trigger a refetch — be deterministic
- `useInfiniteQuery` returns `data.pages[]` — flatten in a `useMemo`
- Stale time vs cache time — defaults may cause surprising refetches if not set in `QueryClient`

## Do not use

- Direct service calls from components — always go through a custom hook
- Manual cache mutation (`queryClient.setQueryData`) without a strong reason; prefer `invalidateQueries`
