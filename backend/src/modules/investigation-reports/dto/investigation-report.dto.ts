import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { InvestigationStatusEnum } from '@prisma/client';
import { IncidentDto } from 'src/modules/incidents/dto/incident.dto';
import { UserDto } from 'src/modules/users/dto/user.dto';
import { InvestigationCostDto } from './investigation-cost.dto';
import { InvestigationCauseDto } from './investigation-cause.dto';
import { InvestigationActionPlanDto } from './investigation-action-plan.dto';
import { InvestigationSignatoryDto } from './investigation-signatory.dto';

export class InvestigationReportDto {
  @ApiProperty()
  @Expose()
  id: string;

  @ApiProperty()
  @Expose()
  incidentId: string;

  @ApiProperty({ type: () => IncidentDto, required: false })
  @Expose()
  incident?: IncidentDto;

  @ApiProperty()
  @Expose()
  reportNumber: string;

  @ApiProperty({ required: false })
  @Expose()
  taskBeingPerformed?: string;

  @ApiProperty({ required: false })
  @Expose()
  equipmentUsed?: string;

  @ApiProperty({ enum: InvestigationStatusEnum })
  @Expose()
  status: InvestigationStatusEnum;

  @ApiProperty({ required: false })
  @Expose()
  hsComments?: string;

  @ApiProperty({ required: false })
  @Expose()
  hsCommentSignedBy?: string;

  @ApiProperty({ type: () => UserDto, required: false })
  @Expose()
  hsSigner?: UserDto;

  @ApiProperty({ required: false })
  @Expose()
  hsCommentSignedAt?: Date;

  @ApiProperty()
  @Expose()
  distributionSafetyCommittee: boolean;

  @ApiProperty()
  @Expose()
  distributionHeadOfBusinessOp: boolean;

  @ApiProperty()
  @Expose()
  distributionRelatedDepartment: boolean;

  @ApiProperty({ type: [String] })
  @Expose()
  bodyPartsSummary: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  injuryTypesSummary: string[];

  @ApiProperty({ type: [String] })
  @Expose()
  mechanismsSummary: string[];

  @ApiProperty()
  @Expose()
  isActive: boolean;

  @ApiProperty()
  @Expose()
  createdBy: string;

  @ApiProperty({ type: () => UserDto, required: false })
  @Expose()
  creator?: UserDto;

  @ApiProperty()
  @Expose()
  createdAt: Date;

  @ApiProperty()
  @Expose()
  updatedAt: Date;

  @ApiProperty({ type: () => InvestigationCostDto, required: false })
  @Expose()
  cost?: InvestigationCostDto | null;

  @ApiProperty({ type: () => InvestigationCauseDto, isArray: true })
  @Expose()
  causes: InvestigationCauseDto[];

  @ApiProperty({ type: () => InvestigationActionPlanDto, isArray: true })
  @Expose()
  actionPlans: InvestigationActionPlanDto[];

  @ApiProperty({ type: () => InvestigationSignatoryDto, isArray: true })
  @Expose()
  signatories: InvestigationSignatoryDto[];

  constructor(partial: Partial<InvestigationReportDto>) {
    Object.assign(this, partial);
  }
}
