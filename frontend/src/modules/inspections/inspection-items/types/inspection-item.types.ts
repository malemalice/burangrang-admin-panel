/**
 * Inspection Item types
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { RiskCategory, Risk } from '@/core/lib/types';
import { Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

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
  area?: {
    id: string;
    name: string;
    code: string;
    description?: string;
    officeId?: string;
    isActive: boolean;
    createdAt?: Date;
    updatedAt?: Date;
    office?: {
      id: string;
      name: string;
      code: string;
    };
  };
  riskCategoryId: string;
  riskCategory?: RiskCategory;
  riskId: string;
  risk?: Risk;
  assignedDepartmentId: string;
  assignedDepartment?: Department;
  assigneeId?: string;
  assignee?: User;
  description?: string;
  followUpNotes?: string;
  findings?: string;
  dueDateAt?: Date;
  status: GeneralStatusEnum;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  images?: InspectionItemImage[];
  mitigation?: RiskMitigationRecord;
}

export enum InspectionImageTypeEnum {
  BEFORE = 'BEFORE',
  AFTER = 'AFTER',
  GENERAL = 'GENERAL',
}

export interface InspectionItemImage {
  id: string;
  inspectionItemId: string;
  imageUrl: string;
  caption?: string;
  type: InspectionImageTypeEnum;
  order: number;
  createdAt: Date;
}

export interface UpdateInspectionItemDTO {
  riskCategoryId?: string;
  riskId?: string;
  assignedDepartmentId?: string;
  assigneeId?: string;
  description?: string;
  followUpNotes?: string;
  findings?: string;
  dueDateAt?: string;
  status?: GeneralStatusEnum;
  order?: number;
  images?: CreateInspectionItemImageDTO[];
  mitigation?: RiskMitigationData | null;
}

export interface CreateInspectionItemImageDTO {
  imageUrl: string;
  caption?: string;
  type?: InspectionImageTypeEnum;
  order: number;
}

export interface InspectionItemSearchParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  status?: GeneralStatusEnum;
  assignedDepartmentId?: string;
  assigneeId?: string;
  riskId?: string;
  riskCategoryId?: string;
  inspectionCode?: string;
  search?: string;
}
