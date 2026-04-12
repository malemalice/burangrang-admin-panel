import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

export type { PaginatedResponse, PaginationParams };

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
}

export interface CreateWorkClassificationDTO {
  name: string;
  code: string;
  description?: string;
  safetyGuideline?: string;
  isActive?: boolean;
}

export interface UpdateWorkClassificationDTO {
  name?: string;
  code?: string;
  description?: string;
  safetyGuideline?: string;
  isActive?: boolean;
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
  };
}
