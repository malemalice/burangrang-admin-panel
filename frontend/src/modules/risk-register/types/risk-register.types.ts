/**
 * Risk Register module types
 * Following TRD.md module structure template
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import type { AreaDTO, DepartmentDTO } from '@/modules/master-data/types/master-data.types';
import { User } from '@/core/lib/types';
import { RiskCategory, Risk, RiskRatingEnum } from '@/core/lib/types';

export interface RiskMitigationData {
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  accept?: string;
  legalAspect?: string;
}

export interface RiskMitigationRecord extends RiskMitigationData {
  id: string;
  entity: string;
  entityId: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Source context for Risk Assessment Item
 */
export interface RiskRegisterSourceRiskAssessment {
  code: string;
  description?: string;
  assessmentDate: Date;
  riskAssessmentItem: {
    id: string;
    mRiskId: string;
    mRisk: Risk;
    mRiskCategoryId: string;
    mRiskCategory: RiskCategory;
    likelihoodLevel: string;
    consequenceLevel: number;
    riskMatrixRating: string;
    interpretation: RiskRatingEnum;
    postLikelihoodLevel: string;
    postConsequenceLevel: number;
    postRiskMatrixRating: string;
    postInterpretation: RiskRatingEnum;
  };
  department: DepartmentDTO;
  creator?: User;
  assignee?: User;
}

/**
 * Source context for Inspection Item
 */
export interface RiskRegisterSourceInspection {
  code: string;
  inspectionDate: Date;
  inspectionItem: {
    id: string;
    riskId: string;
    risk: Risk;
    riskCategoryId: string;
    riskCategory: RiskCategory;
    findings?: string;
    description?: string;
    status: GeneralStatusEnum;
  };
  area: AreaDTO;
  department: DepartmentDTO;
  assignee?: User;
}

/**
 * Union type for source context
 */
export type RiskRegisterSource = RiskRegisterSourceRiskAssessment | RiskRegisterSourceInspection;

/**
 * Main Risk Register type
 */
export interface RiskRegister extends RiskMitigationRecord {
  source: RiskRegisterSource;
}

/**
 * Query parameters for finding risk register records
 */
export interface FindRiskRegisterParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  entityType?: 'RISK_ASSESSMENT_ITEM' | 'INSPECTION_ITEM';
  departmentId?: string;
  riskId?: string;
  riskCategoryId?: string;
  status?: GeneralStatusEnum;
  isActive?: boolean;
  search?: string;
}
