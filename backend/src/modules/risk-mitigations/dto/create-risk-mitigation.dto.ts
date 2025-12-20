import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskMitigationDto {
  @ApiProperty({ description: 'Eliminate control measure', required: false })
  @IsString()
  @IsOptional()
  eliminate?: string;

  @ApiProperty({ description: 'Transfer control measure', required: false })
  @IsString()
  @IsOptional()
  transfer?: string;

  @ApiProperty({ description: 'Reduce control measure', required: false })
  @IsString()
  @IsOptional()
  reduce?: string;

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
