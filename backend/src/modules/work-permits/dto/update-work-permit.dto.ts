import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsDateString, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import {
  WorkPermitClassificationDto,
  WorkPermitEmployeeDto,
  WorkPermitWorkerDto,
  WorkPermitHeavyEquipmentDto,
  WorkPermitToolDto,
  WorkPermitMaterialDto,
  WorkPermitMachineDto,
  WorkPermitProfessionDto,
  WorkPermitRequiredCourseDto,
  WorkPermitHazardDto,
  WorkPermitAttachmentDto,
} from './create-work-permit.dto';

export class UpdateWorkPermitDto {
  @ApiProperty({ description: 'Project name', required: false })
  @IsOptional()
  @IsString()
  projectName?: string;

  @ApiProperty({ description: 'Area ID', required: false })
  @IsOptional()
  @IsString()
  areaId?: string;

  @ApiProperty({ description: 'Company ID', required: false })
  @IsOptional()
  @IsString()
  companyId?: string;

  @ApiProperty({ description: 'Proposed start date (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  proposedStartDate?: string;

  @ApiProperty({ description: 'Proposed end date (ISO 8601 format)', required: false })
  @IsOptional()
  @IsDateString()
  proposedEndDate?: string;

  @ApiProperty({ description: 'Work stages description', required: false })
  @IsOptional()
  @IsString()
  workStagesDescription?: string;

  @ApiProperty({ description: 'Job safety analysis', required: false })
  @IsOptional()
  @IsString()
  jobSafetyAnalysis?: string;

  @ApiProperty({ description: 'Work requirements', required: false })
  @IsOptional()
  @IsString()
  workRequirements?: string;

  @ApiProperty({ description: 'Safety guideline', required: false })
  @IsOptional()
  @IsString()
  safetyGuideline?: string;

  @ApiProperty({ description: 'Require course verification', required: false })
  @IsOptional()
  @IsBoolean()
  requireCourseVerification?: boolean;

  @ApiProperty({ description: 'Work classifications', type: [WorkPermitClassificationDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitClassificationDto)
  classifications?: WorkPermitClassificationDto[];

  @ApiProperty({ description: 'Employees/PICs', type: [WorkPermitEmployeeDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitEmployeeDto)
  employees?: WorkPermitEmployeeDto[];

  @ApiProperty({ description: 'Workers', type: [WorkPermitWorkerDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitWorkerDto)
  workers?: WorkPermitWorkerDto[];

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

  @ApiProperty({ description: 'Professions', type: [WorkPermitProfessionDto], required: false })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => WorkPermitProfessionDto)
  professions?: WorkPermitProfessionDto[];

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
