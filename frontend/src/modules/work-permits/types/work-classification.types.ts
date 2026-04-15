import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

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
}

export interface UpdateWorkClassificationDTO {
  name?: string;
  code?: string;
  description?: string;
  safetyGuideline?: string;
  isActive?: boolean;
  attachments?: WorkClassificationAttachmentInput[];
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
  };
}
