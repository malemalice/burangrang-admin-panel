import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';

@Injectable()
export class ErrorHandlingService {
  /**
   * Throws NotFoundException when an entity is not found
   * @param entityName - Name of the entity (e.g., 'User', 'Department')
   * @param identifier - Identifier used to search (e.g., 'ID abc123', 'email user@example.com')
   * @param entity - The entity object to check
   */
  throwIfNotFound<T>(
    entityName: string,
    identifier: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    if (!entity) {
      throw new NotFoundException(`${entityName} with ${identifier} not found`);
    }
  }

  /**
   * Throws NotFoundException for entity not found by ID
   * @param entityName - Name of the entity (e.g., 'User', 'Department')
   * @param id - The ID that was not found
   * @param entity - The entity object to check
   */
  throwIfNotFoundById<T>(
    entityName: string,
    id: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    this.throwIfNotFound(entityName, `ID ${id}`, entity);
  }

  /**
   * Throws NotFoundException for entity not found by field value
   * @param entityName - Name of the entity (e.g., 'User', 'Department')
   * @param fieldName - Name of the field (e.g., 'email', 'code')
   * @param fieldValue - Value of the field
   * @param entity - The entity object to check
   */
  throwIfNotFoundByField<T>(
    entityName: string,
    fieldName: string,
    fieldValue: string,
    entity: T | null | undefined,
  ): asserts entity is T {
    this.throwIfNotFound(entityName, `${fieldName} ${fieldValue}`, entity);
  }

  /**
   * Throws BadRequestException for invalid input
   * @param message - Error message
   * @param details - Optional additional details
   */
  throwBadRequest(message: string, details?: any): never {
    throw new BadRequestException({
      message,
      details,
    });
  }

  /**
   * Throws ForbiddenException for access denied
   * @param message - Error message
   * @param resource - Optional resource that access was denied to
   */
  throwForbidden(message: string, resource?: string): never {
    const fullMessage = resource ? `${message}: ${resource}` : message;
    throw new ForbiddenException(fullMessage);
  }

  /**
   * Throws ConflictException for unique constraint violations
   * @param fieldName - Name of the field that caused the conflict
   * @param fieldValue - Value that caused the conflict
   */
  throwConflict(fieldName: string, fieldValue: string): never {
    throw new ConflictException(
      `${fieldName} '${fieldValue}' already exists`,
    );
  }

  /**
   * Throws ConflictException for unique constraint violations with custom message
   * @param message - Custom conflict message
   */
  throwConflictCustom(message: string): never {
    throw new ConflictException(message);
  }

  /**
   * Safely executes an async operation and handles common database errors
   * @param operation - The async operation to execute
   * @param errorContext - Context for error messages
   * @returns The result of the operation
   */
  async safeExecute<T>(
    operation: () => Promise<T>,
    errorContext: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Handle Prisma unique constraint errors
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0] || 'field';
        throw new ConflictException(`${field} already exists`);
      }

      // Handle Prisma foreign key constraint errors
      if (error.code === 'P2003') {
        throw new BadRequestException(
          'Cannot perform operation due to related data constraints',
        );
      }

      // Handle Prisma record not found errors
      if (error.code === 'P2025') {
        throw new NotFoundException(errorContext);
      }

      // Re-throw NestJS exceptions as-is
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException ||
        error instanceof ConflictException
      ) {
        throw error;
      }

      // Log unexpected errors and throw internal server error
      console.error(`Unexpected error in ${errorContext}:`, error);
      throw new InternalServerErrorException(
        `An unexpected error occurred while ${errorContext.toLowerCase()}`,
      );
    }
  }

  /**
   * Handles password hashing errors with consistent messaging
   * @param operation - The password hashing operation
   * @returns The hashed password
   */
  async safeHashPassword(operation: () => Promise<string>): Promise<string> {
    try {
      return await operation();
    } catch (error) {
      throw new InternalServerErrorException(
        'Failed to process password. Please try again.',
      );
    }
  }

  /**
   * Validates required fields and throws BadRequestException if missing
   * @param fields - Object with field names and values to validate
   */
  validateRequiredFields(fields: Record<string, any>): void {
    const missingFields = Object.entries(fields)
      .filter(([, value]) => value === null || value === undefined || value === '')
      .map(([key]) => key);

    if (missingFields.length > 0) {
      this.throwBadRequest(
        `Required fields are missing: ${missingFields.join(', ')}`,
        { missingFields },
      );
    }
  }

  /**
   * Validates email format (basic validation)
   * @param email - Email to validate
   * @param fieldName - Name of the field for error messages
   */
  validateEmailFormat(email: string, fieldName = 'email'): void {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.throwBadRequest(`Invalid ${fieldName} format`);
    }
  }

  /**
   * Validates password strength
   * @param password - Password to validate
   * @param minLength - Minimum length required (default: 6)
   */
  validatePasswordStrength(password: string, minLength = 6): void {
    if (password.length < minLength) {
      this.throwBadRequest(
        `Password must be at least ${minLength} characters long`,
      );
    }

    // Add more password strength validations as needed
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      this.throwBadRequest(
        'Password must contain at least one uppercase letter, one lowercase letter, and one number',
      );
    }
  }
}
