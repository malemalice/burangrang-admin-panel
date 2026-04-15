import { ApiProperty } from '@nestjs/swagger';
import { RiskCategoryDto } from '../../risk-categories/dto/risk-category.dto';

export class RiskDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  code: string;

  @ApiProperty({ required: false })
  description?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ description: 'Type of hazard ID' })
  riskCategoryId: string;

  @ApiProperty({ type: () => RiskCategoryDto, required: false, description: 'Type of hazard' })
  riskCategory?: RiskCategoryDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, type: 'array', isArray: true })
  mitigations?: any[]; // We'll only include mitigations when explicitly requested
}
