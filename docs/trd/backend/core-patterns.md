> [← Backend TRD Index](./index.md)
>
> *Boilerplate templates: feature module, DTO with class-validator + Swagger decorators, controller with guards + Swagger docs.*

## Core Implementation Patterns

### 1. Module Structure Pattern

Each feature module follows this consistent structure:

```typescript
// [module].module.ts
import { Module } from '@nestjs/common';
import { [Module]Controller } from './controllers/[module].controller';
import { [Module]Service } from './services/[module].service';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [SharedModule], // Always import SharedModule for utilities
  controllers: [[Module]Controller],
  providers: [[Module]Service],
  exports: [[Module]Service],
})
export class [Module]Module {}

// [module].controller.ts
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../shared/guards/[guards]';

@ApiTags('[module]')
@ApiBearerAuth()
@Controller('[module]')
@UseGuards(JwtAuthGuard, RolesGuard)
export class [Module]Controller {
  constructor(private readonly [module]Service: [Module]Service) {}
  // Implementation
}

// [module].service.ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';

@Injectable()
export class [Module]Service {
  // Initialize mappers in constructor
  private [entity]Mapper: (entity: any) => [Entity]Dto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {
    this.[entity]Mapper = this.dtoMapper.createSimpleMapper([Entity]Dto);
  }
  // Implementation
}
```

### 2. DTO Pattern

Standardized DTO structure with proper validation and documentation:

```typescript
// dto/[entity].dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsUUID } from 'class-validator';
import { Expose } from 'class-transformer';

export class [Entity]Dto {
  @ApiProperty()
  @Expose()
  @IsString()
  id: string;

  @ApiProperty()
  @Expose()
  @IsString()
  name: string;

  // Relations
  @ApiProperty({ required: false })
  @Expose()
  @IsOptional()
  @IsUUID()
  relatedEntityId?: string;

  constructor(partial: Partial<[Entity]Dto>) {
    Object.assign(this, partial);
  }
}

// dto/create-[entity].dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class Create[Entity]Dto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  // Required fields for creation
}
```

### 3. Controller Pattern

Consistent controller implementation with proper guards and documentation:

```typescript
@Controller('[entities]')
@UseGuards(JwtAuthGuard, RolesGuard)
export class [Entities]Controller {
  constructor(private readonly [entities]Service: [Entities]Service) {}

  @Get()
  @ApiOperation({ summary: 'Get all [entities] with pagination and filtering' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, type: [Entity]Dto })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findAll(@Query() query: FindAllQueryDto): Promise<PaginatedResponse<EntityDto>> {
    return this.[entities]Service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get [entity] by ID' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, type: EntityDto })
  @ApiResponse({ status: 404, description: '[Entity] not found' })
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  async findOne(@Param('id') id: string): Promise<EntityDto> {
    return this.[entities]Service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new [entity]' })
  @ApiBody({ type: CreateEntityDto })
  @ApiResponse({ status: 201, type: EntityDto })
  @Roles(Role.SUPER_ADMIN)
  async create(@Body() createDto: CreateEntityDto): Promise<EntityDto> {
    return this.[entities]Service.create(createDto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update [entity]' })
  @ApiParam({ name: 'id', type: String })
  @ApiBody({ type: UpdateEntityDto })
  @ApiResponse({ status: 200, type: EntityDto })
  @Roles(Role.SUPER_ADMIN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateEntityDto,
  ): Promise<EntityDto> {
    return this.[entities]Service.update(id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete [entity]' })
  @ApiParam({ name: 'id', type: String })
  @ApiResponse({ status: 200, description: '[Entity] deleted successfully' })
  @Roles(Role.SUPER_ADMIN)
  async remove(@Param('id') id: string): Promise<void> {
    return this.[entities]Service.remove(id);
  }
}
```
