import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskMitigationDto {
  @ApiProperty({ description: 'Elimination Control', required: false })
  @IsString()
  @IsOptional()
  eliminationControl?: string;

  @ApiProperty({ description: 'Substitution Control', required: false })
  @IsString()
  @IsOptional()
  substitutionControl?: string;

  @ApiProperty({ description: 'Engineering Control', required: false })
  @IsString()
  @IsOptional()
  engineeringControl?: string;

  @ApiProperty({ description: 'Administration Control', required: false })
  @IsString()
  @IsOptional()
  administrationControl?: string;

  @ApiProperty({ description: 'Personal Protective Equipment', required: false })
  @IsString()
  @IsOptional()
  personalProtectiveEquipment?: string;

  @ApiProperty({ description: 'Transfer control measure', required: false })
  @IsString()
  @IsOptional()
  transfer?: string;

  @ApiProperty({ description: 'Accept control measure', required: false })
  @IsString()
  @IsOptional()
  accept?: string;

  @ApiProperty({ description: 'Whether the mitigation is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'The ID of the risk this mitigation belongs to' })
  @IsUUID()
  riskId: string;
}
