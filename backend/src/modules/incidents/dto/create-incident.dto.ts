import {
  IsString,
  IsUUID,
  IsOptional,
  IsBoolean,
  IsDate,
  IsArray,
  ValidateNested,
  IsNotEmpty,
  IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import {
  GeneralStatusEnum,
  IncidentTypeEnum,
  IncidentClassificationEnum,
  PriorityEnum,
  StopActivityEnum,
  TreatmentEnum,
  AbsenceEnum,
  SourceEnum,
} from '@prisma/client';
import { CreateIncidentInjuredPersonDto } from './create-incident-injured-person.dto';
import { CreateIncidentWitnessDto } from './create-incident-witness.dto';
import { CreateIncidentAssetDto } from './create-incident-asset.dto';
import { CreateIncidentImageDto } from './create-incident-image.dto';
import { CreateIncidentAttachmentDto } from './create-incident-attachment.dto';

export class CreateIncidentDto {
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  code: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  subject: string;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  @ApiProperty()
  incidentDate: Date;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  roomId?: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  areaId: string;

  @IsNotEmpty()
  @IsEnum(IncidentTypeEnum)
  @ApiProperty({ enum: IncidentTypeEnum })
  incidentType: IncidentTypeEnum;

  @IsNotEmpty()
  @IsEnum(IncidentClassificationEnum)
  @ApiProperty({ enum: IncidentClassificationEnum })
  incidentClassification: IncidentClassificationEnum;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  requesterId: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  reportedBy: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  technicianId?: string;

  @IsEnum(PriorityEnum)
  @IsOptional()
  @ApiProperty({ enum: PriorityEnum, default: 'NORMAL' })
  priority?: PriorityEnum;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  riskCategoryId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  description?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  controlMeasure?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  dueDate?: Date;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  expectedOutcome?: string;

  @IsEnum(StopActivityEnum)
  @IsOptional()
  @ApiProperty({ enum: StopActivityEnum, default: 'NOT_SPECIFIED' })
  needToStopActivity?: StopActivityEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  stopActivityDescription?: string;

  @IsEnum(TreatmentEnum)
  @IsOptional()
  @ApiProperty({ enum: TreatmentEnum, default: 'NOT_SPECIFIED' })
  treatment?: TreatmentEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  treatmentDescription?: string;

  @IsEnum(AbsenceEnum)
  @IsOptional()
  @ApiProperty({ enum: AbsenceEnum, default: 'NOT_SPECIFIED' })
  absence?: AbsenceEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  resolution?: string;

  @IsNotEmpty()
  @IsUUID()
  @ApiProperty()
  assignedDepartmentId: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  assigneeId?: string;

  @IsNotEmpty()
  @IsEnum(GeneralStatusEnum)
  @ApiProperty({ enum: GeneralStatusEnum })
  status: GeneralStatusEnum;

  @IsEnum(SourceEnum)
  @IsOptional()
  @ApiProperty({ enum: SourceEnum, default: 'SYSTEM' })
  source?: SourceEnum;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: true })
  isActive?: boolean;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncidentInjuredPersonDto)
  @IsOptional()
  @ApiProperty({ type: [CreateIncidentInjuredPersonDto], required: false })
  injuredPersons?: CreateIncidentInjuredPersonDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncidentWitnessDto)
  @IsOptional()
  @ApiProperty({ type: [CreateIncidentWitnessDto], required: false })
  witnesses?: CreateIncidentWitnessDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncidentAssetDto)
  @IsOptional()
  @ApiProperty({ type: [CreateIncidentAssetDto], required: false })
  assets?: CreateIncidentAssetDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncidentImageDto)
  @IsOptional()
  @ApiProperty({ type: [CreateIncidentImageDto], required: false })
  images?: CreateIncidentImageDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateIncidentAttachmentDto)
  @IsOptional()
  @ApiProperty({ type: [CreateIncidentAttachmentDto], required: false })
  attachments?: CreateIncidentAttachmentDto[];
}
