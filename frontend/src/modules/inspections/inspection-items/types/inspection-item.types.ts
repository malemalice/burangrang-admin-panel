/**
 * Inspection Item types
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import { RiskCategory, Risk } from '@/core/lib/types';
import { Department } from '@/core/lib/types';
import { User } from '@/core/lib/types';

export interface InspectionItem {
  id: string;
  inspectionId: string;
  inspection?: {
    id: string;
    code: string;
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
  status: GeneralStatusEnum;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  images?: InspectionItemImage[];
}

export interface InspectionItemImage {
  id: string;
  inspectionItemId: string;
  imageUrl: string;
  caption?: string;
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
  status?: GeneralStatusEnum;
  order?: number;
  images?: CreateInspectionItemImageDTO[];
}

export interface CreateInspectionItemImageDTO {
  imageUrl: string;
  caption?: string;
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
