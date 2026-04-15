import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import {
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  IncidentActivitiesEnum,
  IncidentScopeEnum,
  PriorityEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  SourceEnum,
} from '@prisma/client';
import { AreaDto } from 'src/modules/areas/dto/area.dto';
import { RiskCategoryDto } from 'src/modules/risk-categories/dto/risk-category.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { DepartmentDto } from 'src/modules/departments/dto/department.dto';
import { RoomDto } from 'src/modules/rooms/dto/room.dto';
import { IncidentInjuredPersonDto } from './incident-injured-person.dto';
import { IncidentWitnessDto } from './incident-witness.dto';
import { IncidentAssetDto } from './incident-asset.dto';
import { IncidentImageDto } from './incident-image.dto';
import { IncidentAttachmentDto } from './incident-attachment.dto';

export class IncidentDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  code: string;

  @ApiProperty()
  @Expose()
  subject: string;

  @ApiProperty()
  @Expose()
  incidentDate: Date;

  @ApiProperty({ required: false })
  @Expose()
  roomId?: string;

  @ApiProperty({ type: () => RoomDto, required: false })
  @Expose()
  room?: RoomDto;

  @ApiProperty()
  @Expose()
  areaId: string;

  @ApiProperty({ type: () => AreaDto })
  @Expose()
  area: AreaDto;

  @ApiProperty({ enum: IncidentTypeEnum })
  @Expose()
  incidentType: IncidentTypeEnum;

  @ApiProperty({ enum: IncidentClassificationEnum })
  @Expose()
  incidentClassification: IncidentClassificationEnum;

  @ApiProperty({ enum: IncidentActivitiesEnum })
  @Expose()
  activities: IncidentActivitiesEnum;

  @ApiProperty({ enum: IncidentScopeEnum })
  @Expose()
  type: IncidentScopeEnum;

  @ApiProperty()
  @Expose()
  requesterId: string;

  @ApiProperty({ type: () => UserDto })
  @Expose()
  requester: UserDto;

  @ApiProperty()
  @Expose()
  reportedBy: string;

  @ApiProperty({ type: () => UserDto })
  @Expose()
  reporter: UserDto;

  @ApiProperty({ required: false })
  @Expose()
  technicianId?: string;

  @ApiProperty({ type: () => UserDto, required: false })
  @Expose()
  technician?: UserDto;

  @ApiProperty({ enum: PriorityEnum })
  @Expose()
  priority: PriorityEnum;

  @ApiProperty({ description: 'Type of hazard ID' })
  @Expose()
  riskCategoryId: string;

  @ApiProperty({ type: () => RiskCategoryDto, description: 'Type of hazard' })
  @Expose()
  riskCategory: RiskCategoryDto;

  @ApiProperty({ required: false })
  @Expose()
  description?: string;

  @ApiProperty({ required: false })
  @Expose()
  controlMeasure?: string;

  @ApiProperty({ required: false })
  @Expose()
  dueDate?: Date;

  @ApiProperty({ required: false })
  @Expose()
  expectedOutcome?: string;

  @ApiProperty({ enum: StopActivityEnum })
  @Expose()
  needToStopActivity: StopActivityEnum;

  @ApiProperty({ required: false })
  @Expose()
  stopActivityDescription?: string;

  @ApiProperty({ enum: TreatmentEnum })
  @Expose()
  treatment: TreatmentEnum;

  @ApiProperty({ required: false })
  @Expose()
  treatmentDescription?: string;

  @ApiProperty({ enum: AbsenceEnum })
  @Expose()
  absence: AbsenceEnum;

  @ApiProperty({ required: false })
  @Expose()
  resolution?: string;

  @ApiProperty()
  @Expose()
  assignedDepartmentId: string;

  @ApiProperty({ type: () => DepartmentDto })
  @Expose()
  assignedDepartment: DepartmentDto;

  @ApiProperty({ required: false })
  @Expose()
  assigneeId?: string;

  @ApiProperty({ type: () => UserDto, required: false })
  @Expose()
  assignee?: UserDto;

  @ApiProperty({ enum: GeneralStatusEnum })
  @Expose()
  status: GeneralStatusEnum;

  @ApiProperty({ enum: SourceEnum })
  @Expose()
  source: SourceEnum;

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ type: () => UserDto })
  @Expose()
  creator: UserDto;

  @ApiProperty({ type: () => IncidentInjuredPersonDto, isArray: true })
  @Expose()
  injuredPersons: IncidentInjuredPersonDto[];

  @ApiProperty({ type: () => IncidentWitnessDto, isArray: true })
  @Expose()
  witnesses: IncidentWitnessDto[];

  @ApiProperty({ type: () => IncidentAssetDto, isArray: true })
  @Expose()
  assets: IncidentAssetDto[];

  @ApiProperty({ type: () => IncidentImageDto, isArray: true })
  @Expose()
  images: IncidentImageDto[];

  @ApiProperty({ type: () => IncidentAttachmentDto, isArray: true })
  @Expose()
  attachments: IncidentAttachmentDto[];

  constructor(partial: Partial<IncidentDto>) {
    Object.assign(this, partial);
  }
}
