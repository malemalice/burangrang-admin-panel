import api from '@/core/lib/api';
import {
    Certificate,
    CertificateDTO,
    CertificateRenewal,
    CertificateRenewalDTO,
    CertificateReminder,
    CertificateReminderDTO,
    PaginatedResponse,
    PaginationParams,
    CreateCertificateDTO,
    UpdateCertificateDTO,
    CreateCertificateRenewalDTO,
    UpdateCertificateRenewalDTO,
} from '../types/certificate.types';

// Convert CertificateDTO from backend to Certificate model for frontend
const mapCertificateDtoToCertificate = (
    certificateDto: CertificateDTO,
): Certificate => {
    const now = new Date();
    const validityDate = new Date(certificateDto.validityDate);
    const reminderDate = new Date(validityDate);
    reminderDate.setDate(validityDate.getDate() - (certificateDto.reminderDays || 30));

    return {
        id: certificateDto.id,
        certificateNumber: certificateDto.certificateNumber,
        certificateName: certificateDto.certificateName,
        categoryId: certificateDto.categoryId,
        category: certificateDto.category
            ? {
                id: certificateDto.category.id,
                name: certificateDto.category.name,
                code: certificateDto.category.code,
                certificateType: certificateDto.category.certificateType,
                description: certificateDto.category.description || undefined,
                isActive: certificateDto.category.isActive,
                createdAt: certificateDto.category.createdAt,
                updatedAt: certificateDto.category.updatedAt,
            }
            : undefined,
        certificateType: certificateDto.certificateType,
        issuedDate: certificateDto.issuedDate,
        validityDate: certificateDto.validityDate,
        issuerName: certificateDto.issuerName,
        documentUrl: certificateDto.documentUrl || undefined,
        personnelId: certificateDto.personnelId || undefined,
        personnelName: certificateDto.personnelName || undefined,
        personnel: certificateDto.personnel
            ? {
                id: certificateDto.personnel.id,
                firstName: certificateDto.personnel.firstName,
                lastName: certificateDto.personnel.lastName,
                email: certificateDto.personnel.email,
            }
            : undefined,
        equipmentId: certificateDto.equipmentId || undefined,
        equipmentName: certificateDto.equipmentName || undefined,
        departmentId: certificateDto.departmentId,
        department: certificateDto.department?.name,
        reminderDays: certificateDto.reminderDays,
        notes: certificateDto.notes || undefined,
        isActive: certificateDto.isActive,
        createdAt: certificateDto.createdAt,
        updatedAt: certificateDto.updatedAt,
        createdBy: certificateDto.createdBy,
        creator: certificateDto.creator
            ? `${certificateDto.creator.firstName} ${certificateDto.creator.lastName}`
            : undefined,
        isExpired: validityDate < now,
        isExpiringSoon: now >= reminderDate && validityDate >= now,
    };
};

// Convert CertificateRenewalDTO to CertificateRenewal
const mapRenewalDtoToRenewal = (
    renewalDto: CertificateRenewalDTO,
): CertificateRenewal => {
    return {
        id: renewalDto.id,
        certificateId: renewalDto.certificateId,
        requestDate: renewalDto.requestDate,
        requestedBy: renewalDto.requestedBy,
        requester: renewalDto.requester
            ? `${renewalDto.requester.firstName} ${renewalDto.requester.lastName}`
            : undefined,
        status: renewalDto.status,
        processedBy: renewalDto.processedBy || undefined,
        processor: renewalDto.processor
            ? `${renewalDto.processor.firstName} ${renewalDto.processor.lastName}`
            : undefined,
        processedDate: renewalDto.processedDate || undefined,
        newValidityDate: renewalDto.newValidityDate || undefined,
        newDocumentUrl: renewalDto.newDocumentUrl || undefined,
        notes: renewalDto.notes || undefined,
        createdAt: renewalDto.createdAt,
        updatedAt: renewalDto.updatedAt,
    };
};

// Convert CertificateReminderDTO to CertificateReminder
const mapReminderDtoToReminder = (
    reminderDto: CertificateReminderDTO,
): CertificateReminder => {
    return {
        id: reminderDto.id,
        certificateId: reminderDto.certificateId,
        reminderDate: reminderDto.reminderDate,
        isSent: reminderDto.isSent,
        sentAt: reminderDto.sentAt || undefined,
        recipientId: reminderDto.recipientId,
        recipient: reminderDto.recipient
            ? `${reminderDto.recipient.firstName} ${reminderDto.recipient.lastName}`
            : undefined,
        createdAt: reminderDto.createdAt,
    };
};

const certificateService = {
    // Get all certificates with pagination and filtering
    getCertificates: async (
        params: PaginationParams,
    ): Promise<PaginatedResponse<Certificate>> => {
        try {
            const queryParams = new URLSearchParams({
                page: params.page.toString(),
                limit: params.limit.toString(),
            });

            if (params.sortBy) {
                queryParams.append('sortBy', params.sortBy);
                queryParams.append('sortOrder', params.sortOrder || 'desc');
            }

            if (params.search) {
                queryParams.append('search', params.search);
            }

            if (params.filters) {
                Object.entries(params.filters).forEach(([key, value]) => {
                    if (value !== undefined && value !== null && value !== '') {
                        queryParams.append(key, value.toString());
                    }
                });
            }

            const response = await api.get(`/certificates?${queryParams.toString()}`);
            return {
                data: response.data.data.map(mapCertificateDtoToCertificate),
                meta: response.data.meta,
            };
        } catch (error: any) {
            console.error('Error fetching certificates:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to fetch certificates';
            throw new Error(errorMessage);
        }
    },

    // Get a single certificate by ID
    getCertificateById: async (id: string): Promise<Certificate> => {
        try {
            const response = await api.get(`/certificates/${id}`);
            return mapCertificateDtoToCertificate(response.data);
        } catch (error: any) {
            console.error(`Error fetching certificate ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || `Failed to fetch certificate ${id}`;
            throw new Error(errorMessage);
        }
    },

    // Create a new certificate
    createCertificate: async (
        certificateData: CreateCertificateDTO,
    ): Promise<Certificate> => {
        try {
            const response = await api.post('/certificates', certificateData);
            return mapCertificateDtoToCertificate(response.data);
        } catch (error: any) {
            console.error('Error creating certificate:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to create certificate';
            throw new Error(errorMessage);
        }
    },

    // Update an existing certificate
    updateCertificate: async (
        id: string,
        certificateData: UpdateCertificateDTO,
    ): Promise<Certificate> => {
        try {
            const response = await api.patch(`/certificates/${id}`, certificateData);
            return mapCertificateDtoToCertificate(response.data);
        } catch (error: any) {
            console.error(`Error updating certificate ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || 'Failed to update certificate';
            throw new Error(errorMessage);
        }
    },

    // Delete a certificate
    deleteCertificate: async (id: string): Promise<void> => {
        try {
            await api.delete(`/certificates/${id}`);
        } catch (error: any) {
            console.error(`Error deleting certificate ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || 'Failed to delete certificate';
            throw new Error(errorMessage);
        }
    },

    // Get renewals for a certificate
    getRenewals: async (certificateId: string): Promise<CertificateRenewal[]> => {
        try {
            const response = await api.get(`/certificates/${certificateId}/renewals`);
            return response.data.map(mapRenewalDtoToRenewal);
        } catch (error: any) {
            console.error(
                `Error fetching renewals for certificate ${certificateId}:`,
                error,
            );
            const errorMessage =
                error.response?.data?.message ||
                `Failed to fetch renewals for certificate ${certificateId}`;
            throw new Error(errorMessage);
        }
    },

    // Create a renewal request
    createRenewal: async (
        certificateId: string,
        renewalData: CreateCertificateRenewalDTO,
    ): Promise<CertificateRenewal> => {
        try {
            const response = await api.post(
                `/certificates/${certificateId}/renewals`,
                renewalData,
            );
            return mapRenewalDtoToRenewal(response.data);
        } catch (error: any) {
            console.error('Error creating renewal:', error);
            const errorMessage =
                error.response?.data?.message || 'Failed to create renewal';
            throw new Error(errorMessage);
        }
    },

    // Update renewal status
    updateRenewal: async (
        id: string,
        renewalData: UpdateCertificateRenewalDTO,
    ): Promise<CertificateRenewal> => {
        try {
            const response = await api.patch(`/certificates/renewals/${id}`, renewalData);
            return mapRenewalDtoToRenewal(response.data);
        } catch (error: any) {
            console.error(`Error updating renewal ${id}:`, error);
            const errorMessage =
                error.response?.data?.message || 'Failed to update renewal';
            throw new Error(errorMessage);
        }
    },

    // Get reminders for a certificate
    getReminders: async (certificateId: string): Promise<CertificateReminder[]> => {
        try {
            const response = await api.get(`/certificates/${certificateId}/reminders`);
            return response.data.map(mapReminderDtoToReminder);
        } catch (error: any) {
            console.error(
                `Error fetching reminders for certificate ${certificateId}:`,
                error,
            );
            const errorMessage =
                error.response?.data?.message ||
                `Failed to fetch reminders for certificate ${certificateId}`;
            throw new Error(errorMessage);
        }
    },
};

export default certificateService;

