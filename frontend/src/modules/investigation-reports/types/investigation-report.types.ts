import type { Incident } from '@/modules/incidents/types/incident.types';
import type { User } from '@/core/lib/types';

export enum InvestigationStatusEnum {
  DRAFT = 'DRAFT',
  COMPLETE = 'COMPLETE',
}

export enum InvestigationCauseSectionEnum {
  LATENT_FAILURE = 'LATENT_FAILURE',
  ACTIVE_FAILURE = 'ACTIVE_FAILURE',
}

export enum InvestigationSignatoryRoleEnum {
  LEAD_INVESTIGATOR = 'LEAD_INVESTIGATOR',
  INVESTIGATOR_2 = 'INVESTIGATOR_2',
  INVESTIGATOR_3 = 'INVESTIGATOR_3',
  RELATED_MANAGER = 'RELATED_MANAGER',
  SECURITY = 'SECURITY',
}

export interface InvestigationCost {
  id: string;
  investigationReportId: string;
  currency: string;
  medicalCost?: number | null;
  lostTimeCost?: number | null;
  damageCost?: number | null;
  repairCost?: number | null;
  compensationCost?: number | null;
  otherCost?: number | null;
  isNotYetKnown: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestigationCause {
  id: string;
  investigationReportId: string;
  section: InvestigationCauseSectionEnum;
  tier1: string;
  tier2: string;
  causeKey: string;
  causeName: string;
  isSelected: boolean;
  customNotes?: string;
  order: number;
  hfacsNodeId?: string | null;
}

export interface InvestigationActionPlan {
  id: string;
  investigationReportId: string;
  actionPlan: string;
  responsiblePerson?: string;
  targetDate?: string | Date;
  targetDateNotes?: string;
  verificationDate?: string | Date;
  verifiedBy?: string;
  verifier?: User;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvestigationSignatory {
  id: string;
  investigationReportId: string;
  signatoryRole?: InvestigationSignatoryRoleEnum;
  roleName?: string;
  name?: string;
  signedAt?: string | Date;
  order: number;
}

export interface InvestigationReport {
  id: string;
  incidentId: string;
  incident?: Incident;
  reportNumber: string;
  taskBeingPerformed?: string;
  equipmentUsed?: string;
  status: InvestigationStatusEnum;
  hsComments?: string;
  hsCommentSignedBy?: string;
  hsCommentSignedAt?: string | Date;
  hsSigner?: User;
  distributionSafetyCommittee: boolean;
  distributionHeadOfBusinessOp: boolean;
  distributionRelatedDepartment: boolean;
  bodyPartsSummary: string[];
  injuryTypesSummary: string[];
  mechanismsSummary: string[];
  bodyDiagramUrl?: string | null;
  isActive: boolean;
  createdBy: string;
  creator?: User;
  createdAt: Date;
  updatedAt: Date;
  cost?: InvestigationCost | null;
  causes: InvestigationCause[];
  actionPlans: InvestigationActionPlan[];
  signatories: InvestigationSignatory[];
}

export interface UpsertInvestigationCostInput {
  currency?: string;
  medicalCost?: number;
  lostTimeCost?: number;
  damageCost?: number;
  repairCost?: number;
  compensationCost?: number;
  otherCost?: number;
  isNotYetKnown?: boolean;
}

export interface UpsertInvestigationCauseInput {
  hfacsNodeId?: string;
  // Legacy snapshot fields kept optional for back-compat with older drafts;
  // when hfacsNodeId is provided, the server derives these from the master tree.
  section?: InvestigationCauseSectionEnum;
  tier1?: string;
  tier2?: string;
  causeKey?: string;
  causeName?: string;
  isSelected?: boolean;
  customNotes?: string;
  order?: number;
}

export interface UpsertInvestigationActionPlanInput {
  actionPlan: string;
  responsiblePerson?: string;
  targetDate?: Date | string;
  targetDateNotes?: string;
  verificationDate?: Date | string;
  verifiedBy?: string;
  order: number;
}

export interface UpsertInvestigationSignatoryInput {
  signatoryRole?: InvestigationSignatoryRoleEnum;
  roleName?: string;
  name?: string;
  signedAt?: Date | string;
  order?: number;
}

export interface CreateInvestigationReportDTO {
  incidentId: string;
  taskBeingPerformed?: string;
  equipmentUsed?: string;
  status?: InvestigationStatusEnum;
  hsComments?: string;
  hsCommentSignedBy?: string;
  hsCommentSignedAt?: Date | string;
  distributionSafetyCommittee?: boolean;
  distributionHeadOfBusinessOp?: boolean;
  distributionRelatedDepartment?: boolean;
  bodyPartsSummary?: string[];
  injuryTypesSummary?: string[];
  mechanismsSummary?: string[];
  bodyDiagramUrl?: string | null;
  cost?: UpsertInvestigationCostInput;
  causes?: UpsertInvestigationCauseInput[];
  actionPlans?: UpsertInvestigationActionPlanInput[];
  signatories?: UpsertInvestigationSignatoryInput[];
}

export type UpdateInvestigationReportDTO = Partial<Omit<CreateInvestigationReportDTO, 'incidentId'>>;
