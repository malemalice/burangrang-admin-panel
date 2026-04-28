import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';
import type { SafetyEquipment, SafetyEquipmentCategory } from '@/modules/ppe/types/ppe-master-data.types';
import type { Risk } from '@/core/lib/types';

export type { PaginatedResponse, PaginationParams };

export interface WorkClassificationAttachment {
  id: string;
  fileUrl: string;
  fileName: string;
  fileType?: string;
  description?: string;
  order: number;
  createdAt: string;
}

export interface WorkClassificationRiskEquipmentRow {
  id: string;
  notes?: string;
  order: number;
  createdAt: string;
  risk: Pick<Risk, 'id' | 'name' | 'code'>;
  safetyEquipment: Pick<
    SafetyEquipment,
    'id' | 'name' | 'code' | 'category' | 'size' | 'safetyEquipmentTypeId' | 'safetyEquipmentType'
  > & { category: SafetyEquipmentCategory };
}

export interface WorkClassificationRiskEquipmentRowInput {
  riskId: string;
  safetyEquipmentId: string;
  order: number;
}

/** DTO from backend */
export interface WorkClassificationDTO {
  id: string;
  name: string;
  code: string;
  description?: string | null;
  safetyGuideline?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: WorkClassificationAttachment[] | null;
  riskEquipmentRows?: WorkClassificationRiskEquipmentRow[] | null;
}

/** UI model */
export interface WorkClassification {
  id: string;
  name: string;
  code: string;
  description?: string;
  safetyGuideline?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  attachments?: WorkClassificationAttachment[];
  riskEquipmentRows?: WorkClassificationRiskEquipmentRow[];
}

export interface WorkClassificationAttachmentInput {
  fileUrl: string;
  fileName: string;
  fileType?: string;
  description?: string;
  order: number;
}

export interface CreateWorkClassificationDTO {
  name: string;
  code: string;
  description?: string;
  safetyGuideline?: string;
  isActive?: boolean;
  attachments?: WorkClassificationAttachmentInput[];
  riskEquipmentRows?: WorkClassificationRiskEquipmentRowInput[];
}

export interface UpdateWorkClassificationDTO {
  name?: string;
  code?: string;
  description?: string;
  safetyGuideline?: string;
  isActive?: boolean;
  attachments?: WorkClassificationAttachmentInput[];
  riskEquipmentRows?: WorkClassificationRiskEquipmentRowInput[];
}

export interface WorkClassificationSearchParams extends PaginationParams {
  isActive?: boolean;
}

export function mapWorkClassificationDtoToModel(dto: WorkClassificationDTO): WorkClassification {
  return {
    id: dto.id,
    name: dto.name,
    code: dto.code,
    description: dto.description ?? undefined,
    safetyGuideline: dto.safetyGuideline ?? undefined,
    isActive: dto.isActive,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    attachments: dto.attachments?.length
      ? dto.attachments.map((a) => ({
          id: a.id,
          fileUrl: a.fileUrl,
          fileName: a.fileName,
          fileType: a.fileType,
          description: a.description,
          order: a.order,
          createdAt: a.createdAt,
        }))
      : undefined,
    riskEquipmentRows: dto.riskEquipmentRows?.length
      ? dto.riskEquipmentRows
          .filter((row) => !!row?.id && !!row?.risk && !!row?.safetyEquipment)
          .map((row) => ({
            id: row.id,
            notes: row.notes ?? undefined,
            order: row.order,
            createdAt: row.createdAt,
            risk: row.risk,
            safetyEquipment: row.safetyEquipment,
          }))
      : undefined,
  };
}
