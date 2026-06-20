> [← Backend TRD Index](./index.md)
>
> *High-level architecture diagram (controllers / services / guards / shared) and the feature-module / shared / core split.*

## Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Controllers   │    │    Services     │    │   Database      │
│                 │    │                 │    │   (PostgreSQL)  │
│ • API Endpoints │◄──►│ • Business Logic│◄──►│ • Prisma ORM    │
│ • Request/Resp  │    │ • Data Mapping  │    │ • Migrations    │
│ • Validation    │    │ • Error Handling│    │ • Seeds         │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         ▲                       ▲
         │                       │
┌─────────────────┐    ┌─────────────────┐
│   Guards        │    │   Shared        │
│                 │    │   Services      │
│ • JWT Auth      │    │                 │
│ • Role-based    │    │ • DTO Mapper    │
│ • Permissions   │    │ • Error Handler │
└─────────────────┘    └─────────────────┘
```

### Module Architecture

The application follows a modular architecture with clear separation of concerns:

- **Feature Modules**: Each domain has its own module (users, roles, departments, etc.)
- **Shared Module**: Common utilities and services
- **Core Module**: Database and configuration setup
