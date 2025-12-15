import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { RiskAssessmentItemDto } from './risk-assessment-item.dto';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';

export class RiskAssessmentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  departmentId: string;

  @ApiProperty({ type: DepartmentDto })
  @Expose()
  department: DepartmentDto;

  @ApiProperty()
  @Expose()
  assessmentDate: Date;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  creator: UserDto;

  @ApiProperty({ enum: GeneralStatusEnum })
  @Expose()
  status: GeneralStatusEnum;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty({ type: () => RiskAssessmentItemDto, isArray: true })
  @Expose()
  items: RiskAssessmentItemDto[];

  @ApiProperty()
  @Expose()
  assigneeId?: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  assignee?: UserDto;

  @ApiProperty()
  @Expose()
  actionPlan?: string;

  constructor(partial: Partial<RiskAssessmentDto>) {
    Object.assign(this, partial);
  }
}