import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { Expose } from 'class-transformer';

/**
 * DTO for risk mitigation data input (for creating/updating)
 */
export class RiskMitigationDataDto {
  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Elimination control (control hierarchy detail)' })
  @Expose()
  eliminationControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Substitution control (control hierarchy detail)' })
  @Expose()
  substitutionControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Engineering control (control hierarchy detail)' })
  @Expose()
  engineeringControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Administration control (control hierarchy detail)' })
  @Expose()
  administrationControl?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Personal protective equipment (control hierarchy detail)' })
  @Expose()
  personalProtectiveEquipment?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Transfer strategy' })
  @Expose()
  transfer?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Acceptance strategy' })
  @Expose()
  accept?: string;

  @IsOptional()
  @IsString()
  @ApiProperty({ required: false, description: 'Legal aspect - filled by approver' })
  @Expose()
  legalAspect?: string;
}

/**
 * DTO for risk mitigation response (includes id and metadata)
 */
export class RiskMitigationRecordDto extends RiskMitigationDataDto {
  @ApiProperty({ description: 'Unique identifier of the mitigation record' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Auto-generated code with prefix RSK{datetime}' })
  @Expose()
  code: string;

  @ApiProperty({ description: 'Entity type (e.g., RISK_ASSESSMENT_ITEM)' })
  @Expose()
  entity: string;

  @ApiProperty({ description: 'Entity ID reference' })
  @Expose()
  entityId: string;

  @ApiProperty({ description: 'Whether the record is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  updatedAt: Date;
}
