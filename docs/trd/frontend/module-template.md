> [← Frontend TRD Index](./index.md)

## 🏛️ Module Structure Template

Each module MUST follow this consistent structure:

```
modules/[module-name]/
├── components/           # Module-specific components
├── pages/               # Module pages
├── services/            # Business logic & API calls
├── types/               # Module-specific types
├── hooks/               # Module-specific hooks
├── routes/              # Module routing configuration
├── validators/          # Module validation schemas (optional)
├── constants/           # Module constants (optional)
└── index.ts             # Module barrel exports
```

### Module Barrel Export Pattern
```typescript
// modules/[module-name]/index.ts
export * from './components';
export * from './pages';
export * from './services';
export * from './types';
export * from './hooks';
export * from './routes';
```
