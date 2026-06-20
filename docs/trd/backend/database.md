> [← Backend TRD Index](./index.md)
>
> *Prisma config, `m_` / `t_` / `_` table naming convention, PrismaService lifecycle, and the migration / seeding commands (gated — never run without explicit user approval).*

## Database Integration

### 1. Prisma ORM Configuration

```typescript
// schema.prisma
generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// Model definitions with proper relationships and table naming convention
model User {
  id            String         @id @default(uuid())
  email         String         @unique
  password      String
  firstName     String
  lastName      String
  isActive      Boolean        @default(true)
  roleId        String
  officeId      String
  departmentId  String?
  jobPositionId String?

  role          Role           @relation(fields: [roleId], references: [id])
  office        Office         @relation(fields: [officeId], references: [id])
  department    Department?    @relation(fields: [departmentId], references: [id])
  jobPosition   JobPosition?   @relation(fields: [jobPositionId], references: [id])

  @@map("t_users")  // Transactional data table
}
```

### 2. Database Table Naming Convention

The project follows a strict naming convention for database tables:

**Master Data Tables (m_ prefix):**
- `m_roles` - Role definitions
- `m_permissions` - Permission definitions  
- `m_offices` - Office structure
- `m_departments` - Department definitions
- `m_job_positions` - Job position definitions
- `m_menus` - Navigation menu structure
- `m_settings` - System configuration
- `m_approval` - Approval workflow templates
- `m_approval_item` - Approval workflow steps

**Transactional Data Tables (t_ prefix):**
- `t_users` - User accounts
- `t_refresh_tokens` - Authentication sessions
- `t_approvals` - Individual approval instances

**Junction Tables:**
- `_PermissionToRole` - Role-permission relationships
- `_MenuToRole` - Role-menu access relationships

This naming convention helps distinguish between:
- **Master Data**: Reference data that changes infrequently (roles, permissions, etc.)
- **Transactional Data**: Business data that changes frequently (users, sessions, approvals)

### 3. Database Service Pattern

```typescript
@Injectable()
export class PrismaService extends PrismaClient {
  constructor() {
    super({
      log: ['query', 'info', 'warn', 'error'],
    });
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
```

### 4. Migration and Seeding

```bash
# Generate migration
npx prisma migrate dev --name add_new_field

# Run migrations
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate

# Run seeds
npx prisma db seed
```
