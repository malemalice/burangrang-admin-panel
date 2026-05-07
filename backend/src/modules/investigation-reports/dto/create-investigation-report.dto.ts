import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  ValidateNested,
} from 'class-validator';
import { InvestigationStatusEnum } from '@prisma/client';
import { UpsertInvestigationCostDto } from './investigation-cost.dto';
import { UpsertInvestigationCauseDto } from './investigation-cause.dto';
import { UpsertInvestigationActionPlanDto } from './investigation-action-plan.dto';
import { UpsertInvestigationSignatoryDto } from './investigation-signatory.dto';

export class CreateInvestigationReportDto {
  @IsUUID()
  @ApiProperty({ description: 'Linked incident — must have needFurtherInvestigation=true' })
  incidentId: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Section A1 — Pekerjaan apa yang sedang dilakukan' })
  taskBeingPerformed?: string;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false, description: 'Section A2 — Peralatan atau material apa yang sedang di gunakan' })
  equipmentUsed?: string;

  @IsEnum(InvestigationStatusEnum)
  @IsOptional()
  @ApiProperty({ enum: InvestigationStatusEnum, default: 'DRAFT', required: false })
  status?: InvestigationStatusEnum;

  @IsString()
  @IsOptional()
  @ApiProperty({ required: false })
  hsComments?: string;

  @IsUUID()
  @IsOptional()
  @ApiProperty({ required: false })
  hsCommentSignedBy?: string;

  @IsDate()
  @Type(() => Date)
  @IsOptional()
  @ApiProperty({ required: false })
  hsCommentSignedAt?: Date;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  distributionSafetyCommittee?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  distributionHeadOfBusinessOp?: boolean;

  @IsBoolean()
  @IsOptional()
  @ApiProperty({ required: false, default: false })
  distributionRelatedDepartment?: boolean;

  @IsOptional()
  @ValidateNested()
  @Type(() => UpsertInvestigationCostDto)
  @ApiProperty({ type: UpsertInvestigationCostDto, required: false })
  cost?: UpsertInvestigationCostDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertInvestigationCauseDto)
  @ApiProperty({ type: [UpsertInvestigationCauseDto], required: false })
  causes?: UpsertInvestigationCauseDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertInvestigationActionPlanDto)
  @ApiProperty({ type: [UpsertInvestigationActionPlanDto], required: false })
  actionPlans?: UpsertInvestigationActionPlanDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpsertInvestigationSignatoryDto)
  @ApiProperty({ type: [UpsertInvestigationSignatoryDto], required: false })
  signatories?: UpsertInvestigationSignatoryDto[];
}
