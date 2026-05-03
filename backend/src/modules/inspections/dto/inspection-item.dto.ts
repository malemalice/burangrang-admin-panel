import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { GeneralStatusEnum } from '@prisma/client';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { RiskDto } from 'src/modules/risks/dto/risk.dto';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { AreaDto } from 'src/modules/areas/dto/area.dto';
import { InspectionImageDto } from './inspection-image.dto';
import { RiskMitigationRecordDto } from '../../risk-assessment/dto/risk-mitigation-data.dto';
import { InspectionChecklistResultDto } from './inspection-checklist-result.dto';

export class InspectionItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionId: string;

  @ApiProperty({ required: false })
  @Expose()
  inspection?: {
    id: string;
    code: string;
    creator?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };

  @ApiProperty()
  @Expose()
  areaId: string;

  @ApiProperty({ type: AreaDto })
  @Expose()
  area: AreaDto;

  @ApiProperty({ description: 'Type of hazard ID' })
  @Expose()
  riskCategoryId: string;

  @ApiProperty({ type: RiskCategoryDto, description: 'Type of hazard' })
  @Expose()
  riskCategory: RiskCategoryDto;

  @ApiProperty()
  @Expose()
  riskId: string;

  @ApiProperty({ type: RiskDto })
  @Expose()
  risk: RiskDto;

  @ApiProperty()
  @Expose()
  assignedDepartmentId: string;

  @ApiProperty({ type: DepartmentDto })
  @Expose()
  assignedDepartment: DepartmentDto;

  @ApiProperty()
  @Expose()
  assigneeId?: string;

  @ApiProperty({ type: UserDto })
  @Expose()
  assignee?: UserDto;

  @ApiProperty()
  @Expose()
  description?: string;

  @ApiProperty()
  @Expose()
  followUpNotes?: string;

  @ApiProperty()
  @Expose()
  findings?: string;

  @ApiProperty()
  @Expose()
  dueDateAt?: Date;

  @ApiProperty({ enum: GeneralStatusEnum })
  @Expose()
  status: GeneralStatusEnum;

  @ApiProperty()
  @Expose()
  order: number;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => InspectionImageDto, isArray: true })
  @Expose()
  images: InspectionImageDto[];

  @ApiProperty({ type: RiskMitigationRecordDto, required: false, description: 'Risk mitigation record' })
  @Expose()
  mitigation?: RiskMitigationRecordDto;

  @ApiProperty({ required: false, description: 'Checklist template ID' })
  @Expose()
  checklistId?: string;

  @ApiProperty({ type: () => InspectionChecklistResultDto, isArray: true, required: false })
  @Expose()
  checklistResults?: InspectionChecklistResultDto[];

  constructor(partial: Partial<InspectionItemDto>) {
    Object.assign(this, partial);
  }
}

