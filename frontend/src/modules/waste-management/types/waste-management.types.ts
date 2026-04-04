// Common Types
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
  };
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  search?: string;
  isActive?: boolean;
}

// Enums
export enum WasteTypeEnum {
  DOMESTIC = 'DOMESTIC',
  HAZARDOUS = 'HAZARDOUS',
  FOOD = 'FOOD',
  GREEN = 'GREEN',
}

export enum ReportStatusEnum {
  SUBMITTED = 'SUBMITTED',
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

/** Solid Waste (weight reports) only – 6 statuses for edit/filter. */
export enum WeightReportStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

/** Waste Water Lab (water quality lab reports) only – 6 statuses for edit/filter. */
export enum WaterQualityLabReportStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

/** Water quality lab report category (water type). */
export enum WaterQualityLabReportCategoryEnum {
  WASTEWATER = 'WASTEWATER',
  CLEAN_WATER = 'CLEAN_WATER',
  SWIMMING_POOL_WATER = 'SWIMMING_POOL_WATER',
  DRINKING_WATER = 'DRINKING_WATER',
}

/** Water quality parameter category (Chemistry / Physics / Microbiology). */
export enum WaterQualityParameterCategoryEnum {
  CHEMISTRY = 'CHEMISTRY',
  PHYSICS = 'PHYSICS',
  MICROBIOLOGY = 'MICROBIOLOGY',
}

export enum MonthEnum {
  JAN = 'JAN', FEB = 'FEB', MAR = 'MAR', APR = 'APR', MAY = 'MAY', JUN = 'JUN',
  JUL = 'JUL', AUG = 'AUG', SEP = 'SEP', OCT = 'OCT', NOV = 'NOV', DEC = 'DEC',
}

export enum GeneralStatusEnum {
  SCHEDULED = 'SCHEDULED',
  DRAFT = 'DRAFT',
  OPEN = 'OPEN',
  WAITING_APPROVAL = 'WAITING_APPROVAL',
  DONE = 'DONE',
  REJECTED = 'REJECTED',
}

// Treatment Plant
export interface TreatmentPlant {
  id: string;
  name: string;
  code: string;
  location: string;
  capacity?: number;
  description?: string;
  officeId?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  office?: { id: string; name: string; code: string; };
  creator?: { id: string; firstName: string; lastName: string; };
}

export interface CreateTreatmentPlantData {
  name: string;
  code: string;
  location: string;
  capacity?: number;
  description?: string;
  officeId?: string;
  isActive?: boolean;
}

export type UpdateTreatmentPlantData = Partial<CreateTreatmentPlantData>;

// Water Quality Parameter
export interface WaterQualityParameter {
  id: string;
  name: string;
  code: string;
  category: WaterQualityParameterCategoryEnum;
  unit: string;
  standardLimit?: number;
  regulatoryLimit?: number;
  testMethod?: string;
  description?: string;
  displayOrder?: number;
  isActive: boolean;
  dateSampleTaken: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWaterQualityParameterData {
  name: string;
  code: string;
  category: WaterQualityParameterCategoryEnum;
  unit: string;
  standardLimit?: number;
  regulatoryLimit?: number;
  testMethod?: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
  dateSampleTaken: string;
}

export type UpdateWaterQualityParameterData = Partial<CreateWaterQualityParameterData>;

// Waste Type
export interface WasteType {
  id: string;
  name: string;
  code: string;
  wasteType: WasteTypeEnum;
  description?: string;
  requiresSpecialHandling: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWasteTypeData {
  name: string;
  code: string;
  wasteType: WasteTypeEnum;
  description?: string;
  requiresSpecialHandling?: boolean;
  isActive?: boolean;
}

export type UpdateWasteTypeData = Partial<CreateWasteTypeData>;

// Waste Source
export interface WasteSource {
  id: string;
  name: string;
  code: string;
  sourceType: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateWasteSourceData {
  name: string;
  code: string;
  sourceType: string;
  description?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  isActive?: boolean;
}

export type UpdateWasteSourceData = Partial<CreateWasteSourceData>;

// Storage Location
export interface StorageLocation {
  id: string;
  name: string;
  code: string;
  location: string;
  areaId?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  area?: { id: string; name: string; code: string; };
  creator?: { id: string; firstName: string; lastName: string; };
}

export interface CreateStorageLocationData {
  name: string;
  code: string;
  location: string;
  areaId?: string;
  description?: string;
  isActive?: boolean;
}

export type UpdateStorageLocationData = Partial<CreateStorageLocationData>;

// Monthly Flow Report
export interface MonthlyFlowReport {
  id: string;
  reportCode: string;
  treatmentPlantId: string;
  reportDate?: string;
  reportMonth?: MonthEnum;
  reportYear?: number;
  totalVolume: number;
  averageDailyFlow?: number;
  initialFlow: number;
  finalFlow: number;
  peakFlow?: number;
  minimumFlow?: number;
  reportDocumentUrl?: string;
  submittedBy: string;
  submittedAt: string;
  receivedBy?: string;
  receivedAt?: string;
  status: ReportStatusEnum;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  archivedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  treatmentPlant?: { id: string; name: string; code: string; };
  submitter?: { id: string; firstName: string; lastName: string; };
}

export interface CreateMonthlyFlowReportData {
  reportCode: string;
  treatmentPlantId: string;
  reportDate: string;
  reportMonth?: MonthEnum;
  reportYear?: number;
  totalVolume: number;
  averageDailyFlow?: number;
  initialFlow: number;
  finalFlow: number;
  peakFlow?: number;
  minimumFlow?: number;
  reportDocumentUrl?: string;
  submittedAt: string;
  isActive?: boolean;
}

export type UpdateMonthlyFlowReportData = Partial<CreateMonthlyFlowReportData> & {
  status?: ReportStatusEnum;
  receivedBy?: string;
  receivedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

// Water Quality Lab Report Result
export interface WaterQualityLabReportResult {
  id: string;
  labReportId: string;
  parameterId: string;
  resultValue: number;
  unit?: string;
  isCompliant?: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  parameter?: {
    id: string;
    name: string;
    code: string;
    unit: string;
    category: string;
    regulatoryLimit?: number;
  };
}

export interface WaterQualityLabReportResultInput {
  parameterId: string;
  resultValue: number;
  unit?: string;
  isCompliant?: boolean;
  notes?: string;
}

// Water Quality Lab Report Attachment
export interface WaterQualityLabReportAttachment {
  id: string;
  fileUrl: string;
  fileName?: string;
  order: number;
  createdAt?: string;
}

// Water Quality Lab Report
export interface WaterQualityLabReport {
  id: string;
  reportCode: string;
  treatmentPlantId: string;
  category: WaterQualityLabReportCategoryEnum;
  reportDate: string;
  preparedBy: string;
  summary?: string;
  recommendations?: string;
  analystSignature?: string;
  submittedBy: string;
  submittedAt: string;
  receivedBy?: string;
  receivedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  archivedAt?: string;
  createdAt: string;
  updatedAt: string;
  treatmentPlant?: { id: string; name: string; code: string; };
  submitter?: { id: string; firstName: string; lastName: string; };
  preparer?: { id: string; firstName: string; lastName: string; };
  labReportResults?: WaterQualityLabReportResult[];
  attachments?: WaterQualityLabReportAttachment[];
}

export interface CreateWaterQualityLabReportData {
  reportCode: string;
  treatmentPlantId: string;
  category: WaterQualityLabReportCategoryEnum;
  reportDate: string;
  summary?: string;
  recommendations?: string;
  analystSignature?: string;
  submittedAt: string;
  results?: WaterQualityLabReportResultInput[];
  attachments?: { fileUrl: string; fileName?: string; order: number }[];
}

export type UpdateWaterQualityLabReportData = Partial<CreateWaterQualityLabReportData> & {
  receivedBy?: string;
  receivedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

// Weight Report Item
export interface WeightReportItem {
  id: string;
  weightReportId: string;
  wasteTypeId: string;
  weight: number;
  unit: string;
  order: number;
  notes?: string;
  wasteType?: { id: string; name: string; code: string; wasteType: WasteTypeEnum; };
}

export interface CreateWeightReportItemData {
  wasteTypeId: string;
  weight: number;
  unit?: string;
  order: number;
  notes?: string;
}

// Weight Report
export interface WeightReport {
  id: string;
  reportCode: string;
  sourceId: string;
  storageLocationId: string;
  reportDate: string;
  reportMonth?: MonthEnum;
  reportYear?: number;
  reportDocumentUrl?: string;
  submittedBy: string;
  submittedAt: string;
  receivedBy?: string;
  receivedAt?: string;
  status: WeightReportStatusEnum;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  archivedAt?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  source?: { id: string; name: string; code: string; };
  storageLocation?: { id: string; name: string; code: string; };
  submitter?: { id: string; firstName: string; lastName: string; };
  items?: WeightReportItem[];
}

export interface CreateWeightReportData {
  reportCode: string;
  sourceId: string;
  storageLocationId: string;
  reportDate: string;
  reportMonth?: MonthEnum;
  reportYear?: number;
  reportDocumentUrl?: string;
  submittedAt: string;
  isActive?: boolean;
  items?: CreateWeightReportItemData[];
}

export type UpdateWeightReportData = Partial<CreateWeightReportData> & {
  status?: WeightReportStatusEnum;
  receivedBy?: string;
  receivedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
};

// Dispatch Order
export interface DispatchOrderAttachment {
  id?: string;
  fileUrl: string;
  fileName?: string;
  order: number;
  createdAt?: string;
}

export interface DispatchOrder {
  id: string;
  dispatchCode: string;
  dispatchDate: string;
  orderedBy: string;
  quantity: number;
  memo?: string;
  status: GeneralStatusEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  orderer?: { id: string; firstName: string; lastName: string; };
  creator?: { id: string; firstName: string; lastName: string; };
  attachments?: DispatchOrderAttachment[];
}

export interface CreateDispatchOrderData {
  dispatchCode: string;
  dispatchDate: string;
  quantity: number;
  memo?: string;
  isActive?: boolean;
  attachments?: { fileUrl: string; fileName?: string; order: number }[];
}

export type UpdateDispatchOrderData = Partial<CreateDispatchOrderData> & {
  status?: GeneralStatusEnum;
};

// Filter Types
export interface TreatmentPlantFilters extends PaginationParams {
  officeId?: string;
}

export interface WaterQualityParameterFilters extends PaginationParams { }

export interface WasteTypeFilters extends PaginationParams {
  wasteType?: WasteTypeEnum;
}

export interface WasteSourceFilters extends PaginationParams {
  sourceType?: string;
}

export interface StorageLocationFilters extends PaginationParams {
  areaId?: string;
}

export interface MonthlyFlowReportFilters extends PaginationParams {
  treatmentPlantId?: string;
  status?: ReportStatusEnum;
  reportMonth?: MonthEnum;
  reportYear?: number;
  reportDateFrom?: string;
  reportDateTo?: string;
}

export interface WaterQualityLabReportFilters extends PaginationParams {
  treatmentPlantId?: string;
  reportDateFrom?: string;
  reportDateTo?: string;
  category?: WaterQualityLabReportCategoryEnum;
}

export interface WeightReportFilters extends PaginationParams {
  sourceId?: string;
  storageLocationId?: string;
  status?: WeightReportStatusEnum;
  reportMonth?: MonthEnum;
  reportYear?: number;
}

export interface DispatchOrderFilters extends PaginationParams {
  status?: GeneralStatusEnum;
}
