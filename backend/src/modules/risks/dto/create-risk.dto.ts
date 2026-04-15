import { IsString, IsOptional, IsBoolean, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateRiskDto {
  @ApiProperty({ description: 'The name of the risk' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'A unique code for the risk' })
  @IsString()
  code: string;

  @ApiProperty({ description: 'Optional description of the risk', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Whether the risk is active', required: false, default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiProperty({ description: 'The ID of the type of hazard this risk belongs to' })
  @IsUUID()
  riskCategoryId: string;
}
