import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';

class SafetyEquipmentSnapshotDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  name: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  category: string;

  @ApiPropertyOptional()
  @Expose()
  size?: string;
}

export class WorkClassificationSafetyEquipmentInputDto {
  @ApiProperty({ description: 'Safety equipment id' })
  @IsString()
  @IsNotEmpty()
  safetyEquipmentId: string;

  @ApiPropertyOptional({ description: 'Optional notes' })
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ description: 'Display order', default: 0 })
  @IsOptional()
  @IsInt()
  @Min(0)
  order?: number;
}

export class WorkClassificationSafetyEquipmentItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiPropertyOptional()
  @Expose()
  notes?: string;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty({ type: SafetyEquipmentSnapshotDto })
  @Expose()
  @Type(() => SafetyEquipmentSnapshotDto)
  safetyEquipment: SafetyEquipmentSnapshotDto;
}

