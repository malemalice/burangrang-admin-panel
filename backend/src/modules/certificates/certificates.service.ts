import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { UserContext } from '../../shared/types/user-context';
import {
    CertificateRenewalStatusEnum,
    CertificateTypeEnum,
    Prisma,
} from '@prisma/client';
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
import { RemindersService } from '../reminders/reminders.service';
import {
    ReminderRepeatTypeEnum,
    ReminderStatusEnum,
    ReminderTargetTypeEnum,
} from '../reminders/dto/reminder.dto';

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
        private dataScopeService: DataScopeService,
        private remindersService: RemindersService,
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
        certificateType?: CertificateTypeEnum;
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
            certificateType,
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

        if (certificateType) {
            where.certificateType = certificateType;
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

            // Validate equipment name for equipment certificates (type from category)
            const equipmentTypes = [
                'EQUIPMENT_CALIBRATION',
                'EQUIPMENT_INSTALLATION',
                'EQUIPMENT_OPERATIONAL_PERMIT',
            ];
            if (equipmentTypes.includes(category.certificateType)) {
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

            // Create chained reminders using General Reminder System
            await this.createChainedReminders(certificate, createdBy);

            return this.certificateMapper(certificate);
        }, 'create certificate');
    }

    private async createChainedReminders(certificate: any, userId: string) {
        // Validate user exists before creating reminders
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            console.warn(`User ${userId} not found, skipping reminder creation for certificate ${certificate.id}`);
            return;
        }

        const validityDate = new Date(certificate.validityDate);
        const now = new Date();
        const reminderDays = certificate.reminderDays || 30;
        const certificateTitle = certificate.certificateName || certificate.certificateNumber;

        if (validityDate <= now || reminderDays < 1) {
            return;
        }

        const reminderStart = new Date(validityDate);
        reminderStart.setDate(validityDate.getDate() - reminderDays);

        const oneWeekBefore = new Date(validityDate);
        oneWeekBefore.setDate(validityDate.getDate() - 7);

        const oneDayBefore = new Date(validityDate);
        oneDayBefore.setDate(validityDate.getDate() - 1);

        const getNextHourFromNow = () => {
            const date = new Date(now);
            date.setHours(date.getHours() + 1);
            return date;
        };

        // 1. Monthly Reminder: when reminder window is longer than 30 days
        // Repeats monthly from reminderStart until 7 days before expiry
        if (reminderDays > 30) {
            const monthlyEnd = oneWeekBefore;
            const monthlyStart = reminderStart > now ? reminderStart : getNextHourFromNow();

            if (monthlyEnd > monthlyStart) {
                await this.remindersService.create(
                    {
                        targetType: ReminderTargetTypeEnum.USER,
                        targetId: userId,
                        message: `Certificate "${certificateTitle}" will expire on ${validityDate.toLocaleDateString()} (Monthly Check)`,
                        remindAt: monthlyStart.toISOString(),
                        repeatType: ReminderRepeatTypeEnum.MONTHLY,
                        repeatUntil: monthlyEnd.toISOString(),
                        entity: 't_certificates',
                        entityId: certificate.id,
                    },
                    userId,
                );
            }
        }

        // 2. Weekly Reminder: for reminder window longer than 7 days
        // - >30 days: starts at 7 days before expiry (after monthly window)
        // - 8..30 days: starts at reminderStart
        if (reminderDays > 7) {
            const weeklyBaseStart = reminderDays > 30 ? oneWeekBefore : reminderStart;
            const weeklyStart = weeklyBaseStart > now ? weeklyBaseStart : getNextHourFromNow();

            if (oneDayBefore > weeklyStart) {
                await this.remindersService.create(
                    {
                        targetType: ReminderTargetTypeEnum.USER,
                        targetId: userId,
                        message: `Certificate "${certificateTitle}" expires soon! Due: ${validityDate.toLocaleDateString()} (Weekly Warning)`,
                        remindAt: weeklyStart.toISOString(),
                        repeatType: ReminderRepeatTypeEnum.WEEKLY,
                        repeatUntil: oneDayBefore.toISOString(),
                        entity: 't_certificates',
                        entityId: certificate.id,
                    },
                    userId,
                );
            }
        }

        // 3. Daily Reminder
        // - <=7 days: starts at reminderStart
        // - >7 days: starts at 1 day before expiry
        const dailyBaseStart = reminderDays <= 7 ? reminderStart : oneDayBefore;
        const dailyStart = dailyBaseStart > now ? dailyBaseStart : getNextHourFromNow();

        if (validityDate > dailyStart) {
            await this.remindersService.create(
                {
                    targetType: ReminderTargetTypeEnum.USER,
                    targetId: userId,
                    message: `URGENT: Certificate "${certificateTitle}" expires on ${validityDate.toLocaleDateString()} (Daily Alert)`,
                    remindAt: dailyStart.toISOString(),
                    repeatType: ReminderRepeatTypeEnum.DAILY,
                    repeatUntil: validityDate.toISOString(),
                    entity: 't_certificates',
                    entityId: certificate.id,
                },
                userId,
            );
        }
    }

    /**
     * Ensure current user can access the certificate (data-level). Throws 403 if not.
     */
    private async ensureCanAccessCertificate(
        id: string,
        userContext: UserContext | undefined,
    ): Promise<void> {
        const certificate = await this.prisma.certificate.findFirst({
            where: { id, deletedAt: null },
            select: { createdBy: true, personnelId: true, departmentId: true },
        });
        this.errorHandler.throwIfNotFoundById('Certificate', id, certificate);
        if (!this.dataScopeService.canAccessRecord(userContext, 'Certificate', certificate)) {
            this.errorHandler.throwForbidden('You do not have access to this record');
        }
    }

    async findAll(
        options?: FindCertificatesOptions,
        userContext?: UserContext,
    ): Promise<{
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
            personnelName,
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
                    // Add search in personnel relation
                    { personnel: { firstName: { contains: searchTerm, mode: 'insensitive' } } },
                    { personnel: { lastName: { contains: searchTerm, mode: 'insensitive' } } },
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
            where.category = { certificateType };
        }

        if (departmentId) {
            where.departmentId = departmentId;
        }

        if (personnelId) {
            where.personnelId = personnelId;
        }

        if (personnelName) {
            const nameTerm = personnelName.trim();
            if (nameTerm.length > 0) {
                where.personnelName = { contains: nameTerm, mode: 'insensitive' };
            }
        }

        // Filter expired and expiring soon certificates
        const now = new Date();
        const reminderDays = 30; // Default reminder days
        const futureDate = new Date();
        futureDate.setDate(now.getDate() + reminderDays);

        if (expired === true && expiringSoon === true) {
            // Both filters: Use OR condition
            where.OR = [
                ...(where.OR || []),
                { validityDate: { lt: now } },
                { validityDate: { gte: now, lte: futureDate } },
            ];
        } else if (expired === true) {
            where.validityDate = {
                lt: now,
            };
        } else if (expiringSoon === true) {
            where.validityDate = {
                gte: now,
                lte: futureDate,
            };
        }

        // Data-level scope: hide rows user is not allowed to see
        const scopeWhere = this.dataScopeService.buildWhereForList(userContext, 'Certificate', where);
        const finalWhere =
            scopeWhere && Object.keys(scopeWhere).length > 0
                ? { AND: [where, scopeWhere] }
                : where;

        const [certificates, total] = await Promise.all([
            this.prisma.certificate.findMany({
                where: finalWhere,
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
            this.prisma.certificate.count({ where: finalWhere }),
        ]);

        return this.certificatePaginatedMapper({
            data: certificates,
            meta: { total, page, limit },
        });
    }

    async findOne(id: string, userContext?: UserContext): Promise<CertificateDto> {
        await this.ensureCanAccessCertificate(id, userContext);
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
                // Removed reminders include - use findRemindersByCertificateId() instead for general Reminder system
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', id, certificate);

        return this.certificateMapper(certificate);
    }

    async update(
        id: string,
        updateCertificateDto: UpdateCertificateDto,
        updatedBy?: string,
        userContext?: UserContext,
    ): Promise<CertificateDto> {
        await this.ensureCanAccessCertificate(id, userContext);
        const existingCertificate = await this.prisma.certificate.findFirst({
            where: {
                id,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', id, existingCertificate);

        return this.errorHandler.safeExecute(async () => {
            let shouldUpdateReminders = false;

            if (updateCertificateDto.validityDate) {
                const newValidityDate = new Date(updateCertificateDto.validityDate);
                if (newValidityDate.getTime() !== existingCertificate.validityDate.getTime()) {
                    shouldUpdateReminders = true;
                }
            }

            if (updateCertificateDto.reminderDays !== undefined && updateCertificateDto.reminderDays !== existingCertificate.reminderDays) {
                shouldUpdateReminders = true;
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

            // Validate personnel if provided (non-empty)
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

            // Build sanitized update data: use relation inputs for category, department, personnel; scalars for the rest
            const raw = updateCertificateDto;
            const optionalNullables = (v: string | undefined) => (v === '' || v === undefined ? null : v);
            const updateData: Prisma.CertificateUpdateInput = {};

            if (raw.certificateNumber !== undefined) updateData.certificateNumber = raw.certificateNumber;
            if (raw.certificateName !== undefined) updateData.certificateName = raw.certificateName;
            if (raw.categoryId !== undefined) updateData.category = { connect: { id: raw.categoryId } };
            if (raw.issuedDate !== undefined) updateData.issuedDate = new Date(raw.issuedDate);
            if (raw.validityDate !== undefined) updateData.validityDate = new Date(raw.validityDate);
            if (raw.issuerName !== undefined) updateData.issuerName = raw.issuerName;
            if (raw.documentUrl !== undefined) updateData.documentUrl = optionalNullables(raw.documentUrl);
            if (raw.personnelId !== undefined) {
                const pid = optionalNullables(raw.personnelId);
                updateData.personnel = pid ? { connect: { id: pid } } : { disconnect: true };
            }
            if (raw.personnelName !== undefined) updateData.personnelName = optionalNullables(raw.personnelName);
            if (raw.equipmentId !== undefined) updateData.equipmentId = optionalNullables(raw.equipmentId);
            if (raw.equipmentName !== undefined) updateData.equipmentName = optionalNullables(raw.equipmentName);
            if (raw.departmentId !== undefined) updateData.department = { connect: { id: raw.departmentId } };
            if (raw.reminderDays !== undefined) updateData.reminderDays = raw.reminderDays;
            if (raw.notes !== undefined) updateData.notes = optionalNullables(raw.notes);
            if (raw.isActive !== undefined) updateData.isActive = raw.isActive;

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

            // If validity date or reminder days changed, recreate reminders
            if (shouldUpdateReminders && updatedBy) {
                try {
                    // 1. Cancel existing reminders for this certificate (except already cancelled)
                    await this.prisma.reminder.updateMany({
                        where: {
                            entity: 't_certificates',
                            entityId: id,
                            status: {
                                not: ReminderStatusEnum.CANCELLED,
                            },
                        },
                        data: {
                            status: ReminderStatusEnum.CANCELLED,
                        },
                    });

                    // 2. Create new chained reminders based on new dates
                    // Use updatedBy as fallback if createdBy user doesn't exist
                    const reminderTargetUser = updatedBy || updatedCertificate.createdBy;
                    await this.createChainedReminders(updatedCertificate, reminderTargetUser);
                } catch (reminderError) {
                    // Log error but don't fail the certificate update
                    console.error('Failed to update reminders for certificate:', id, reminderError);
                    // Certificate update was successful, reminder update failed
                    // This is non-critical, so we continue
                }
            }

            return this.certificateMapper(updatedCertificate);
        }, 'update certificate');
    }

    async remove(id: string, userContext?: UserContext): Promise<void> {
        await this.ensureCanAccessCertificate(id, userContext);
        const existingCertificate = await this.prisma.certificate.findFirst({
            where: {
                id,
                deletedAt: null,
            },
            include: {
                renewals: {
                    where: {
                        status: {
                            in: [
                                CertificateRenewalStatusEnum.PENDING,
                                CertificateRenewalStatusEnum.REQUESTED,
                                CertificateRenewalStatusEnum.IN_PROGRESS,
                            ],
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

    async findRenewalsByCertificateId(
        certificateId: string,
        userContext?: UserContext,
    ): Promise<CertificateRenewalDto[]> {
        await this.ensureCanAccessCertificate(certificateId, userContext);
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
        userContext?: UserContext,
    ): Promise<CertificateRenewalDto> {
        await this.ensureCanAccessCertificate(certificateId, userContext);
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
            if (updateRenewalDto.status === CertificateRenewalStatusEnum.COMPLETED && updateRenewalDto.newValidityDate) {
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

    async findRemindersByCertificateId(
        certificateId: string,
        userContext?: UserContext,
    ): Promise<CertificateReminderDto[]> {
        await this.ensureCanAccessCertificate(certificateId, userContext);
        const certificate = await this.prisma.certificate.findFirst({
            where: {
                id: certificateId,
                deletedAt: null,
            },
        });

        this.errorHandler.throwIfNotFoundById('Certificate', certificateId, certificate);

        // Fetch from general Reminder system instead of deprecated CertificateReminder
        const reminders = await this.prisma.reminder.findMany({
            where: {
                entity: 't_certificates',
                entityId: certificateId,
            },
            orderBy: {
                remindAt: 'desc',
            },
        });

        // Fetch recipients for USER type reminders
        const recipientIds = reminders
            .filter((r: any) => r.targetType === ReminderTargetTypeEnum.USER)
            .map((r: any) => r.targetId);

        const recipients = recipientIds.length > 0
            ? await this.prisma.user.findMany({
                where: {
                    id: { in: recipientIds },
                },
            })
            : [];

        const recipientMap = new Map(recipients.map((u: any) => [u.id, u]));

        // Map general Reminder to CertificateReminderDto structure to maintain frontend compatibility
        return reminders.map((reminder: any) => {
            // For USER type, use targetId as recipientId, otherwise use targetId (for future support of ROLE/DEPARTMENT)
            const recipientId = reminder.targetType === ReminderTargetTypeEnum.USER ? reminder.targetId : reminder.targetId;
            const recipient = reminder.targetType === ReminderTargetTypeEnum.USER ? recipientMap.get(reminder.targetId) : null;

            const certReminder = new CertificateReminderDto({
                id: reminder.id,
                certificateId: reminder.entityId ?? '',
                reminderDate: reminder.remindAt,
                isSent: reminder.status === ReminderStatusEnum.SENT,
                sentAt: reminder.lastSentAt,
                recipientId,
                recipient,
                createdAt: reminder.createdAt,
            });
            // Attach certificate object as it's expected by DTO but not strictly required by frontend list
            certReminder.certificate = certificate;
            return certReminder;
        });
    }
}

