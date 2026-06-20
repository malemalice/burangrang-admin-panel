import { IsString, IsBoolean, IsOptional, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskControlDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  eliminationControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  substitutionControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  engineeringControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  administrationControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  personalProtectiveEquipment?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false })
  transfer?: string;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: true })
  isOpen?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: false })
  isAccept?: boolean;

  @IsOptional()
  @IsBoolean()
  @ApiProperty({ required: false, default: true })
  isActive?: boolean;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Entity table name (e.g., "t_risk_assessment_item", "t_inspections")' })
  entity: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty({ description: 'Entity row ID (UUID)' })
  entityId: string;
}
