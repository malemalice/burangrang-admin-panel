import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';

export enum TransitionTypeEnum {
  INITIAL = 'INITIAL',
  TRANSITION_LEVEL = 'TRANSITION_LEVEL',
  ADVANCE_LEVEL = 'ADVANCE_LEVEL',
}

export class CreateAuditCriteriaDto {
  @ApiProperty({ description: 'The name of the audit criteria' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'The unique code of the audit criteria' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({
    required: false,
    description: 'The description of the audit criteria',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'The ID of the audit clause this criteria belongs to' })
  @IsString()
  @IsNotEmpty()
  auditClauseId: string;

  @ApiProperty({
    enum: TransitionTypeEnum,
    description: 'The transition type of the criteria',
  })
  @IsEnum(TransitionTypeEnum)
  transitionType: TransitionTypeEnum;

  @ApiProperty({ description: 'The order/sequence of the criteria' })
  @IsInt()
  @Min(0)
  @Transform(({ value }) => parseInt(value, 10))
  order: number;

  @ApiProperty({
    default: true,
    description: 'Whether the audit criteria is active',
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
