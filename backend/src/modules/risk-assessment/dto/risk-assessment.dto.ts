import { ApiProperty } from '@nestjs/swagger';
import { RiskAssessmentItemDto } from './risk-assessment-item.dto';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class RiskAssessmentDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  description?: string;

  @ApiProperty()
  departmentId: string;

  @ApiProperty({ type: DepartmentDto })
  department: DepartmentDto;

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

  @ApiProperty({ type: () => RiskAssessmentItemDto, isArray: true })
  items: RiskAssessmentItemDto[];

  @ApiProperty()
  assigneeId?: string;

  @ApiProperty({ type: UserDto })
  assignee?: UserDto;

  @ApiProperty()
  actionPlan?: string;
}