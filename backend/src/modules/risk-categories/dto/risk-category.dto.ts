import { ApiProperty } from '@nestjs/swagger';

/** Master data record for a type of hazard (HSE hazard classification). */
export class RiskCategoryDto {
  @ApiProperty({ description: 'Type of hazard ID' })
  id: string;

  @ApiProperty({ description: 'Display name' })
  name: string;

  @ApiProperty({ description: 'Unique code' })
  code: string;

  @ApiProperty({ required: false, description: 'Optional description' })
  description?: string;

  @ApiProperty({ description: 'Whether this type of hazard is active' })
  isActive: boolean;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, type: 'array', isArray: true, description: 'Risks under this type of hazard (when included)' })
  risks?: any[]; // We'll only include risks when explicitly requested
} 