/* eslint-disable @typescript-eslint/no-explicit-any */
// Core entity types

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  avatar?: string;
  roleId: string;
  officeId: string;
  departmentId?: string;
  jobPositionId?: string;
  role?: string;
  position?: string;
  department?: string;
  office?: string;
  status: 'active' | 'inactive' | 'pending';
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
  firstName: string;
  lastName: string;
  isActive: boolean;
  lastLoginAt?: Date;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  status: 'active' | 'inactive';
  isActive: boolean;
  permissions: Permission[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MenuItem {
  id: string;
  title: string;
  path: string;
  icon: string;
  parentId: string | null;
  order: number;
  visible: boolean;
  roles: string[];
  children?: MenuItem[];
  createdAt: string;
  updatedAt: string;
}

export interface Office {
  id: string;
  name: string;
  code: string;
  description?: string;
  address?: string;
  phone?: string;
  email?: string;
  parentId?: string;
  parent?: {
    id: string;
    name: string;
  };
  children?: Office[];
  users?: User[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  emails?: string[] | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Position {
  id: string;
  name: string;
  description: string;
  departmentId: string;
  level: number;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export interface Asset {
  id: string;
  name: string;
  type: string;
  serialNumber?: string;
  purchaseDate?: string;
  purchasePrice?: number;
  assignedToId?: string;
  officeId: string;
  status: 'available' | 'assigned' | 'maintenance' | 'retired';
  createdAt: string;
  updatedAt: string;
}

export interface JobPosition {
  id: string;
  name: string;
  code: string;
  level: number;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HseCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  risks?: any[];
}

export interface RiskCategory {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  risks?: any[];
}

export interface Risk {
  id: string;
  name: string;
  code: string;
  description?: string;
  isActive: boolean;
  riskCategoryId: string;
  riskCategory?: RiskCategory;
  createdAt: Date;
  updatedAt: Date;
  mitigations?: RiskMitigation[];
}

export interface RiskMitigation {
  id: string;
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  accept?: string;
  isActive: boolean;
  riskId: string;
  risk?: Risk;
  createdAt: Date;
  updatedAt: Date;
}

export enum RiskRatingEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
  EXTREME = 'EXTREME'
}

export interface RiskAssessment {
  id: string;
  code: string;
  description?: string;
  departmentId: string;
  department?: Department;
  assessmentDate: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  status: string;
  isActive: boolean;
  items: RiskAssessmentItem[];
  assigneeId?: string;
  assignee?: User;
  actionPlan?: string;
}

export interface RiskAssessmentItem {
  id: string;
  riskAssessmentId: string;
  mRiskId: string;
  mRisk?: Risk;
  mRiskCategoryId: string;
  mRiskCategory?: RiskCategory;
  likelihoodLevel: number;
  consequenceLevel: number;
  riskMatrixRating: RiskRatingEnum;
  interpretation: RiskRatingEnum;
  postLikelihoodLevel: number;
  postConsequenceLevel: number;
  postRiskMatrixRating: RiskRatingEnum;
  postInterpretation: RiskRatingEnum;
}

export interface RiskControl {
  id: string;
  eliminate?: string;
  transfer?: string;
  reduce?: string;
  isOpen: boolean;
  isAccept: boolean;
  isActive: boolean;
  entity: string;
  entityId: string;
  createdAt: Date;
  updatedAt: Date;
}

// Common response and request types

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    pageCount: number;
  };
}

export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface MasterApprovalItem {
  id: string;
  mApprovalId: string;
  order: number;
  jobPositionId: string;
  departmentId: string;
  createdBy: string;
  createdAt: string;
  jobPosition: {
    id: string;
    name: string;
  };
  department: {
    id: string;
    name: string;
  };
  creator: {
    id: string;
    name: string;
  };
}

export interface MasterApproval {
  id: string;
  entity: string;
  isActive: boolean;
  items: MasterApprovalItem[];
  createdAt: string;
  updatedAt: string;
}

export enum ApprovalStatus {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface SubmitApprovalDto {
  dataId: string;
  entity: string;
  status: ApprovalStatus;
  notes: string;
}
