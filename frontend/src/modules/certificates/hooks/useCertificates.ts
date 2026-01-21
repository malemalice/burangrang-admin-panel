import { useState, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import certificateService from '../services/certificateService';
import certificateCategoryService from '../services/certificateCategoryService';
import {
    Certificate,
    CertificateCategory,
    PaginatedResponse,
    CertificateSearchParams,
    CreateCertificateDTO,
    UpdateCertificateDTO,
    CertificateRenewal,
    CertificateReminder,
    CreateCertificateRenewalDTO,
    UpdateCertificateRenewalDTO,
    PaginationParams,
} from '../types/certificate.types';

/**
 * Custom hook for managing certificates
 */
export const useCertificates = () => {
    const [certificates, setCertificates] = useState<Certificate[]>([]);
    const [totalCertificates, setTotalCertificates] = useState(0);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCertificates = useCallback(async (params: CertificateSearchParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response: PaginatedResponse<Certificate> =
                await certificateService.getCertificates(params);
            setCertificates(response.data || []);
            setTotalCertificates(response.meta?.total || 0);
            setCurrentPage(params.page);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch certificates';
            setError(errorMessage);
            toast.error(errorMessage);
            setCertificates([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createCertificate = useCallback(
        async (certificateData: CreateCertificateDTO): Promise<Certificate> => {
            try {
                const newCertificate = await certificateService.createCertificate(certificateData);
                setCertificates((prev) => [newCertificate, ...prev]);
                setTotalCertificates((prev) => prev + 1);
                toast.success('Certificate created successfully');
                return newCertificate;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to create certificate';
                toast.error(errorMessage);
                throw err;
            }
        },
        [],
    );

    const updateCertificate = useCallback(
        async (
            id: string,
            certificateData: UpdateCertificateDTO,
        ): Promise<Certificate> => {
            try {
                const updatedCertificate = await certificateService.updateCertificate(
                    id,
                    certificateData,
                );
                setCertificates((prev) =>
                    prev.map((cert) => (cert.id === id ? updatedCertificate : cert)),
                );
                toast.success('Certificate updated successfully');
                return updatedCertificate;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to update certificate';
                toast.error(errorMessage);
                throw err;
            }
        },
        [],
    );

    const deleteCertificate = useCallback(async (id: string): Promise<void> => {
        try {
            await certificateService.deleteCertificate(id);
            setCertificates((prev) => prev.filter((cert) => cert.id !== id));
            setTotalCertificates((prev) => prev - 1);
            toast.success('Certificate deleted successfully');
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to delete certificate';
            toast.error(errorMessage);
            throw err;
        }
    }, []);

    return {
        certificates,
        totalCertificates,
        currentPage,
        isLoading,
        error,
        fetchCertificates,
        createCertificate,
        updateCertificate,
        deleteCertificate,
    };
};

/**
 * Custom hook for managing a single certificate
 */
export const useCertificate = (id: string | null = null) => {
    const [certificate, setCertificate] = useState<Certificate | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchCertificate = useCallback(async (certificateId: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await certificateService.getCertificateById(certificateId);
            setCertificate(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch certificate';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (id) {
            fetchCertificate(id);
        }
    }, [id, fetchCertificate]);

    return {
        certificate,
        isLoading,
        error,
        fetchCertificate,
        setCertificate,
    };
};

/**
 * Custom hook for managing certificate categories
 */
export const useCertificateCategories = () => {
    const [categories, setCategories] = useState<CertificateCategory[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [hasInitialFetch, setHasInitialFetch] = useState(false);
    const [pagination, setPagination] = useState<{
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>({
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
    });

    const fetchCategories = useCallback(async (params?: PaginationParams) => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await certificateCategoryService.getCategories(
                params || { page: 1, limit: 100 }, // Use larger limit for form dropdowns
            );
            setCategories(response.data || []);
            setHasInitialFetch(true);
            if (response.meta) {
                setPagination({
                    total: response.meta.total || 0,
                    page: response.meta.page || 1,
                    limit: response.meta.limit || 10,
                    totalPages: response.meta.pageCount || Math.ceil((response.meta.total || 0) / (response.meta.limit || 10)),
                });
            }
        } catch (err) {
            const errorMessage =
                err instanceof Error
                    ? err.message
                    : 'Failed to fetch certificate categories';
            setError(errorMessage);
            toast.error(errorMessage);
            setCategories([]);
            setPagination({
                total: 0,
                page: 1,
                limit: 10,
                totalPages: 0,
            });
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Auto-fetch categories on mount if not already loaded
    useEffect(() => {
        if (!hasInitialFetch && !isLoading) {
            fetchCategories({ page: 1, limit: 100 });
        }
    }, [hasInitialFetch, isLoading, fetchCategories]);

    return {
        categories,
        isLoading,
        error,
        pagination,
        fetchCategories,
    };
};

/**
 * Custom hook for managing certificate renewals
 */
export const useCertificateRenewals = (certificateId: string | null = null) => {
    const [renewals, setRenewals] = useState<CertificateRenewal[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchRenewals = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await certificateService.getRenewals(id);
            setRenewals(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch renewals';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const createRenewal = useCallback(
        async (
            id: string,
            renewalData: CreateCertificateRenewalDTO,
        ): Promise<CertificateRenewal> => {
            try {
                const newRenewal = await certificateService.createRenewal(id, renewalData);
                setRenewals((prev) => [newRenewal, ...prev]);
                toast.success('Renewal request created successfully');
                return newRenewal;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to create renewal request';
                toast.error(errorMessage);
                throw err;
            }
        },
        [],
    );

    const updateRenewal = useCallback(
        async (
            renewalId: string,
            renewalData: UpdateCertificateRenewalDTO,
        ): Promise<CertificateRenewal> => {
            try {
                const updatedRenewal = await certificateService.updateRenewal(
                    renewalId,
                    renewalData,
                );
                setRenewals((prev) =>
                    prev.map((renewal) =>
                        renewal.id === renewalId ? updatedRenewal : renewal,
                    ),
                );
                toast.success('Renewal updated successfully');
                return updatedRenewal;
            } catch (err) {
                const errorMessage =
                    err instanceof Error ? err.message : 'Failed to update renewal';
                toast.error(errorMessage);
                throw err;
            }
        },
        [],
    );

    useEffect(() => {
        if (certificateId) {
            fetchRenewals(certificateId);
        }
    }, [certificateId, fetchRenewals]);

    return {
        renewals,
        isLoading,
        error,
        fetchRenewals,
        createRenewal,
        updateRenewal,
    };
};

/**
 * Custom hook for managing certificate reminders
 */
export const useCertificateReminders = (certificateId: string | null = null) => {
    const [reminders, setReminders] = useState<CertificateReminder[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchReminders = useCallback(async (id: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = await certificateService.getReminders(id);
            setReminders(data);
        } catch (err) {
            const errorMessage =
                err instanceof Error ? err.message : 'Failed to fetch reminders';
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (certificateId) {
            fetchReminders(certificateId);
        }
    }, [certificateId, fetchReminders]);

    return {
        reminders,
        isLoading,
        error,
        fetchReminders,
    };
};

