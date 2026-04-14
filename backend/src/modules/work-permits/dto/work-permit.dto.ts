import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsBoolean, IsDateString, IsArray } from 'class-validator';

export enum WorkPermitStatusEnum {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  IN_REVIEW_HSE = 'IN_REVIEW_HSE',
  IN_REVIEW_SECURITY = 'IN_REVIEW_SECURITY',
  NEED_INFO = 'NEED_INFO',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CLOSED = 'CLOSED',
  EXTENDED = 'EXTENDED',
}

export class WorkPermitDto {
  @ApiProperty({ description: 'Work permit unique identifier' })
  @Expose()
  @IsString()
  id: string;

  @ApiProperty({ description: 'Work permit code (auto-generated)' })
  @Expose()
  @IsString()
  code: string;

  @ApiProperty({ description: 'Project name' })
  @Expose()
  @IsString()
  projectName: string;

  @ApiProperty({ description: 'Area ID' })
  @Expose()
  @IsString()
  areaId: string;

  @ApiProperty({ description: 'Company ID' })
  @Expose()
  @IsString()
  companyId: string;

  @ApiProperty({ description: 'Proposed start date' })
  @Expose()
  @IsDate()
  proposedStartDate: Date;

  @ApiProperty({ description: 'Proposed end date' })
  @Expose()
  @IsDate()
  proposedEndDate: Date;

  @ApiProperty({ description: 'Work stages description' })
  @Expose()
  @IsString()
  workStagesDescription: string;

  @ApiProperty({ description: 'Job safety analysis' })
  @Expose()
  @IsString()
  jobSafetyAnalysis: string;

  @ApiProperty({ description: 'Work requirements', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  workRequirements?: string;

  @ApiProperty({ description: 'Safety guideline', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  safetyGuideline?: string;

  @ApiProperty({
    description: 'Free-text when "Others" work classification is used',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  workClassificationOtherDetail?: string;

  @ApiProperty({ description: 'Require course verification', default: false })
  @Expose()
  @IsBoolean()
  requireCourseVerification: boolean;

  @ApiProperty({ description: 'Work permit status', enum: WorkPermitStatusEnum })
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Whether work permit is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Created by user ID' })
  @Expose()
  @IsString()
  createdBy: string;

  @ApiProperty({ description: 'Creation timestamp' })
  @Expose()
  @IsDate()
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  @Expose()
  @IsDate()
  updatedAt: Date;

  // Relations (optional, included when requested)
  @ApiProperty({ description: 'Area', required: false })
  @Expose()
  @IsOptional()
  area?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Company', required: false })
  @Expose()
  @IsOptional()
  company?: {
    id: string;
    name: string;
    code: string;
  };

  @ApiProperty({ description: 'Creator user', required: false })
  @Expose()
  @IsOptional()
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };

  @ApiProperty({ description: 'Work classifications', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  classifications?: Array<{
    id: string;
    workClassificationId: string;
    workClassification?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Employees/PICs', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  employees?: Array<{
    id: string;
    userId?: string;
    employeeName?: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Workers', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  workers?: Array<{
    id: string;
    userId: string;
    idNumber?: string;
    certificateUrl?: string;
    healthDeclarationUrl: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Heavy equipment', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  heavyEquipment?: Array<{
    id: string;
    heavyEquipmentId: string;
    quantity: number;
    heavyEquipment?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Tools', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  tools?: Array<{
    id: string;
    toolId: string;
    quantity: number;
    tool?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Materials', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  materials?: Array<{
    id: string;
    materialId: string;
    quantity: number;
    material?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Machines', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  machines?: Array<{
    id: string;
    machineId: string;
    quantity: number;
    machine?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Professions', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  professions?: Array<{
    id: string;
    professionId: string;
    quantity: number;
    profession?: {
      id: string;
      name: string;
      code: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Required courses', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  requiredCourses?: Array<{
    id: string;
    courseId: string;
    isRequired: boolean;
    course?: {
      id: string;
      title: string;
      slug: string;
    };
    order: number;
  }>;

  @ApiProperty({ description: 'Hazards', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  hazards?: Array<{
    id: string;
    hazardId?: string;
    hazardName: string;
    description?: string;
    controlMeasure?: string;
    order: number;
  }>;

  @ApiProperty({ description: 'Attachments', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  attachments?: Array<{
    id: string;
    fileUrl: string;
    fileName: string;
    fileType?: string;
    description?: string;
    order: number;
  }>;

  @ApiProperty({ description: 'Supervisors (guests)', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  supervisors?: Array<{
    id: string;
    guestId: string;
    guest?: {
      id: string;
      name: string;
      email?: string;
      phone?: string;
    };
  }>;

  @ApiProperty({ description: 'HSE Officers (users)', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  hseOfficers?: Array<{
    id: string;
    userId: string;
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
    };
  }>;

  @ApiProperty({ description: 'Safety equipment', required: false, type: [Object] })
  @Expose()
  @IsOptional()
  @IsArray()
  safetyEquipment?: Array<{
    id: string;
    safetyEquipmentId: string;
    safetyEquipment?: {
      id: string;
      name: string;
      code: string;
    };
  }>;

  constructor(partial: Partial<WorkPermitDto>) {
    Object.assign(this, partial);
  }
}
