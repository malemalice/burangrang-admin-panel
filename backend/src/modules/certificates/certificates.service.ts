import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import { UpdateCertificateDto } from './dto/update-certificate.dto';
import { CertificateDto } from './dto/certificate.dto';
import { FindCertificatesDto } from './dto/find-certificates.dto';
import { RemindersService } from '../reminders/reminders.service';
import { ReminderRepeatTypeEnum } from '../reminders/dto/reminder.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { Prisma } from '@prisma/client';

@Injectable()
export class CertificatesService {
  private certificateMapper: (entity: any) => CertificateDto;

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly remindersService: RemindersService,
  ) {
    this.certificateMapper = this.dtoMapper.createRelationMapper(CertificateDto, {
      category: {
        mapper: (category: any) => ({
          id: category.id,
          name: category.name,
          code: category.code,
          certificateType: category.certificateType,
        }),
        isArray: false,
      },
      department: {
        mapper: (department: any) => ({
          id: department.id,
          name: department.name,
          code: department.code,
        }),
        isArray: false,
      },
      personnel: {
        mapper: (personnel: any) => ({
          id: personnel.id,
          firstName: personnel.firstName,
          lastName: personnel.lastName,
          email: personnel.email,
        }),
        isArray: false,
      },
    });
  }

  /**
   * Register certificate reminder based on H day rules
   * - H day > 30 days → MONTHLY reminder
   * - H day <= 30 days && H day >= 1 day → WEEKLY reminder
   * - H day < 1 day → DAILY reminder
   */
  async registerCertificateReminder(certificateId: string, userId: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const certificate = await this.prisma.certificate.findUnique({
        where: { id: certificateId },
      });

      this.errorHandler.throwIfNotFoundById('Certificate', certificateId, certificate);

      // Determine recipient: use personnelId if available, otherwise use createdBy
      const recipientId = certificate.personnelId || certificate.createdBy;

      const now = new Date();
      const validityDate = new Date(certificate.validityDate);

      // Calculate H day (days remaining until expiry)
      const hDay = Math.ceil((validityDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      // Determine repeat type based on H day
      let repeatType: ReminderRepeatTypeEnum;
      if (hDay > 30) {
        repeatType = ReminderRepeatTypeEnum.MONTHLY;
      } else if (hDay >= 1) {
        repeatType = ReminderRepeatTypeEnum.WEEKLY;
      } else {
        // H day < 1 (expired or expiring today)
        repeatType = ReminderRepeatTypeEnum.DAILY;
      }

      // Calculate first reminder date: validityDate - reminderDays
      // If that date is in the past, start immediately
      const remindAt = new Date(validityDate);
      remindAt.setDate(remindAt.getDate() - certificate.reminderDays);

      // If remindAt is in the past, start from now
      const finalRemindAt = remindAt < now ? now : remindAt;

      // Cancel existing reminders for this certificate
      await this.cancelExistingReminders(certificateId);

      // Create reminder
      await this.remindersService.create(
        {
          entity: 't_certificates',
          entityId: certificateId,
          message: `Certificate "${certificate.certificateName}" (${certificate.certificateNumber}) will expire on ${validityDate.toLocaleDateString()}`,
          remindAt: finalRemindAt.toISOString(),
          repeatType,
          repeatUntil: validityDate.toISOString(),
        },
        recipientId,
      );
    }, 'Registering certificate reminder');
  }

  /**
   * Cancel existing reminders for a certificate
   */
  private async cancelExistingReminders(certificateId: string): Promise<void> {
    await this.prisma.reminder.updateMany({
      where: {
        entity: 't_certificates',
        entityId: certificateId,
        status: 'PENDING',
      },
      data: {
        status: 'CANCELLED',
      },
    });
  }

  /**
   * Create a new certificate
   */
  async create(createDto: CreateCertificateDto, createdBy: string): Promise<CertificateDto> {
    return this.errorHandler.safeExecute(async () => {
      // Validate category exists
      const category = await this.prisma.certificateCategory.findUnique({
        where: { id: createDto.categoryId },
      });
      this.errorHandler.throwIfNotFoundById('CertificateCategory', createDto.categoryId, category);

      // Validate department exists
      const department = await this.prisma.department.findUnique({
        where: { id: createDto.departmentId },
      });
      this.errorHandler.throwIfNotFoundById('Department', createDto.departmentId, department);

      // Validate personnel if provided
      if (createDto.personnelId) {
        const personnel = await this.prisma.user.findUnique({
          where: { id: createDto.personnelId },
        });
        this.errorHandler.throwIfNotFoundById('User', createDto.personnelId, personnel);
      }

      // Validate dates
      const issuedDate = new Date(createDto.issuedDate);
      const validityDate = new Date(createDto.validityDate);

      if (validityDate <= issuedDate) {
        throw new Error('Validity date must be after issued date');
      }

      const certificate = await this.prisma.certificate.create({
        data: {
          certificateNumber: createDto.certificateNumber,
          certificateName: createDto.certificateName,
          categoryId: createDto.categoryId,
          certificateType: createDto.certificateType,
          issuedDate,
          validityDate,
          issuerName: createDto.issuerName,
          documentUrl: createDto.documentUrl,
          personnelId: createDto.personnelId,
          personnelName: createDto.personnelName,
          equipmentId: createDto.equipmentId,
          equipmentName: createDto.equipmentName,
          departmentId: createDto.departmentId,
          reminderDays: createDto.reminderDays || 30,
          notes: createDto.notes,
          createdBy,
        },
        include: {
          category: true,
          department: true,
          personnel: true,
        },
      });

      // Register reminder automatically
      const recipientId = certificate.personnelId || certificate.createdBy;
      await this.registerCertificateReminder(certificate.id, recipientId);

      return this.certificateMapper(certificate);
    }, 'Creating certificate');
  }

  /**
   * Get all certificates with pagination and filtering
   */
  async findAll(params: FindCertificatesDto): Promise<PaginatedResponse<CertificateDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'validityDate',
        sortOrder = 'asc',
        certificateType,
        departmentId,
        isActive,
      } = params;

      const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1);
      const limitNum = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10));

      const where: Prisma.CertificateWhereInput = {};

      if (isActive !== undefined) {
        where.isActive = isActive;
      }

      if (certificateType) {
        where.certificateType = certificateType as any;
      }

      if (departmentId) {
        where.departmentId = departmentId;
      }

      if (search) {
        where.OR = [
          { certificateNumber: { contains: search, mode: 'insensitive' } },
          { certificateName: { contains: search, mode: 'insensitive' } },
          { personnelName: { contains: search, mode: 'insensitive' } },
          { equipmentName: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Validate sortBy field to prevent SQL injection
      const allowedSortFields = [
        'validityDate',
        'issuedDate',
        'certificateNumber',
        'certificateName',
        'createdAt',
        'updatedAt',
      ];
      const finalSortBy = allowedSortFields.includes(sortBy || '') ? sortBy : 'validityDate';
      const finalSortOrder = sortOrder === 'desc' ? 'desc' : 'asc';

      const total = await this.prisma.certificate.count({ where });

      const certificates = await this.prisma.certificate.findMany({
        where,
        orderBy: { [finalSortBy]: finalSortOrder },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
        include: {
          category: true,
          department: true,
          personnel: true,
        },
      });

      return {
        data: certificates.map(this.certificateMapper),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }, 'Fetching certificates');
  }

  /**
   * Get a single certificate by ID
   */
  async findOne(id: string): Promise<CertificateDto> {
    return this.errorHandler.safeExecute(async () => {
      const certificate = await this.prisma.certificate.findUnique({
        where: { id },
        include: {
          category: true,
          department: true,
          personnel: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Certificate', id, certificate);

      return this.certificateMapper(certificate);
    }, 'Fetching certificate');
  }

  /**
   * Update a certificate
   */
  async update(id: string, updateDto: UpdateCertificateDto, userId: string): Promise<CertificateDto> {
    return this.errorHandler.safeExecute(async () => {
      const existing = await this.prisma.certificate.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Certificate', id, existing);

      // Validate category if provided
      if (updateDto.categoryId) {
        const category = await this.prisma.certificateCategory.findUnique({
          where: { id: updateDto.categoryId },
        });
        this.errorHandler.throwIfNotFoundById('CertificateCategory', updateDto.categoryId, category);
      }

      // Validate department if provided
      if (updateDto.departmentId) {
        const department = await this.prisma.department.findUnique({
          where: { id: updateDto.departmentId },
        });
        this.errorHandler.throwIfNotFoundById('Department', updateDto.departmentId, department);
      }

      // Validate personnel if provided
      if (updateDto.personnelId) {
        const personnel = await this.prisma.user.findUnique({
          where: { id: updateDto.personnelId },
        });
        this.errorHandler.throwIfNotFoundById('User', updateDto.personnelId, personnel);
      }

      // Prepare update data
      const updateData: any = {};

      if (updateDto.certificateNumber !== undefined) updateData.certificateNumber = updateDto.certificateNumber;
      if (updateDto.certificateName !== undefined) updateData.certificateName = updateDto.certificateName;
      if (updateDto.categoryId !== undefined) updateData.categoryId = updateDto.categoryId;
      if (updateDto.certificateType !== undefined) updateData.certificateType = updateDto.certificateType;
      if (updateDto.issuedDate !== undefined) updateData.issuedDate = new Date(updateDto.issuedDate);
      if (updateDto.validityDate !== undefined) updateData.validityDate = new Date(updateDto.validityDate);
      if (updateDto.issuerName !== undefined) updateData.issuerName = updateDto.issuerName;
      if (updateDto.documentUrl !== undefined) updateData.documentUrl = updateDto.documentUrl;
      if (updateDto.personnelId !== undefined) updateData.personnelId = updateDto.personnelId;
      if (updateDto.personnelName !== undefined) updateData.personnelName = updateDto.personnelName;
      if (updateDto.equipmentId !== undefined) updateData.equipmentId = updateDto.equipmentId;
      if (updateDto.equipmentName !== undefined) updateData.equipmentName = updateDto.equipmentName;
      if (updateDto.departmentId !== undefined) updateData.departmentId = updateDto.departmentId;
      if (updateDto.reminderDays !== undefined) updateData.reminderDays = updateDto.reminderDays;
      if (updateDto.notes !== undefined) updateData.notes = updateDto.notes;
      if (updateDto.isActive !== undefined) updateData.isActive = updateDto.isActive;

      // Validate dates if both are being updated
      if (updateData.issuedDate && updateData.validityDate) {
        if (updateData.validityDate <= updateData.issuedDate) {
          throw new Error('Validity date must be after issued date');
        }
      } else if (updateData.validityDate) {
        const currentIssuedDate = new Date(existing.issuedDate);
        if (updateData.validityDate <= currentIssuedDate) {
          throw new Error('Validity date must be after issued date');
        }
      } else if (updateData.issuedDate) {
        const currentValidityDate = new Date(existing.validityDate);
        if (currentValidityDate <= updateData.issuedDate) {
          throw new Error('Validity date must be after issued date');
        }
      }

      const certificate = await this.prisma.certificate.update({
        where: { id },
        data: updateData,
        include: {
          category: true,
          department: true,
          personnel: true,
        },
      });

      // Re-register reminder if validityDate or reminderDays changed
      if (updateDto.validityDate !== undefined || updateDto.reminderDays !== undefined) {
        const recipientId = certificate.personnelId || certificate.createdBy;
        await this.registerCertificateReminder(certificate.id, recipientId);
      }

      return this.certificateMapper(certificate);
    }, 'Updating certificate');
  }

  /**
   * Delete a certificate (soft delete)
   */
  async remove(id: string): Promise<void> {
    return this.errorHandler.safeExecute(async () => {
      const existing = await this.prisma.certificate.findUnique({
        where: { id },
      });

      this.errorHandler.throwIfNotFoundById('Certificate', id, existing);

      // Cancel existing reminders
      await this.cancelExistingReminders(id);

      // Soft delete
      await this.prisma.certificate.update({
        where: { id },
        data: { isActive: false },
      });
    }, 'Deleting certificate');
  }
}
