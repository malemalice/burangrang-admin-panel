> [← Backend TRD Index](./index.md)
>
> *Code-pattern audit checklists (module / controller / service / DTO / security), common anti-patterns to avoid, reference-module guidelines, ESLint rules, and the compliance scoring rubric.*

## Code Pattern Audit & Consistency Guidelines

### Module Consistency Checklist

#### ✅ **Module Structure Requirements**
- [ ] Module follows standard directory structure: `[module]/[module].module.ts`, `[module].controller.ts`, `[module].service.ts`, `dto/`
- [ ] Module imports `PrismaModule` (NOT `PrismaService` directly) and `SharedModule`
- [ ] Module exports the service for use in other modules
- [ ] All DTOs follow naming convention: `[entity].dto.ts`, `create-[entity].dto.ts`, `update-[entity].dto.ts`

#### ✅ **Controller Pattern Requirements**
- [ ] Uses `@ApiTags('[module]')` and `@ApiBearerAuth()` decorators
- [ ] Applies `@UseGuards(JwtAuthGuard, RolesGuard)` to controller class; for data-scoped modules (enrollments, work permits, certificates, PPE withdrawals) also add `DataScopeGuard` and `@DataScoped(entityName)`
- [ ] All endpoints have `@ApiOperation()` with descriptive summaries
- [ ] All endpoints have appropriate `@ApiResponse()` decorators
- [ ] All endpoints have `@Roles()` decorators with appropriate role restrictions
- [ ] CRUD endpoints follow standard pattern: `GET /`, `GET /:id`, `POST /`, `PATCH /:id`, `DELETE /:id`
- [ ] Pagination endpoints include `@ApiQuery()` decorators for all query parameters

#### ✅ **Service Pattern Requirements**
- [ ] Injects `PrismaService`, `ErrorHandlingService`, and `DtoMapperService` in constructor
- [ ] Initializes DTO mappers in constructor using `DtoMapperService`
- [ ] Uses `ErrorHandlingService.throwIfNotFoundById()` instead of direct `NotFoundException`
- [ ] Implements standard CRUD operations: `create()`, `findAll()`, `findOne()`, `update()`, `remove()`
- [ ] `findAll()` method supports pagination with `page`, `limit`, `sortBy`, `sortOrder`, `search`, `isActive` parameters
- [ ] Uses `DtoMapperService` for all entity-to-DTO transformations

#### ✅ **DTO Pattern Requirements**
- [ ] All DTOs extend base class with `constructor(partial: Partial<DtoClass>)`
- [ ] Response DTOs use `@Expose()` decorators for serialization
- [ ] Response DTOs use `@ApiProperty()` decorators for Swagger documentation
- [ ] Create/Update DTOs use `class-validator` decorators (`@IsString()`, `@IsEmail()`, etc.)
- [ ] Sensitive fields (like passwords) are excluded using `@Exclude()` decorator

#### ✅ **Security Pattern Requirements**
- [ ] All controllers use `JwtAuthGuard` and `RolesGuard`; data-scoped modules (enrollments, work permits, certificates, PPE withdrawals) also use `DataScopeGuard` and `@DataScoped(entityName)`
- [ ] All endpoints have appropriate `@Roles()` decorators
- [ ] Permission-based endpoints use `@Permissions()` decorators
- [ ] Public endpoints use `@Public()` decorator
- [ ] Role hierarchy: `SUPER_ADMIN` > `ADMIN` > `MANAGER` > `USER`

### Consistency Violations to Avoid

#### ❌ **Common Anti-Patterns**
```typescript
// ❌ WRONG: Direct PrismaService injection in module
providers: [Service, PrismaService]

// ✅ CORRECT: Use PrismaModule
imports: [PrismaModule, SharedModule]

// ❌ WRONG: Direct NotFoundException usage
if (!entity) {
  throw new NotFoundException(`Entity with ID ${id} not found`);
}

// ✅ CORRECT: Use ErrorHandlingService
this.errorHandler.throwIfNotFoundById('Entity', id, entity);

// ❌ WRONG: Missing role restrictions
@Get()
findAll() { }

// ✅ CORRECT: Always specify roles
@Get()
@Roles(Role.ADMIN, Role.SUPER_ADMIN)
findAll() { }
```

### Module-Specific Guidelines

#### **Users Module** (Reference Implementation)
- ✅ Complete CRUD with advanced filtering
- ✅ Password handling with bcrypt
- ✅ Profile endpoint (`GET /me`)
- ✅ Complex relation mapping (role, office, department, jobPosition)

#### **Roles Module** (Reference Implementation)
- ✅ Permission management with default permissions
- ✅ Complex relation mapping with permissions
- ✅ Configuration-based default permissions

#### **Offices Module** (Hierarchical Pattern)
- ✅ Recursive parent/child relationships
- ✅ Hierarchy endpoint (`GET /hierarchy`)
- ✅ Complex relation mapping for nested structures

#### **Menus Module** (Complex Relations Pattern)
- ✅ Multi-level hierarchy with roles
- ✅ Role-based filtering (`GET /sidebar`)
- ✅ Statistics endpoint (`GET /stats`)
- ✅ Order management (`PUT /order`)

### Quality Assurance Checklist

#### **Before Code Review**
- [ ] Module follows all structure requirements
- [ ] Controller has complete Swagger documentation
- [ ] Service uses ErrorHandlingService consistently
- [ ] All endpoints have appropriate security decorators
- [ ] DTOs have proper validation and serialization
- [ ] No direct PrismaService injection in modules
- [ ] No direct exception throwing in services

#### **Code Review Focus Areas**
1. **Consistency**: Does it follow established patterns?
2. **Security**: Are all endpoints properly protected?
3. **Error Handling**: Uses ErrorHandlingService consistently?
4. **Documentation**: Complete Swagger documentation?
5. **Validation**: Proper input validation and DTO mapping?

### Automated Checks

#### **ESLint Rules** (Add to eslint.config.mjs)
```javascript
// Ensure consistent import patterns
'@typescript-eslint/no-unused-vars': 'error',
'@typescript-eslint/explicit-function-return-type': 'warn',
'@typescript-eslint/no-explicit-any': 'warn'
```

#### **Pre-commit Hooks** (Recommended)
- Run linting and formatting
- Check for missing role decorators
- Verify ErrorHandlingService usage
- Validate Swagger documentation completeness

## Best Practices Summary

1. **Always import PrismaModule and SharedModule** in feature modules
2. **Use standardized guards** (`JwtAuthGuard` + `RolesGuard`; add `DataScopeGuard` + `@DataScoped(entityName)` only for data-scoped modules)
3. **Apply appropriate roles** to ALL endpoints (`@Roles()`)
4. **Use standardized DTO mapping** with `DtoMapperService`
5. **Handle errors consistently** with `ErrorHandlingService` (never direct exceptions)
6. **Document all endpoints** with complete Swagger decorators
7. **Validate all inputs** with class-validator
8. **Follow RESTful conventions** for API design
9. **Use TypeScript properly** with strict typing
10. **Write comprehensive tests** for all functionality
11. **Follow established patterns** from reference modules (Users, Roles)
12. **Maintain consistency** across all modules

## Module Compliance Scoring

| Pattern | Weight | Score |
|---------|--------|-------|
| Module Structure | 20% | Must be 100% |
| Controller Patterns | 25% | Must be 95%+ |
| Service Patterns | 25% | Must be 95%+ |
| Security Implementation | 20% | Must be 100% |
| DTO Consistency | 10% | Must be 90%+ |

**Target Overall Score: 95%+**
