import { ApiProperty } from '@nestjs/swagger';
import { AssessmentItemDto } from './assessment-item.dto';

export class AssessmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  departmentId: string;

  @ApiProperty()
  assessmentDate: Date;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty()
  createdBy: string;

  @ApiProperty()
  status: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty({ type: () => AssessmentItemDto, isArray: true })
  items: AssessmentItemDto[];
} 