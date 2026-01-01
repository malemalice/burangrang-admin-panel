import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { RiskDto } from 'src/modules/risks/dto/risk.dto';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { InspectionImageDto } from './inspection-image.dto';

export class InspectionItemDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  inspectionId: string;

  @ApiProperty()
  @Expose()
  riskCategoryId: string;

  @ApiProperty({ type: RiskCategoryDto })
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

  constructor(partial: Partial<InspectionItemDto>) {
    Object.assign(this, partial);
  }
}

