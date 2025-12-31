import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { Prisma } from '@prisma/client';
import { CreateCertificateCategoryDto } from './dto/create-certificate-category.dto';
import { UpdateCertificateCategoryDto } from './dto/update-certificate-category.dto';
import { CertificateCategoryDto } from './dto/certificate-category.dto';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateDto } from './dto/certificate.dto';
import { FindCertificatesOptions } from './dto/find-certificates.dto';
import { CreateCertificateRenewalDto } from './dto/create-certificate-renewal.dto';
import { UpdateCertificateRenewalDto } from './dto/update-certificate-renewal.dto';
import { CertificateRenewalDto } from './dto/certificate-renewal.dto';
import { CertificateReminderDto } from './dto/certificate-reminder.dto';

@Injectable()
export class CertificatesService {
    private categoryMapper: (category: any) => CertificateCategoryDto;
    private categoryArrayMapper: (categories: any[]) => CertificateCategoryDto[];
    private categoryPaginatedMapper: (data: { data: any[]; meta: any }) => {
        data: CertificateCategoryDto[];
        meta: any;
    };

    private certificateMapper: (certificate: any) => CertificateDto;
    private certificateArrayMapper: (certificates: any[]) => CertificateDto[];
    private certificatePaginatedMapper: (data: { data: any[]; meta: any }) => {
        data: CertificateDto[];
        meta: any;
    };

    private renewalMapper: (renewal: any) => CertificateRenewalDto;
    private renewalArrayMapper: (renewals: any[]) => CertificateRenewalDto[];

    private reminderMapper: (reminder: any) => CertificateReminderDto;
    private reminderArrayMapper: (reminders: any[]) => CertificateReminderDto[];

    constructor(
        private prisma: PrismaService,
        private errorHandler: ErrorHandlingService,
        private dtoMapper: DtoMapperService,
    ) {
        // Initialize mappers
        this.categoryMapper = this.dtoMapper.createSimpleMapper(CertificateCategoryDto);
        this.categoryArrayMapper = this.dtoMapper.createSimpleArrayMapper(CertificateCategoryDto);
        this.categoryPaginatedMapper = this.dtoMapper.createPaginatedMapper(CertificateCategoryDto);

        this.certificateMapper = this.dtoMapper.createRelationMapper(CertificateDto, {
            category: { mapper: this.categoryMapper, isArray: false },
            department: { mapper: (d: any) => d, isArray: false },
            personnel: { mapper: (p: any) => p, isArray: false },
            creator: { mapper: (c: any) => c, isArray: false },
        });
        this.certificateArrayMapper = this.dtoMapper.createArrayMapper(CertificateDto, {
            relations: {
                category: { mapper: this.categoryMapper, isArray: false },
                department: { mapper: (d: any) => d, isArray: false },
                personnel: { mapper: (p: any) => p, isArray: false },
                creator: { mapper: (c: any) => c, isArray: false },
            },
        });
        this.certificatePaginatedMapper = this.dtoMapper.createPaginatedMapper(CertificateDto, {
            relations: {
                category: { mapper: this.categoryMapper, isArray: false },
                department: { mapper: (d: any) => d, isArray: false },
                personnel: { mapper: (p: any) => p, isArray: false },
                creator: { mapper: (c: any) => c, isArray: false },
            },
        });

        this.renewalMapper = this.dtoMapper.createRelationMapper(CertificateRenewalDto, {
            certificate: { mapper: (c: any) => c, isArray: false },
            requester: { mapper: (r: any) => r, isArray: false },
            processor: { mapper: (p: any) => p, isArray: false },
        });
        this.renewalArrayMapper = this.dtoMapper.createArrayMapper(CertificateRenewalDto, {
            relations: {
                certificate: { mapper: (c: any) => c, isArray: false },
                requester: { mapper: (r: any) => r, isArray: false },
                processor: { mapper: (p: any) => p, isArray: false },
            },
        });

        this.reminderMapper = this.dtoMapper.createRelationMapper(CertificateReminderDto, {
            certificate: { mapper: (c: any) => c, isArray: false },
            recipient: { mapper: (r: any) => r, isArray: false },
        });
        this.reminderArrayMapper = this.dtoMapper.createArrayMapper(CertificateReminderDto, {
            relations: {
                certificate: { mapper: (c: any) => c, isArray: false },
                recipient: { mapper: (r: any) => r, isArray: false },
            },
        });
    }

    // ==================== Certificate Categories ====================

    async createCategory(
        createCategoryDto: CreateCertificateCategoryDto,
    ): Promise<CertificateCategoryDto> {
        return this.errorHandler.safeExecute(async () => {
            const category = await this.prisma.certificateCategory.create({
                data: createCategoryDto,
            });

            return this.categoryMapper(category);
        }, 'create certificate category');
    }

    async findAllCategories(options?: {
        page?: number;
        limit?: number;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
        isActive?: boolean;
        search?: string;
    }): Promise<{
        data: CertificateCategoryDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'name',
            sortOrder = 'asc',
            isActive,
            search,
        } = options || {};

        const where: Prisma.CertificateCategoryWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

        if (search) {
            const searchTerm = search.trim();
            if (searchTerm.length > 0) {
                where.OR = [
                    { name: { contains: searchTerm, mode: 'insensitive' } },
                    { code: { contains: searchTerm, mode: 'insensitive' } },
                ];
            }
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        const [categories, total] = await Promise.all([
            this.prisma.certificateCategory.findMany({
                where,
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.certificateCategory.count({ where }),
        ]);

        return this.categoryPaginatedMapper({
            data: categories,
            meta: { total, page, limit },
        });
    }

    async findCategoryById(id: string): Promise<CertificateCategoryDto> {
        const category = await this.prisma.certificateCategory.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('CertificateCategory', id, category);

        return this.categoryMapper(category);
    }

    async updateCategory(
        id: string,
        updateCategoryDto: UpdateCertificateCategoryDto,
    ): Promise<CertificateCategoryDto> {
        const existingCategory = await this.prisma.certificateCategory.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('CertificateCategory', id, existingCategory);

        return this.errorHandler.safeExecute(async () => {
            const updatedCategory = await this.prisma.certificateCategory.update({
                where: { id },
                data: updateCategoryDto,
            });

            return this.categoryMapper(updatedCategory);
        }, 'update certificate category');
    }

    async deleteCategory(id: string): Promise<void> {
        const existingCategory = await this.prisma.certificateCategory.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                certificates: {
                    where: {
                        deletedAt: null,
                    },
                },
            },
        });

        this.errorHandler.throwIfNotFoundById('CertificateCategory', id, existingCategory);

        // Check if category has active certificates
        if (existingCategory.certificates.length > 0) {
            this.errorHandler.throwBadRequest(
                'Cannot delete category. It has active certificates.',
            );
        }

        // Soft delete
        await this.prisma.certificateCategory.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    // ==================== Certificates ====================

    async create(
        createCertificateDto: CreateCertificateDto,
        createdBy: string,
    ): Promise<CertificateDto> {
        return this.errorHandler.safeExecute(async () => {
            // Validate category exists
            const category = await this.prisma.certificateCategory.findFirst({
                where: {
                    id: createCertificateDto.categoryId,
                    deletedAt: null,
                },
            });

            this.errorHandler.throwIfNotFoundById(
                'CertificateCategory',
                createCertificateDto.categoryId,
                category,
            );

            // Validate department exists
            const department = await this.prisma.department.findUnique({
                where: { id: createCertificateDto.departmentId },
            });

            this.errorHandler.throwIfNotFoundById(
                'Department',
                createCertificateDto.departmentId,
                department,
            );

            // Validate equipment name for equipment certificates
            const equipmentTypes = [
                'EQUIPMENT_CALIBRATION',
                'EQUIPMENT_INSTALLATION',
                'EQUIPMENT_OPERATIONAL_PERMIT',
            ];
            if (equipmentTypes.includes(createCertificateDto.certificateType)) {
                if (!createCertificateDto.equipmentName && !createCertificateDto.equipmentId) {
                    this.errorHandler.throwBadRequest('Equipment Name is required for equipment certificates');
                }
            }

            // Validate personnel if provided
            if (createCertificateDto.personnelId) {
                const personnel = await this.prisma.user.findUnique({
                    where: { id: createCertificateDto.personnelId },
                });

                this.errorHandler.throwIfNotFoundById(
                    'User',
                    createCertificateDto.personnelId,
                    personnel,
                );
            }

            const certificate = await this.prisma.certificate.create({
                data: {
                    ...createCertificateDto,
                    issuedDate: new Date(createCertificateDto.issuedDate),
                    validityDate: new Date(createCertificateDto.validityDate),
                    reminderDays: createCertificateDto.reminderDays || 30,
                    createdBy,
                },
                include: {
                    category: true,
                    department: true,
                    personnel: true,
                    creator: true,
                },
            });

            // Create reminder for certificate expiry
            const reminderDays = createCertificateDto.reminderDays || 30;
            const validityDate = new Date(createCertificateDto.validityDate);
            const reminderDate = new Date(validityDate);
            reminderDate.setDate(validityDate.getDate() - reminderDays);

            // Only create reminder if reminder date is in the future
            if (reminderDate > new Date()) {
                await this.prisma.certificateReminder.create({
                    data: {
                        certificateId: certificate.id,
                        reminderDate: reminderDate,
                        recipientId: createdBy,
                        isSent: false,
                    },
                });
            }

            return this.certificateMapper(certificate);
        }, 'create certificate');
    }

    async findAll(options?: FindCertificatesOptions): Promise<{
        data: CertificateDto[];
        meta: { total: number; page: number; limit: number };
    }> {
        const {
            page = 1,
            limit = 10,
            sortBy = 'createdAt',
            sortOrder = 'desc',
            isActive,
            search,
            categoryId,
            certificateType,
            departmentId,
            personnelId,
            expired,
            expiringSoon,
        } = options || {};

        const where: Prisma.CertificateWhereInput = {
            deletedAt: null, // Only get non-deleted records
        };

        if (search) {
            const searchTerm = search.trim();
            if (searchTerm.length > 0) {
                where.OR = [
                    { certificateNumber: { contains: searchTerm, mode: 'insensitive' } },
                    { certificateName: { contains: searchTerm, mode: 'insensitive' } },
                    { personnelName: { contains: searchTerm, mode: 'insensitive' } },
                    { equipmentName: { contains: searchTerm, mode: 'insensitive' } },
                ];
            }
        }

        if (isActive !== undefined) {
            where.isActive = isActive;
        }

        if (categoryId) {
            where.categoryId = categoryId;
        }

        if (certificateType) {
            where.certificateType = certificateType;
        }

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (personnelId) {
            where.personnelId = personnelId;
        }

        // Filter expired certificates
        if (expired === true) {
            where.validityDate = {
                lt: new Date(),
            };
        }

        // Filter expiring soon certificates
        if (expiringSoon === true) {
            const now = new Date();
            const reminderDays = 30; // Default reminder days
            const futureDate = new Date();
            futureDate.setDate(now.getDate() + reminderDays);

            where.validityDate = {
                gte: now,
                lte: futureDate,
            };
        }

        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where,
                include: {
                    category: true,
                    department: true,
                    personnel: true,
                    creator: true,
                },
                orderBy: {
                    [sortBy]: sortOrder,
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
            this.prisma.certificate.count({ where }),
        ]);

        return this.certificatePaginatedMapper({
            data: certificates,
            meta: { total, page, limit },
        });
    }

    async findOne(id: string): Promise<CertificateDto> {
        const certificate = await this.prisma.certificate.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                category: true,
                department: true,
                personnel: true,
                creator: true,
                renewals: {
                    include: {
                        requester: true,
                        processor: true,
                    },
                    orderBy: {
                        createdAt: 'desc',
                    },
                },
                reminders: {
                    include: {
                        recipient: true,
                    },
                    orderBy: {
                        reminderDate: 'desc',
                    },
                },
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', id, certificate);

        return this.certificateMapper(certificate);
    }

    async update(
        id: string,
        updateCertificateDto: UpdateCertificateDto,
    ): Promise<CertificateDto> {
        const existingCertificate = await this.prisma.certificate.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', id, existingCertificate);

        return this.errorHandler.safeExecute(async () => {
            const updateData: any = { ...updateCertificateDto };

            if (updateCertificateDto.issuedDate) {
                updateData.issuedDate = new Date(updateCertificateDto.issuedDate);
            }

            if (updateCertificateDto.validityDate) {
                updateData.validityDate = new Date(updateCertificateDto.validityDate);
            }

            // Validate category if provided
            if (updateCertificateDto.categoryId) {
                const category = await this.prisma.certificateCategory.findFirst({
                    where: {
                        id: updateCertificateDto.categoryId,
                        deletedAt: null,
                    },
                });

                this.errorHandler.throwIfNotFoundById(
                    'CertificateCategory',
                    updateCertificateDto.categoryId,
                    category,
                );
            }

            // Validate department if provided
            if (updateCertificateDto.departmentId) {
                const department = await this.prisma.department.findUnique({
                    where: { id: updateCertificateDto.departmentId },
                });

                this.errorHandler.throwIfNotFoundById(
                    'Department',
                    updateCertificateDto.departmentId,
                    department,
                );
            }

            // Validate personnel if provided
            if (updateCertificateDto.personnelId) {
                const personnel = await this.prisma.user.findUnique({
                    where: { id: updateCertificateDto.personnelId },
                });

                this.errorHandler.throwIfNotFoundById(
                    'User',
                    updateCertificateDto.personnelId,
                    personnel,
                );
            }

            const updatedCertificate = await this.prisma.certificate.update({
                where: { id },
                data: updateData,
                include: {
                    category: true,
                    department: true,
                    personnel: true,
                    creator: true,
                },
            });

            return this.certificateMapper(updatedCertificate);
        }, 'update certificate');
    }

    async remove(id: string): Promise<void> {
        const existingCertificate = await this.prisma.certificate.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                renewals: {
                    where: {
                        status: {
                            in: ['PENDING', 'REQUESTED', 'IN_PROGRESS'],
                        },
                    },
                },
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', id, existingCertificate);

        // Check if certificate has active renewals
        if (existingCertificate.renewals.length > 0) {
            this.errorHandler.throwBadRequest(
                'Cannot delete certificate. It has active renewal requests.',
            );
        }

        // Soft delete
        await this.prisma.certificate.update({
            where: { id },
            data: {
                deletedAt: new Date(),
                isActive: false,
            },
        });
    }

    // ==================== Certificate Renewals ====================

    async findRenewalsByCertificateId(certificateId: string): Promise<CertificateRenewalDto[]> {
        const certificate = await this.prisma.certificate.findFirst({
            where: {
                id: certificateId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', certificateId, certificate);

        const renewals = await this.prisma.certificateRenewal.findMany({
            where: {
                certificateId,
            },
            include: {
                certificate: true,
                requester: true,
                processor: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        return this.renewalArrayMapper(renewals);
    }

    async createRenewal(
        certificateId: string,
        createRenewalDto: CreateCertificateRenewalDto,
        requestedBy: string,
    ): Promise<CertificateRenewalDto> {
        const certificate = await this.prisma.certificate.findFirst({
            where: {
                id: certificateId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', certificateId, certificate);

        return this.errorHandler.safeExecute(async () => {
            const renewal = await this.prisma.certificateRenewal.create({
                data: {
                    certificateId,
                    requestedBy,
                    notes: createRenewalDto.notes,
                },
                include: {
                    certificate: true,
                    requester: true,
                    processor: true,
                },
            });

            return this.renewalMapper(renewal);
        }, 'create certificate renewal');
    }

    async updateRenewal(
        id: string,
        updateRenewalDto: UpdateCertificateRenewalDto,
        processedBy?: string,
    ): Promise<CertificateRenewalDto> {
        const existingRenewal = await this.prisma.certificateRenewal.findUnique({
            where: { id },
        });

        this.errorHandler.throwIfNotFoundById('CertificateRenewal', id, existingRenewal);

        return this.errorHandler.safeExecute(async () => {
            const updateData: any = { ...updateRenewalDto };

            if (updateRenewalDto.newValidityDate) {
                updateData.newValidityDate = new Date(updateRenewalDto.newValidityDate);
            }

            // If status is being updated to COMPLETED, update certificate validity date
            if (updateRenewalDto.status === 'COMPLETED' && updateRenewalDto.newValidityDate) {
                await this.prisma.certificate.update({
                    where: { id: existingRenewal.certificateId },
                    data: {
                        validityDate: new Date(updateRenewalDto.newValidityDate),
                        documentUrl: updateRenewalDto.newDocumentUrl || undefined,
                    },
                });
            }

            if (processedBy) {
                updateData.processedBy = processedBy;
                updateData.processedDate = new Date();
            }

            const updatedRenewal = await this.prisma.certificateRenewal.update({
                where: { id },
                data: updateData,
                include: {
                    certificate: true,
                    requester: true,
                    processor: true,
                },
            });

            return this.renewalMapper(updatedRenewal);
        }, 'update certificate renewal');
    }

    // ==================== Certificate Reminders ====================

    async findRemindersByCertificateId(certificateId: string): Promise<CertificateReminderDto[]> {
        const certificate = await this.prisma.certificate.findFirst({
            where: {
                id: certificateId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', certificateId, certificate);

        const reminders = await this.prisma.certificateReminder.findMany({
            where: {
                certificateId,
            },
            include: {
                certificate: true,
                recipient: true,
            },
            orderBy: {
                reminderDate: 'desc',
            },
        });

        return this.reminderArrayMapper(reminders);
    }
}

