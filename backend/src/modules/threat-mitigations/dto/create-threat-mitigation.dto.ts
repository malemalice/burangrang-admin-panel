import { IsString, IsInt, IsOptional, IsBoolean, IsUUID, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateThreatMitigationDto {
  @ApiProperty({ description: 'The level of the mitigation (1-5)', minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  level: number;

  @ApiProperty({ description: 'The description of the mitigation' })
  @IsString()
  mitigationDescription: string;

  @ApiProperty({ description: 'Whether the mitigation is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'The ID of the risk this mitigation belongs to' })
  @IsUUID()
  threatId: string;
} 