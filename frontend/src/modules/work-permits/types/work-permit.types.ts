import { PaginatedResponse, PaginationParams } from '@/core/lib/types';
export type { PaginatedResponse };

// Master data types for work permit form
export interface MasterDataOption {
  id: string;
  name: string;
  code: string;
}

export interface GuestOption {
  id: string;
  name: string;
  email?: string;
  phone?: string;
}

export interface WorkPermitMasterData {
  areas: MasterDataOption[];
  companies: MasterDataOption[];
  workClassifications: MasterDataOption[];
  guests: GuestOption[];
  heavyEquipment: MasterDataOption[];
  tools: MasterDataOption[];
  materials: MasterDataOption[];
  machines: MasterDataOption[];
  professions: MasterDataOption[];
}

export interface WorkPermit {
  id: string;
  code: string;
  projectName: string;
  areaId: string;
  companyId: string;
  proposedStartDate: string;
  proposedEndDate: string;
  workStagesDescription: string;
  jobSafetyAnalysis: string;
  workRequirements?: string;
  safetyGuideline?: string;
  requireCourseVerification: boolean;
  status: WorkPermitStatus;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  // Relations
  area?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
    code: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  classifications?: WorkPermitClassification[];
  employees?: WorkPermitEmployee[];
  workers?: WorkPermitWorker[];
  heavyEquipment?: WorkPermitHeavyEquipment[];
  tools?: WorkPermitTool[];
  materials?: WorkPermitMaterial[];
  machines?: WorkPermitMachine[];
  professions?: WorkPermitProfession[];
  requiredCourses?: WorkPermitRequiredCourse[];
  hazards?: WorkPermitHazard[];
  attachments?: WorkPermitAttachment[];
  supervisors?: WorkPermitSupervisor[];
  hseOfficers?: WorkPermitHseOfficer[];
  safetyEquipment?: WorkPermitSafetyEquipment[];
}

export type WorkPermitStatus =
  | 'DRAFT'
  | 'OPEN'
  | 'WAITING_APPROVAL'
  | 'IN_REVIEW_HSE'
  | 'IN_REVIEW_SECURITY'
  | 'NEED_INFO'
  | 'APPROVED'
  | 'REJECTED'
  | 'CLOSED'
  | 'EXTENDED';

export interface WorkPermitClassification {
  id: string;
  workClassificationId: string;
  workClassification?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitEmployee {
  id: string;
  userId?: string;
  employeeName?: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  order: number;
}

export interface WorkPermitWorker {
  id: string;
  guestId: string;
  idNumber?: string;
  certificateUrl?: string;
  healthDeclarationUrl: string;
  guest?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
  order: number;
}

export interface WorkPermitHeavyEquipment {
  id: string;
  heavyEquipmentId: string;
  quantity: number;
  heavyEquipment?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitTool {
  id: string;
  toolId: string;
  quantity: number;
  tool?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitMaterial {
  id: string;
  materialId: string;
  quantity: number;
  material?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitMachine {
  id: string;
  machineId: string;
  quantity: number;
  machine?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitProfession {
  id: string;
  professionId: string;
  quantity: number;
  profession?: {
    id: string;
    name: string;
    code: string;
  };
  order: number;
}

export interface WorkPermitRequiredCourse {
  id: string;
  courseId: string;
  isRequired: boolean;
  course?: {
    id: string;
    title: string;
    slug: string;
  };
  order: number;
}

export interface WorkPermitHazard {
  id: string;
  hazardId?: string;
  hazardName: string;
  description?: string;
  controlMeasure?: string;
  order: number;
}

export interface WorkPermitAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  description?: string;
  order: number;
}

export interface WorkPermitSupervisor {
  id: string;
  guestId: string;
  guest?: {
    id: string;
    name: string;
    email?: string;
    phone?: string;
  };
}

export interface WorkPermitHseOfficer {
  id: string;
  userId: string;
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

export interface WorkPermitSafetyEquipment {
  id: string;
  safetyEquipmentId: string;
  safetyEquipment?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface WorkPermitDTO {
  id: string;
  code: string;
  projectName: string;
  areaId: string;
  companyId: string;
  proposedStartDate: string;
  proposedEndDate: string;
  workStagesDescription: string;
  jobSafetyAnalysis: string;
  workRequirements?: string;
  safetyGuideline?: string;
  requireCourseVerification: boolean;
  status: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  area?: {
    id: string;
    name: string;
    code: string;
  };
  company?: {
    id: string;
    name: string;
    code: string;
  };
  creator?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  classifications?: WorkPermitClassification[];
  employees?: WorkPermitEmployee[];
  workers?: WorkPermitWorker[];
  heavyEquipment?: WorkPermitHeavyEquipment[];
  tools?: WorkPermitTool[];
  materials?: WorkPermitMaterial[];
  machines?: WorkPermitMachine[];
  professions?: WorkPermitProfession[];
  requiredCourses?: WorkPermitRequiredCourse[];
  hazards?: WorkPermitHazard[];
  attachments?: WorkPermitAttachment[];
  supervisors?: WorkPermitSupervisor[];
  hseOfficers?: WorkPermitHseOfficer[];
  safetyEquipment?: WorkPermitSafetyEquipment[];
}

export interface CreateWorkPermitDTO {
  projectName: string;
  areaId: string;
  companyId: string;
  proposedStartDate: string;
  proposedEndDate: string;
  workStagesDescription: string;
  jobSafetyAnalysis: string;
  workRequirements?: string;
  safetyGuideline?: string;
  requireCourseVerification?: boolean;
  classifications?: Array<{
    workClassificationId: string;
    order: number;
  }>;
  employees?: Array<{
    userId?: string;
    employeeName?: string;
    order: number;
  }>;
  workers: Array<{
    guestId: string;
    idNumber?: string;
    certificateUrl?: string;
    healthDeclarationUrl: string;
    order: number;
  }>;
  heavyEquipment?: Array<{
    heavyEquipmentId: string;
    quantity: number;
    order: number;
  }>;
  tools?: Array<{
    toolId: string;
    quantity: number;
    order: number;
  }>;
  materials?: Array<{
    materialId: string;
    quantity: number;
    order: number;
  }>;
  machines?: Array<{
    machineId: string;
    quantity: number;
    order: number;
  }>;
  professions?: Array<{
    professionId: string;
    quantity: number;
    order: number;
  }>;
  requiredCourses?: Array<{
    courseId: string;
    isRequired?: boolean;
    order: number;
  }>;
  hazards?: Array<{
    hazardId?: string;
    hazardName: string;
    description?: string;
    controlMeasure?: string;
    order: number;
  }>;
  attachments?: Array<{
    fileUrl: string;
    fileName: string;
    fileType?: string;
    description?: string;
    order: number;
  }>;
  supervisorIds?: string[];
  hseOfficerIds?: string[];
  safetyEquipmentIds?: string[];
}

export type UpdateWorkPermitDTO = Partial<CreateWorkPermitDTO>;

export interface WorkPermitSearchParams extends PaginationParams {
  status?: string;
  companyId?: string;
  areaId?: string;
  createdBy?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  isActive?: boolean;
}

export interface ApprovalTimelineItem {
  id: string;
  status: string;
  notes: string;
  createdAt: string;
  createdBy?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  department?: {
    id: string;
    name: string;
    code: string;
  };
  jobPosition?: {
    id: string;
    name: string;
    code: string;
  };
}

// Data transformation functions
export const mapWorkPermitDtoToWorkPermit = (dto: WorkPermitDTO): WorkPermit => ({
  ...dto,
  status: dto.status as WorkPermitStatus,
});

export const mapWorkPermitToUpdateDto = (workPermit: Partial<WorkPermit>): UpdateWorkPermitDTO => ({
  projectName: workPermit.projectName,
  areaId: workPermit.areaId,
  companyId: workPermit.companyId,
  proposedStartDate: workPermit.proposedStartDate,
  proposedEndDate: workPermit.proposedEndDate,
  workStagesDescription: workPermit.workStagesDescription,
  jobSafetyAnalysis: workPermit.jobSafetyAnalysis,
  workRequirements: workPermit.workRequirements,
  safetyGuideline: workPermit.safetyGuideline,
  requireCourseVerification: workPermit.requireCourseVerification,
  classifications: workPermit.classifications?.map((c) => ({
    workClassificationId: c.workClassificationId || c.id,
    order: c.order,
  })),
  employees: workPermit.employees?.map((e) => ({
    userId: e.userId,
    employeeName: e.employeeName,
    order: e.order,
  })),
  workers: workPermit.workers?.map((w) => ({
    guestId: w.guestId,
    idNumber: w.idNumber,
    certificateUrl: w.certificateUrl,
    healthDeclarationUrl: w.healthDeclarationUrl,
    order: w.order,
  })),
  heavyEquipment: workPermit.heavyEquipment?.map((e) => ({
    heavyEquipmentId: e.heavyEquipmentId,
    quantity: e.quantity,
    order: e.order,
  })),
  tools: workPermit.tools?.map((t) => ({
    toolId: t.toolId,
    quantity: t.quantity,
    order: t.order,
  })),
  materials: workPermit.materials?.map((m) => ({
    materialId: m.materialId,
    quantity: m.quantity,
    order: m.order,
  })),
  machines: workPermit.machines?.map((m) => ({
    machineId: m.machineId,
    quantity: m.quantity,
    order: m.order,
  })),
  professions: workPermit.professions?.map((p) => ({
    professionId: p.professionId,
    quantity: p.quantity,
    order: p.order,
  })),
  requiredCourses: workPermit.requiredCourses?.map((c) => ({
    courseId: c.courseId,
    isRequired: c.isRequired,
    order: c.order,
  })),
  hazards: workPermit.hazards?.map((h) => ({
    hazardId: h.hazardId,
    hazardName: h.hazardName,
    description: h.description,
    controlMeasure: h.controlMeasure,
    order: h.order,
  })),
  attachments: workPermit.attachments?.map((a) => ({
    fileUrl: a.fileUrl,
    fileName: a.fileName,
    fileType: a.fileType,
    description: a.description,
    order: a.order,
  })),
  supervisorIds: workPermit.supervisors?.map((s) => s.guestId),
  hseOfficerIds: workPermit.hseOfficers?.map((h) => h.userId),
  safetyEquipmentIds: workPermit.safetyEquipment?.map((s) => s.safetyEquipmentId),
});
