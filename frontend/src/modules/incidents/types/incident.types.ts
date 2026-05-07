/**
 * Incident module types
 * Following TRD.md module structure template
 */

import { GeneralStatusEnum } from '@/shared/constants/general-status.enum';
import type { AreaDTO, RoomDTO } from '@/modules/master-data/types/master-data.types';
import { User } from '@/core/lib/types';
import { RiskCategory } from '@/core/lib/types';
import { Department } from '@/core/lib/types';

// Enums
export enum IncidentTypeEnum {
  NEAR_MISS = 'NEAR_MISS',
  ACCIDENT = 'ACCIDENT',
  DANGEROUS_OR_HAZARDOUS_OCCURRENCE = 'DANGEROUS_OR_HAZARDOUS_OCCURRENCE',
}

export enum IncidentClassificationEnum {
  MAJOR = 'MAJOR',
  MINOR = 'MINOR',
  FATALITY = 'FATALITY',
}

export enum IncidentActivitiesEnum {
  WORK = 'WORK',
  STUDY = 'STUDY',
}

export enum IncidentScopeEnum {
  GENERAL = 'GENERAL',
  SECURITY = 'SECURITY',
}

export enum PriorityEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  VENDOR = 'VENDOR',
  LONGER_TERM = 'LONGER_TERM',
}

export enum StopActivityEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  YES = 'YES',
  NO = 'NO',
}

export enum TreatmentEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  FIRST_AID = 'FIRST_AID',
  MEDICAL_TREATMENT = 'MEDICAL_TREATMENT',
  HOSPITALIZATION = 'HOSPITALIZATION',
  NO_TREATMENT = 'NO_TREATMENT',
  SELF = 'SELF',
  HEALTH_SERVICES = 'HEALTH_SERVICES',
  OTHER = 'OTHER',
}

export enum AbsenceEnum {
  NOT_YET_KNOWN = 'NOT_YET_KNOWN',
  RETURNED_AFTER_TREATMENT = 'RETURNED_AFTER_TREATMENT',
  MORE_THAN_THREE_DAYS = 'MORE_THAN_THREE_DAYS',
  NOT_SPECIFIED = 'NOT_SPECIFIED',
}

export enum SourceEnum {
  SYSTEM = 'SYSTEM',
  ZOHO = 'ZOHO',
}

export enum GenderEnum {
  MALE = 'MALE',
  FEMALE = 'FEMALE',
}

export enum LevelOfInjuryEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  MINOR = 'MINOR',
  MODERATE = 'MODERATE',
  SEVERE = 'SEVERE',
  FATAL = 'FATAL',
}

export enum InjuredBodyPartEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  HEAD = 'HEAD',
  NECK = 'NECK',
  ABDOMENT = 'ABDOMENT',
  ARM = 'ARM',
  FEET = 'FEET',
  SHOULDER = 'SHOULDER',
  HAND = 'HAND',
  LEG = 'LEG',
  BACK = 'BACK',
  SKIN = 'SKIN',
  CHEST = 'CHEST',
  EYE = 'EYE',
  INTERNAL_ORGAN = 'INTERNAL_ORGAN',
  OTHER = 'OTHER',
}

export enum TypeOfInjuryEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  CUT = 'CUT',
  BRUISE = 'BRUISE',
  FRACTURE = 'FRACTURE',
  BURN = 'BURN',
  SPRAIN = 'SPRAIN',
  STRAIN = 'STRAIN',
  LACERATION = 'LACERATION',
  CONCUSSION = 'CONCUSSION',
  DERMATITIS = 'DERMATITIS',
  PARALYSIS = 'PARALYSIS',
  AMPUTATION = 'AMPUTATION',
  CRUSH = 'CRUSH',
  ABRASION = 'ABRASION',
  OTHER = 'OTHER',
}

export enum MechanismOfInjuryEnum {
  NOT_SPECIFIED = 'NOT_SPECIFIED',
  STRUCK_BY = 'STRUCK_BY',
  FAILING_OBJECT = 'FAILING_OBJECT',
  TRIP = 'TRIP',
  SLIP = 'SLIP',
  FALL = 'FALL',
  CHEMICAL = 'CHEMICAL',
  VEHICLES = 'VEHICLES',
  MECHINARY = 'MECHINARY',
  ELECTRICITY = 'ELECTRICITY',
  HAND_TOOLS = 'HAND_TOOLS',
  FALL_FROM_HEIGHT = 'FALL_FROM_HEIGHT',
  FLYING_OBJECT = 'FLYING_OBJECT',
  SHARP_OBJECTS = 'SHARP_OBJECTS',
  HEAT_COLD = 'HEAT_COLD',
  MANUAL_HANDLING = 'MANUAL_HANDLING',
  OTHER = 'OTHER',
}

// Related entity interfaces
export interface IncidentInjuredPerson {
  id: string;
  incidentId: string;
  injuredPersonName?: string;
  gender?: GenderEnum;
  levelOfInjury: LevelOfInjuryEnum;
  injuredBodyPart: InjuredBodyPartEnum;
  typeOfInjury: TypeOfInjuryEnum;
  mechanismOfInjury: MechanismOfInjuryEnum;
  position?: string;
  departmentId?: string;
  department?: Department;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface IncidentWitness {
  id: string;
  incidentId: string;
  witnessName?: string;
  gender?: GenderEnum;
  position?: string;
  departmentId?: string;
  department?: Department;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

export enum EquipmentEntityEnum {
  ASSET = 'ASSET',
  HEAVY_EQUIPMENT = 'HEAVY_EQUIPMENT',
  SAFETY_EQUIPMENT = 'SAFETY_EQUIPMENT',
}

export interface IncidentAsset {
  id: string;
  incidentId: string;
  entity?: EquipmentEntityEnum;
  entityId?: string;
  assetName: string;
  assetCode?: string;
  quantity?: number;
  order: number;
  createdAt: Date;
  updatedAt: Date;
  // Relations (optional, populated when fetched with includes)
  asset?: {
    id: string;
    name: string;
    code: string;
    brand?: string;
    description?: string;
  };
  heavyEquipment?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
  safetyEquipment?: {
    id: string;
    name: string;
    code: string;
    description?: string;
  };
}

export interface IncidentImage {
  id: string;
  incidentId: string;
  imageUrl: string;
  caption?: string;
  order: number;
  createdAt: Date;
}

export interface IncidentAttachment {
  id: string;
  incidentId: string;
  attachmentUrl: string;
  order: number;
  createdAt: Date;
}

// Main Incident interface
export interface Incident {
  id: string;
  code: string;
  subject: string;
  incidentDate: Date;
  roomId?: string;
  room?: RoomDTO;
  areaId: string;
  area?: AreaDTO;
  incidentType: IncidentTypeEnum;
  incidentClassification: IncidentClassificationEnum;
  activities?: IncidentActivitiesEnum;
  type?: IncidentScopeEnum;
  requesterId: string;
  requester?: User;
  reportedBy: string;
  reporter?: User;
  technicianId?: string;
  technician?: User;
  priority: PriorityEnum;
  riskCategoryId: string;
  riskCategory?: RiskCategory;
  description?: string;
  controlMeasure?: string;
  dueDate?: Date;
  expectedOutcome?: string;
  needToStopActivity: StopActivityEnum;
  stopActivityDescription?: string;
  treatment: TreatmentEnum;
  treatmentDescription?: string;
  absence: AbsenceEnum;
  resolution?: string;
  needFurtherInvestigation: boolean;
  assignedDepartmentId: string;
  assignedDepartment?: Department;
  assigneeId?: string;
  assignee?: User;
  status: GeneralStatusEnum;
  source: SourceEnum;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  creator?: User;
  injuredPersons?: IncidentInjuredPerson[];
  witnesses?: IncidentWitness[];
  assets?: IncidentAsset[];
  images?: IncidentImage[];
  attachments?: IncidentAttachment[];
}

// Create DTOs
export interface CreateIncidentInjuredPersonDTO {
  injuredPersonName?: string;
  gender?: GenderEnum;
  levelOfInjury?: LevelOfInjuryEnum;
  injuredBodyPart?: InjuredBodyPartEnum;
  typeOfInjury?: TypeOfInjuryEnum;
  mechanismOfInjury?: MechanismOfInjuryEnum;
  position?: string;
  departmentId?: string;
  order: number;
}

export interface CreateIncidentWitnessDTO {
  witnessName?: string;
  gender?: GenderEnum;
  position?: string;
  departmentId?: string;
  order: number;
}

export interface CreateIncidentAssetDTO {
  entity?: EquipmentEntityEnum;
  entityId?: string;
  assetName: string;
  assetCode?: string;
  quantity?: number;
  order: number;
}

export interface CreateIncidentImageDTO {
  imageUrl: string;
  caption?: string;
  order: number;
}

export interface CreateIncidentAttachmentDTO {
  attachmentUrl: string;
  order: number;
}

export interface CreateIncidentDTO {
  code: string;
  subject: string;
  incidentDate: Date;
  roomId?: string;
  areaId: string;
  incidentType: IncidentTypeEnum;
  incidentClassification: IncidentClassificationEnum;
  type?: IncidentScopeEnum;
  requesterId: string;
  reportedBy: string;
  technicianId?: string;
  priority?: PriorityEnum;
  riskCategoryId: string;
  description?: string;
  controlMeasure?: string;
  dueDate?: Date;
  expectedOutcome?: string;
  needToStopActivity?: StopActivityEnum;
  stopActivityDescription?: string;
  treatment?: TreatmentEnum;
  treatmentDescription?: string;
  absence?: AbsenceEnum;
  resolution?: string;
  needFurtherInvestigation?: boolean;
  assignedDepartmentId: string;
  assigneeId?: string;
  status: GeneralStatusEnum;
  source?: SourceEnum;
  isActive?: boolean;
  injuredPersons?: CreateIncidentInjuredPersonDTO[];
  witnesses?: CreateIncidentWitnessDTO[];
  assets?: CreateIncidentAssetDTO[];
  images?: CreateIncidentImageDTO[];
  attachments?: CreateIncidentAttachmentDTO[];
}

export type UpdateIncidentDTO = Partial<CreateIncidentDTO>;
