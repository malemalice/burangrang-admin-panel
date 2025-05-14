import { ApiProperty } from '@nestjs/swagger';
import { HseCategoryDto } from '../../hse-categories/dto/hse-category.dto';

export class ThreatDto {
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

  @ApiProperty()
  hseCategoryId: string;

  @ApiProperty({ type: () => HseCategoryDto, required: false })
  hseCategory?: HseCategoryDto;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false, type: 'array', isArray: true })
  mitigations?: any[]; // We'll only include mitigations when explicitly requested
} 