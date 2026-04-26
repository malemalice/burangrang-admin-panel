import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WorkPermitDto } from './work-permit.dto';

/** Master risk mitigations (read-only) for public permit safety-guidance display */
export class PublicWorkPermitRiskMitigationItemDto {
  @ApiProperty()
  id: string;

  @ApiPropertyOptional()
  eliminate?: string;

  @ApiPropertyOptional()
  transfer?: string;

  @ApiPropertyOptional()
  reduce?: string;

  @ApiPropertyOptional()
  accept?: string;

  @ApiProperty()
  isActive: boolean;

  @ApiProperty()
  riskId: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;
}

/**
 * Public anonymous flow only — who must complete a required course.
 */
export class PublicWorkPermitCourseAssigneeDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  displayName: string;

  @ApiProperty({ enum: ['applicant', 'worker', 'employee'] })
  source: 'applicant' | 'worker' | 'employee';
}

/**
 * One required course on the permit with per-assignee completion (via LMS enrollment).
 */
export class PublicWorkPermitRequiredCourseStatusDto {
  @ApiProperty()
  courseId: string;

  @ApiPropertyOptional()
  courseTitle?: string;

  @ApiProperty()
  isRequired: boolean;

  @ApiProperty({
    description: 'userId -> has at least one COMPLETED enrollment for this courseId',
  })
  userCompletions: Record<string, boolean>;
}

/**
 * Shipped on GET /work-permits/public/:token when `requireCourseVerification` is on.
 */
export class PublicWorkPermitCourseVerificationDto {
  @ApiProperty()
  enabled: boolean;

  @ApiProperty({ type: [PublicWorkPermitCourseAssigneeDto] })
  assignees: PublicWorkPermitCourseAssigneeDto[];

  @ApiProperty({ type: [PublicWorkPermitRequiredCourseStatusDto] })
  requiredCourses: PublicWorkPermitRequiredCourseStatusDto[];

  @ApiProperty()
  allRequiredCompleted: boolean;

  @ApiProperty({ type: [String] })
  unmetMessages: string[];
}

export type WorkPermitPublicApplicantPhase = 'draft' | 'sign_sk' | 'view';

/**
 * Response for anonymous applicant (token) load + patch/submit/sign contracts.
 * Keeps `isEditable` + `mode` for backward compatibility.
 */
export class PublicWorkPermitByTokenResponseDto {
  @ApiProperty({ type: () => WorkPermitDto })
  workPermit: WorkPermitDto;

  @ApiProperty()
  isEditable: boolean;

  @ApiProperty({ enum: ['editable', 'readonly'] })
  mode: 'editable' | 'readonly';

  @ApiProperty({ enum: ['draft', 'sign_sk', 'view'] })
  applicantPhase: WorkPermitPublicApplicantPhase;

  @ApiProperty({ description: 'True when DRAFT or REJECTED' })
  canEditDraft: boolean;

  @ApiProperty({ description: 'True when WAITING_APPLICANT_SIGN' })
  canSignSk: boolean;

  @ApiProperty({
    description:
      'True when canSignSk and course rules (if any) allow the applicant to sign (hard gate = all required completions done).',
  })
  canSignSkAction: boolean;

  @ApiProperty({ type: () => PublicWorkPermitCourseVerificationDto })
  courseVerification: PublicWorkPermitCourseVerificationDto;

  @ApiProperty({
    description:
      'For each risk id used on permit classification safety-guidance rows, active master mitigations (avoids unauthenticated /risk-mitigations calls on the public page). Keys are risk UUIDs; values are mitigation rows.',
    type: Object,
  })
  mitigationsByRiskId: Record<string, PublicWorkPermitRiskMitigationItemDto[]>;

  @ApiProperty({
    description:
      'When true, show classification safety guideline narrative/attachments in work permit UI (mirrors `feature.work_permit_classification_content.enabled` without a separate settings call).',
  })
  classificationContentEnabled: boolean;
}
