/**
 * Certificates module types
 */

// Re-export core types
import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';
export type { PaginatedResponse, PaginationParams };

// Certificate Type Enum
export type CertificateType =
    | 'PERSONNEL_LICENSE'
    | 'PERSONNEL_CERTIFICATE'
    | 'EQUIPMENT_CALIBRATION'
    | 'EQUIPMENT_INSTALLATION'
    | 'EQUIPMENT_OPERATIONAL_PERMIT';

// Certificate Renewal Status Enum
export type CertificateRenewalStatus =
    | 'PENDING'
    | 'REQUESTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'REJECTED'
    | 'EXPIRED';

// Certificate Category DTO from backend
export interface CertificateCategoryDTO {
    id: string;
    name: string;
    code: string;
    certificateType: CertificateType;
    description?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Certificate Category for frontend
export interface CertificateCategory {
    id: string;
    name: string;
    code: string;
    certificateType: CertificateType;
    description?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

// Create Certificate Category DTO
export interface CreateCertificateCategoryDTO {
    name: string;
    code: string;
    certificateType: CertificateType;
    description?: string;
    isActive?: boolean;
}

// Update Certificate Category DTO
export interface UpdateCertificateCategoryDTO {
    name?: string;
    code?: string;
    certificateType?: CertificateType;
    description?: string;
    isActive?: boolean;
}

// Certificate DTO from backend
export interface CertificateDTO {
    id: string;
    certificateNumber: string;
    certificateName: string;
    categoryId: string;
    category?: CertificateCategoryDTO;
    certificateType: CertificateType;
    issuedDate: string;
    validityDate: string;
    issuerName: string;
    documentUrl?: string | null;
    personnelId?: string | null;
    personnelName?: string | null;
    personnel?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    equipmentId?: string | null;
    equipmentName?: string | null;
    departmentId: string;
    department?: {
        id: string;
        name: string;
    };
    reminderDays: number;
    notes?: string | null;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    creator?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
}

// Certificate for frontend
export interface Certificate {
    id: string;
    certificateNumber: string;
    certificateName: string;
    categoryId: string;
    category?: CertificateCategory;
    certificateType: CertificateType;
    issuedDate: string;
    validityDate: string;
    issuerName: string;
    documentUrl?: string;
    personnelId?: string;
    personnelName?: string;
    personnel?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    equipmentId?: string;
    equipmentName?: string;
    departmentId: string;
    department?: string;
    reminderDays: number;
    notes?: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
    createdBy: string;
    creator?: string;
    isExpired: boolean;
    isExpiringSoon: boolean;
}

// Create Certificate DTO
export interface CreateCertificateDTO {
    certificateNumber: string;
    certificateName: string;
    categoryId: string;
    certificateType: CertificateType;
    issuedDate: string;
    validityDate: string;
    issuerName: string;
    documentUrl?: string;
    personnelId?: string;
    personnelName?: string;
    equipmentId?: string;
    equipmentName?: string;
    departmentId: string;
    reminderDays?: number;
    notes?: string;
}

// Update Certificate DTO
export interface UpdateCertificateDTO {
    certificateNumber?: string;
    certificateName?: string;
    categoryId?: string;
    certificateType?: CertificateType;
    issuedDate?: string;
    validityDate?: string;
    issuerName?: string;
    documentUrl?: string;
    personnelId?: string;
    personnelName?: string;
    personnel?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    equipmentId?: string;
    equipmentName?: string;
    departmentId?: string;
    reminderDays?: number;
    notes?: string;
    isActive?: boolean;
}

// Certificate Renewal DTO
export interface CertificateRenewalDTO {
    id: string;
    certificateId: string;
    certificate?: CertificateDTO;
    requestDate: string;
    requestedBy: string;
    requester?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    status: CertificateRenewalStatus;
    processedBy?: string | null;
    processor?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    processedDate?: string | null;
    newValidityDate?: string | null;
    newDocumentUrl?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

// Certificate Renewal for frontend
export interface CertificateRenewal {
    id: string;
    certificateId: string;
    requestDate: string;
    requestedBy: string;
    requester?: string;
    status: CertificateRenewalStatus;
    processedBy?: string;
    processor?: string;
    processedDate?: string;
    newValidityDate?: string;
    newDocumentUrl?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// Create Certificate Renewal DTO
export interface CreateCertificateRenewalDTO {
    notes?: string;
}

// Update Certificate Renewal DTO
export interface UpdateCertificateRenewalDTO {
    status?: CertificateRenewalStatus;
    newValidityDate?: string;
    newDocumentUrl?: string;
    notes?: string;
}

// Certificate Reminder DTO
export interface CertificateReminderDTO {
    id: string;
    certificateId: string;
    certificate?: CertificateDTO;
    reminderDate: string;
    isSent: boolean;
    sentAt?: string | null;
    recipientId: string;
    recipient?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    createdAt: string;
}

// Certificate Reminder for frontend
export interface CertificateReminder {
    id: string;
    certificateId: string;
    reminderDate: string;
    isSent: boolean;
    sentAt?: string;
    recipientId: string;
    recipient?: string;
    createdAt: string;
}

// Certificate Form Data
export interface CertificateFormData {
    certificateNumber: string;
    certificateName: string;
    categoryId: string;
    certificateType: CertificateType;
    issuedDate: string;
    validityDate: string;
    issuerName: string;
    documentUrl?: string;
    personnelId?: string;
    personnelName?: string;
    equipmentId?: string;
    equipmentName?: string;
    departmentId: string;
    reminderDays: number;
    notes?: string;
}

// Certificate Filters
export interface CertificateFilters {
    categoryId?: string;
    certificateType?: CertificateType;
    departmentId?: string;
    personnelId?: string;
    expired?: boolean;
    expiringSoon?: boolean;
    status?: 'active' | 'inactive' | 'all';
}

// Certificate Search Parameters
export interface CertificateSearchParams {
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
    filters?: CertificateFilters;
    isActive?: boolean;
    categoryId?: string;
    certificateType?: CertificateType;
    departmentId?: string;
    personnelId?: string;
    expired?: boolean;
    expiringSoon?: boolean;
}
