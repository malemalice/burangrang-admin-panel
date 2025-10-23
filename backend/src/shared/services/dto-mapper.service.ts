import { Injectable } from '@nestjs/common';

export interface DtoMapperOptions {
  /** Fields to exclude from mapping */
  exclude?: string[];
  /** Custom field mappings */
  transform?: Record<string, (value: any) => any>;
  /** Nested relations to map */
  relations?: Record<string, {
    mapper: (entity: any) => any;
    isArray?: boolean;
  }>;
}

@Injectable()
export class DtoMapperService {
  /**
   * Maps a single entity to a DTO class
   * @param DtoClass - The DTO constructor
   * @param entity - The entity to map
   * @param options - Mapping options
   * @returns Mapped DTO instance
   */
  mapToDto<T>(
    DtoClass: new (partial: Partial<T>) => T,
    entity: any,
    options: DtoMapperOptions = {},
  ): T {
    if (!entity) return null as any;

    const { exclude = [], transform = {}, relations = {} } = options;

    // Create a clean copy of the entity
    const mappedEntity = { ...entity };

    // Apply exclusions
    exclude.forEach(field => delete mappedEntity[field]);

    // Apply transformations
    Object.entries(transform).forEach(([field, transformer]) => {
      if (mappedEntity[field] !== undefined) {
        mappedEntity[field] = transformer(mappedEntity[field]);
      }
    });

    // Handle relations
    Object.entries(relations).forEach(([field, config]) => {
      if (mappedEntity[field]) {
        if (config.isArray) {
          mappedEntity[field] = mappedEntity[field].map(config.mapper);
        } else {
          mappedEntity[field] = config.mapper(mappedEntity[field]);
        }
      }
    });

    return new DtoClass(mappedEntity);
  }

  /**
   * Maps an array of entities to DTOs
   * @param DtoClass - The DTO constructor
   * @param entities - Array of entities to map
   * @param options - Mapping options
   * @returns Array of mapped DTO instances
   */
  mapToDtoArray<T>(
    DtoClass: new (partial: Partial<T>) => T,
    entities: any[],
    options: DtoMapperOptions = {},
  ): T[] {
    if (!entities || !Array.isArray(entities)) return [];
    return entities.map(entity => this.mapToDto(DtoClass, entity, options));
  }

  /**
   * Creates a standard mapper function for simple entity-to-DTO mapping
   * @param DtoClass - The DTO constructor
   * @param options - Mapping options
   * @returns Mapper function
   */
  createMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    options: DtoMapperOptions = {},
  ): (entity: any) => T {
    return (entity: any) => this.mapToDto(DtoClass, entity, options);
  }

  /**
   * Creates a standard array mapper function
   * @param DtoClass - The DTO constructor
   * @param options - Mapping options
   * @returns Array mapper function
   */
  createArrayMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    options: DtoMapperOptions = {},
  ): (entities: any[]) => T[] {
    return (entities: any[]) => this.mapToDtoArray(DtoClass, entities, options);
  }

  /**
   * Creates a mapper for entities with nested relations
   * @param DtoClass - The main DTO constructor
   * @param relationMappers - Mappers for each relation
   * @param exclude - Fields to exclude from main entity
   * @returns Configured mapper function
   */
  createRelationMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    relationMappers: Record<string, {
      mapper: (entity: any) => any;
      isArray?: boolean;
    }>,
    exclude: string[] = [],
  ): (entity: any) => T {
    return this.createMapper(DtoClass, { relations: relationMappers, exclude });
  }

  /**
   * Helper method to create a simple entity mapper (no relations, no exclusions)
   * @param DtoClass - The DTO constructor
   * @returns Simple mapper function
   */
  createSimpleMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
  ): (entity: any) => T {
    return this.createMapper(DtoClass);
  }

  /**
   * Helper method to create a simple array mapper (no relations, no exclusions)
   * @param DtoClass - The DTO constructor
   * @returns Simple array mapper function
   */
  createSimpleArrayMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
  ): (entities: any[]) => T[] {
    return this.createArrayMapper(DtoClass);
  }

  /**
   * Creates a paginated response mapper
   * @param DtoClass - The DTO constructor
   * @param options - Mapping options
   * @returns Function that maps paginated data
   */
  createPaginatedMapper<T>(
    DtoClass: new (partial: Partial<T>) => T,
    options: DtoMapperOptions = {},
  ): (data: { data: any[]; meta: any }) => { data: T[]; meta: any } {
    return (paginatedData: { data: any[]; meta: any }) => ({
      data: this.mapToDtoArray(DtoClass, paginatedData.data, options),
      meta: paginatedData.meta,
    });
  }
}
