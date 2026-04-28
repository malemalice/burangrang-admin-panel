import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsDateString,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsInt,
  Min,
  ArrayMinSize,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { WorkPermitClassificationSafetyGuidanceOnCreateDto } from './work-permit-classification-safety-guidance.dto';

export class WorkPermitClassificationDto {
  @ApiProperty({ description: 'Work classification ID' })
  @IsString()
  @IsNotEmpty()
  workClassificationId: string;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitEmployeeDto {
  @ApiProperty({ description: 'User ID (optional, can use employeeName instead)', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ description: 'Employee name (free text, optional if userId provided)', required: false })
  @IsOptional()
  @IsString()
  employeeName?: string;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitWorkerDto {
  @ApiProperty({
    description:
      'User ID (contractor/guest worker). Profession and ID number come from the user profile. Certificate and health declaration URLs are stored on the worker profile (`t_worker`), not on the permit join row.',
  })
  @IsString()
  @IsNotEmpty()
  userId: string;

  @ApiProperty({
    description: 'Certificate URL (persisted on worker profile)',
    required: false,
  })
  @IsOptional()
  @IsString()
  certificateUrl?: string;

  @ApiProperty({
    description:
      'Legacy uploaded health declaration file URL (optional if healthScreeningId is set); persisted on worker profile',
    required: false,
  })
  @IsOptional()
  @IsString()
  healthDeclarationUrl?: string;

  @ApiProperty({
    description: 'Existing structured health screening id to link (optional if healthDeclarationUrl is set)',
    required: false,
  })
  @IsOptional()
  @IsString()
  healthScreeningId?: string;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitHeavyEquipmentDto {
  @ApiProperty({ description: 'Heavy equipment ID' })
  @IsString()
  @IsNotEmpty()
  heavyEquipmentId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitToolDto {
  @ApiProperty({ description: 'Tool ID' })
  @IsString()
  @IsNotEmpty()
  toolId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitMaterialDto {
  @ApiProperty({ description: 'Material ID' })
  @IsString()
  @IsNotEmpty()
  materialId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitMachineDto {
  @ApiProperty({ description: 'Machine ID' })
  @IsString()
  @IsNotEmpty()
  machineId: string;

  @ApiProperty({ description: 'Quantity' })
  @IsInt()
  @Min(1)
  quantity: number;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitRequiredCourseDto {
  @ApiProperty({ description: 'Course ID' })
  @IsString()
  @IsNotEmpty()
  courseId: string;

  @ApiProperty({ description: 'Is required', default: true })
  @IsOptional()
  @IsBoolean()
  isRequired?: boolean;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitHazardDto {
  @ApiProperty({ description: 'Hazard ID (reference to risk)', required: false })
  @IsOptional()
  @IsString()
  hazardId?: string;

  @ApiProperty({ description: 'Hazard name (free text)' })
  @IsString()
  @IsNotEmpty()
  hazardName: string;

  @ApiProperty({ description: 'Activity', required: false })
  @IsOptional()
  @IsString()
  activity?: string;

  @ApiProperty({ description: 'Mitigation', required: false })
  @IsOptional()
  @IsString()
  mitigation?: string;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class WorkPermitAttachmentDto {
  @ApiProperty({ description: 'File URL' })
  @IsString()
  @IsNotEmpty()
  fileUrl: string;

  @ApiProperty({ description: 'File name' })
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @ApiProperty({ description: 'File type', required: false })
  @IsOptional()
  @IsString()
  fileType?: string;

  @ApiProperty({ description: 'Description', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ description: 'Order/sequence' })
  @IsInt()
  @Min(0)
  order: number;
}

export class CreateWorkPermitDto {
  @ApiProperty({
    description:
      'Business applicant user ID (contractor). Required when creator is not CONTRACTOR; ignored/forced to self when creator is CONTRACTOR.',
    required: false,
  })
  @IsOptional()
  @IsString()
  applicantUserId?: string;

  @ApiProperty({ description: 'Project name' })
  @IsString()
  @IsNotEmpty()
  projectName: string;

  @ApiProperty({ description: 'Area ID' })
  @IsString()
  @IsNotEmpty()
  areaId: string;

  @ApiProperty({ description: 'Company ID' })
  @IsString()
  @IsNotEmpty()
  companyId: string;

  @ApiProperty({ description: 'Proposed start date (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  proposedStartDate: string;

  @ApiProperty({ description: 'Proposed end date (ISO 8601 format)' })
  @IsDateString()
  @IsNotEmpty()
  proposedEndDate: string;

  @ApiProperty({ description: 'Work stages description' })
  @IsString()
  @IsNotEmpty()
  workStagesDescription: string;

  @ApiProperty({ description: 'Job safety analysis', required: false, default: '' })
  @IsOptional()
  @IsString()
  jobSafetyAnalysis?: string;

  @ApiProperty({ description: 'Work requirements', required: false })
  @IsOptional()
  @IsString()
  workRequirements?: string;

  @ApiProperty({
    description:
      'Required when work classification "Others" (code OTHERS) is selected — free-text description of the other work type',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  workClassificationOtherDetail?: string;

  @ApiProperty({ description: 'Require course verification', default: false })
  @IsOptional()
  @IsBoolean()
  requireCourseVerification?: boolean;

  @ApiProperty({ description: 'Work classifications', type: [WorkPermitClassificationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitClassificationDto)
  classifications?: WorkPermitClassificationDto[];

  @ApiProperty({
    description:
      'Optional overrides per classification line (matched by workClassificationId + order) after template copy',
    type: [WorkPermitClassificationSafetyGuidanceOnCreateDto],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitClassificationSafetyGuidanceOnCreateDto)
  classificationSafetyGuidance?: WorkPermitClassificationSafetyGuidanceOnCreateDto[];

  @ApiProperty({ description: 'Employees/PICs', type: [WorkPermitEmployeeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitEmployeeDto)
  employees?: WorkPermitEmployeeDto[];

  @ApiProperty({ description: 'Workers', type: [WorkPermitWorkerDto] })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one worker is required' })
  @ValidateNested({ each: true })
  @Type(() => WorkPermitWorkerDto)
  workers: WorkPermitWorkerDto[];

  @ApiProperty({ description: 'Heavy equipment', type: [WorkPermitHeavyEquipmentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitHeavyEquipmentDto)
  heavyEquipment?: WorkPermitHeavyEquipmentDto[];

  @ApiProperty({ description: 'Tools', type: [WorkPermitToolDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitToolDto)
  tools?: WorkPermitToolDto[];

  @ApiProperty({ description: 'Materials', type: [WorkPermitMaterialDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitMaterialDto)
  materials?: WorkPermitMaterialDto[];

  @ApiProperty({ description: 'Machines', type: [WorkPermitMachineDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitMachineDto)
  machines?: WorkPermitMachineDto[];

  @ApiProperty({ description: 'Required courses', type: [WorkPermitRequiredCourseDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitRequiredCourseDto)
  requiredCourses?: WorkPermitRequiredCourseDto[];

  @ApiProperty({ description: 'Hazards', type: [WorkPermitHazardDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitHazardDto)
  hazards?: WorkPermitHazardDto[];

  @ApiProperty({ description: 'Attachments', type: [WorkPermitAttachmentDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitAttachmentDto)
  attachments?: WorkPermitAttachmentDto[];

  @ApiProperty({ description: 'Supervisor guest IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  supervisorIds?: string[];

  @ApiProperty({ description: 'HSE Officer user IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  hseOfficerIds?: string[];

  @ApiProperty({ description: 'Safety equipment IDs', type: [String], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  safetyEquipmentIds?: string[];
}
