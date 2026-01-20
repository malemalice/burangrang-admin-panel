import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { GeneralStatusEnum } from '@prisma/client';

export class CreateAuditScheduleDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  code: string;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsNotEmpty()
  @ApiProperty({ type: [String], description: 'Array of area IDs' })
  areaIds: string[];

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty()
  auditDate: Date;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  auditElementId: string;

  @IsOptional()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum, required: false, description: 'Status is auto-determined based on audit date if not provided' })
  status?: GeneralStatusEnum;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: true })
  isActive?: boolean;

  @IsArray()
  @IsUUID(undefined, { each: true })
  @IsOptional()
  @ApiProperty({ type: [String], description: 'Array of auditor user IDs', required: false })
  auditorIds?: string[];
}
