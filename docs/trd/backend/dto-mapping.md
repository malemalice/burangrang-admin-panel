> [← Backend TRD Index](./index.md)
>
> *DtoMapperService API (simple / relation / paginated mappers) and the constructor-initialisation pattern.*

## DTO Mapping

### 1. Standardized DTO Mapping Service

```typescript
@Injectable()
export class DtoMapperService {
  mapToDto<T>(
    DtoClass: new (partial: Partial<T>) => T,
    entity: any,
    options: DtoMapperOptions = {},
  ): T {
    // Implementation with exclusions, transformations, and relations
  }

  createSimpleMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
  ): (entity: any) => T {
    return this.createMapper(DtoClass);
  }

  createRelationMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    relationMappers: Record<string, RelationConfig>,
    exclude: string[] = [],
  ): (entity: any) => T {
    return this.createMapper(DtoClass, { relations: relationMappers, exclude });
  }
}
```

### 2. Mapping Patterns

```typescript
// Simple entity mapping
this.userMapper = this.dtoMapper.createSimpleMapper(UserDto);

// Entity with relations
this.roleMapper = this.dtoMapper.createRelationMapper(RoleDto, {
  permissions: {
    mapper: this.permissionMapper,
    isArray: true,
  },
});

// Entity with exclusions
this.userMapper = this.dtoMapper.createMapper(UserDto, {
  exclude: ['password'], // Exclude sensitive fields
});

// Array mapping
this.userArrayMapper = this.dtoMapper.createSimpleArrayMapper(UserDto);

// Paginated results
this.userPaginatedMapper = this.dtoMapper.createPaginatedMapper(UserDto);
```
