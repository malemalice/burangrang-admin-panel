/**
 * Inspection module types
 * Following TRD.md module structure template
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import type { AreaDTO } from '@/modules/master-data/types/master-data.types';
import { User } from '@/core/lib/types';
import { RiskCategory, Risk } from '@/core/lib/types';
import { Department } from '@/core/lib/types';

export interface InspectionImage {
  id: string;
  inspectionItemId: string;
  imageUrl: string;
  caption?: string;
  order: number;
  createdAt: Date;
}

export interface InspectionItem {
  id: string;
  inspectionId: string;
  riskCategoryId: string;
  riskCategory?: RiskCategory;
  riskId: string;
  risk?: Risk;
  assignedDepartmentId: string;
  assignedDepartment?: Department;
  assigneeId?: string;
  assignee?: User;
  followUpNotes?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  images?: InspectionImage[];
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
  areaId: string;
  area?: AreaDTO;
  inspectionDate: Date;
  description?: string;
  status: GeneralStatusEnum;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  items?: InspectionItem[];
  inspectors?: InspectionInspector[];
}

export interface CreateInspectionItemDTO {
  riskCategoryId: string;
  riskId: string;
  assignedDepartmentId: string;
  assigneeId?: string;
  followUpNotes?: string;
  order: number;
}

export interface UpdateInspectionItemDTO extends Partial<CreateInspectionItemDTO> {}

export interface CreateInspectionImageDTO {
  imageUrl: string;
  caption?: string;
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
  areaId: string;
  inspectionDate: Date;
  description?: string;
  status: GeneralStatusEnum;
  isActive?: boolean;
  items?: CreateInspectionItemDTO[];
  inspectors?: CreateInspectionInspectorDTO[];
}

export type UpdateInspectionDTO = Partial<CreateInspectionDTO>;

