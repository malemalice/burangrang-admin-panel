import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsString, IsOptional, IsDate, IsBoolean, IsDateString, IsArray } from 'class-validator';

export enum WorkPermitStatusEnum {
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  IN_REVIEW_PROJECT_OWNER = 'IN_REVIEW_PROJECT_OWNER',
  IN_REVIEW_HSE = 'IN_REVIEW_HSE',
  WAITING_APPLICANT_SIGN = 'WAITING_APPLICANT_SIGN',
  IN_REVIEW_SECURITY = 'IN_REVIEW_SECURITY',
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

  @ApiProperty({ description: 'Job safety analysis', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  jobSafetyAnalysis?: string | null;

  @ApiProperty({ description: 'Work requirements', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  workRequirements?: string;

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

  @ApiProperty({
    description:
      'True when the applicant has signed the HSE safety guideline (derived from applicantSignedAt; not stored as a separate column)',
    default: false,
  })
  @Expose()
  @IsBoolean()
  acknowledgedSafetyGuideline: boolean;

  @ApiProperty({ description: 'Work permit status', enum: WorkPermitStatusEnum })
  @Expose()
  @IsString()
  status: string;

  @ApiProperty({ description: 'Whether work permit is active' })
  @Expose()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({ description: 'Soft delete timestamp', required: false, nullable: true })
  @Expose()
  @IsOptional()
  deletedAt?: Date | null;

  @ApiProperty({ description: 'User id of actor for soft delete', required: false, nullable: true })
  @Expose()
  @IsOptional()
  @IsString()
  deletedBy?: string | null;

  @ApiProperty({ description: 'When applicant acknowledged HSE safety guideline', required: false })
  @Expose()
  @IsOptional()
  @IsDateString()
  applicantSignedAt?: string;

  @ApiProperty({ description: 'Applicant signature metadata or token', required: false })
  @Expose()
  @IsOptional()
  @IsString()
  applicantSignature?: string;

  @ApiProperty({ description: 'Created by user ID' })
  @Expose()
  @IsString()
  createdBy: string;

  @ApiProperty({
    description:
      'Business applicant user ID (contractor) who must perform applicant-only actions (e.g. sign SK).',
    required: false,
  })
  @Expose()
  @IsOptional()
  @IsString()
  applicantUserId?: string;

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
    phone?: string | null;
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

  @ApiProperty({ description: 'Applicant user (contractor)', required: false })
  @Expose()
  @IsOptional()
  applicant?: {
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
      description?: string | null;
      /** Master safety guideline HTML — fallback when permit snapshot/rows are empty */
      safetyGuideline?: string | null;
    };
    order: number;
    safetyGuidelineSnapshot?: string | null;
    safetyGuidanceRows?: Array<{
      id: string;
      riskId: string;
      safetyEquipmentId: string;
      notes?: string | null;
      order: number;
      riskNameSnapshot?: string | null;
      safetyEquipmentNameSnapshot?: string | null;
      risk?: { id: string; name: string; code: string };
      safetyEquipment?: { id: string; name: string; code: string };
    }>;
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
    /** Join row id; profile data is on `worker`. */
    workerId: string;
    userId: string;
    /** From linked user profile (not stored on permit worker row). */
    professionId?: string | null;
    /** From linked user profile (not stored on permit worker row). */
    idNumber?: string | null;
    /** From `t_worker` (worker profile). */
    certificateUrl?: string;
    /** From `t_worker` (worker profile). */
    healthDeclarationUrl?: string | null;
    healthScreening?: {
      id: string;
      status: string;
      /** Permit that consumes this declaration; null = available for any permit. */
      consumedByWorkPermitId?: string | null;
      quizId: string;
    };
    user?: {
      id: string;
      firstName: string;
      lastName: string;
      email: string;
      professionId?: string | null;
      idNumber?: string | null;
    };
    profession?: {
      id: string;
      name: string;
      code: string;
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
    activity?: string;
    mitigation?: string;
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
