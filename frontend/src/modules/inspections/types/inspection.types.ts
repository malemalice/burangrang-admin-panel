/**
 * Inspection module types
 * Following TRD.md module structure template
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { InspectionRiskRateEnum } from '@/shared/constants/inspection-risk-rate.enum';
import type { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { User } from '@/core/lib/types';
import { RiskCategory, Risk } from '@/core/lib/types';
import { Department } from '@/core/lib/types';

export enum InspectionImageTypeEnum {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  GENERAL = 'GENERAL',
}

export interface InspectionImage {
  id: string;
  inspectionItemId: string;
  imageUrl: string;
  caption?: string;
  type: InspectionImageTypeEnum;
  order: number;
  createdAt: Date;
}

export interface InspectionChecklistResult {
  id: string;
  inspectionItemId: string;
  checklistItemId: string;
  riskRate?: InspectionRiskRateEnum;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  checklistItem?: {
    id: string;
    name: string;
    code?: string | null;
    parent?: { id: string; name: string; code?: string | null } | null;
  };
}

export interface CreateInspectionChecklistResultDTO {
  checklistItemId: string;
  riskRate?: InspectionRiskRateEnum;
  notes?: string;
}

export interface RiskMitigationData {
  eliminate?: string;
  eliminationControl?: string;
  substitutionControl?: string;
  engineeringControl?: string;
  administrationControl?: string;
  personalProtectiveEquipment?: string;
  transfer?: string;
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

export interface InspectionItem {
  id: string;
  inspectionId: string;
  inspection?: {
    id: string;
    code: string;
    creator?: {
      id: string;
      firstName: string;
      lastName: string;
    };
  };
  areaId: string;
  area?: AreaDTO;
  riskCategoryId: string;
  riskCategory?: RiskCategory;
  riskId: string;
  risk?: Risk;
  assignedDepartmentId: string;
  assignedDepartment?: Department;
  assigneeId?: string;
  assignee?: User;
  status: GeneralStatusEnum;
  description?: string;
  followUpNotes?: string;
  findings?: string;
  dueDateAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  images?: InspectionImage[];
  mitigation?: RiskMitigationRecord;
  checklistId?: string;
  checklistResults?: InspectionChecklistResult[];
}

export interface InspectionInspector {
  id: string;
  inspectionId: string;
  inspectorId: string;
  inspector?: User;
  order: number;
  createdAt: Date;
}

export interface Inspection {
  id: string;
  code: string;
  areaIds?: string[];
  areas?: AreaDTO[];
  areaId?: string; // Deprecated: kept for backward compatibility
  area?: AreaDTO; // Deprecated: kept for backward compatibility
  inspectionDate: Date;
  status: GeneralStatusEnum;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  items?: InspectionItem[];
  inspectors?: InspectionInspector[];
  finalInspectionValue?: number | null;
}

export interface CreateInspectionItemDTO {
  areaId: string;
  riskCategoryId: string;
  riskId: string;
  assignedDepartmentId: string;
  assigneeId?: string;
  status: GeneralStatusEnum;
  description?: string;
  followUpNotes?: string;
  findings?: string;
  dueDateAt?: string;
  images?: CreateInspectionImageDTO[];
  mitigation?: RiskMitigationData;
  checklistId?: string;
  checklistResults?: CreateInspectionChecklistResultDTO[];
}

export interface UpdateInspectionItemDTO extends Partial<CreateInspectionItemDTO> {}

export interface CreateInspectionImageDTO {
  imageUrl: string;
  caption?: string;
  type?: InspectionImageTypeEnum;
  order: number;
}

export interface UpdateInspectionImageDTO extends Partial<CreateInspectionImageDTO> {}

export interface CreateInspectionInspectorDTO {
  inspectorId: string;
  order: number;
}

export interface UpdateInspectionInspectorDTO extends Partial<CreateInspectionInspectorDTO> {}

export interface CreateInspectionDTO {
  code: string;
  areaIds: string[];
  inspectionDate: Date;
  status: GeneralStatusEnum;
  isActive?: boolean;
  items?: CreateInspectionItemDTO[];
  inspectors?: CreateInspectionInspectorDTO[];
}

export type UpdateInspectionDTO = Partial<CreateInspectionDTO>;

