import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateAuditClauseDto {
  @ApiProperty({ description: 'The name of the audit clause' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ 
    required: false,
    description: 'The unique code of the audit clause (auto-generated if not provided)' 
  })
  @IsOptional()
  @Transform(({ value }) => {
    // Convert empty string or null to undefined
    if (value === '' || value === null || value === undefined) return undefined;
    return value;
  })
  code?: string;

  @ApiProperty({
    required: false,
    description: 'The description of the audit clause',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The ID of the audit element this clause belongs to' })
  @IsString()
  @IsNotEmpty()
  auditElementId: string;

  @ApiProperty({ description: 'The order/sequence of the clause' })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  order: number;

  @ApiProperty({
    default: true,
    description: 'Whether the audit clause is active',
  })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return Boolean(value);
  })
  isActive?: boolean = true;
}
