> [← Backend TRD Index](./index.md)
>
> *ErrorHandlingService API (`throwIfNotFound`, `safeExecute`) and the standardised error-response envelope for each HTTP status (400/401/403/404/409/500).*

## Error Handling

### 1. Centralized Error Handling Service

```typescript
@Injectable()
export class ErrorHandlingService {
  throwIfNotFound<T>(
    entityName: string,
    identifier: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    if (!entity) {
      throw new NotFoundException(`${entityName} with ${identifier} not found`);
    }
  }

  throwIfNotFoundById<T>(
    entityName: string,
    id: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    this.throwIfNotFound(entityName, `ID ${id}`, entity);
  }

  async safeExecute<T>(
    operation: () => Promise<T>,
    errorContext: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Handle Prisma and other errors
      return this.handleDatabaseError(error, errorContext);
    }
  }
}
```

### 2. Error Response Standardization

```typescript
// 400 Bad Request - Validation errors
{
  "statusCode": 400,
  "message": ["name must be a string", "email must be a valid email"],
  "error": "Bad Request"
}

// 401 Unauthorized - Invalid credentials
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}

// 403 Forbidden - Insufficient permissions
{
  "statusCode": 403,
  "message": "Insufficient permissions",
  "error": "Forbidden"
}

// 404 Not Found - Resource not found
{
  "statusCode": 404,
  "message": "User with ID 123 not found",
  "error": "Not Found"
}

// 409 Conflict - Unique constraint violation
{
  "statusCode": 409,
  "message": "Email already exists",
  "error": "Conflict"
}

// 500 Internal Server Error - Unexpected errors
{
  "statusCode": 500,
  "message": "An unexpected error occurred",
  "error": "Internal Server Error"
}
```
