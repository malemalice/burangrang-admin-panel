import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { CreateGuestWorkerDto } from './dto/create-guest-worker.dto';
import { CreateWorkPermitWorkerDto } from './dto/create-work-permit-worker.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDto } from './dto/user.dto';
import { FindUsersOptions } from './dto/find-users.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';
import { MailService } from '../mail/mail.service';
import { Role } from '../../shared/types/role.enum';
import { ROLE_CODES } from '../../shared/constants/role-codes';
import { WorkPermitWorkerProfileResponseDto } from './dto/work-permit-worker-profile.dto';
import { UpdateWorkerDocumentsDto } from './dto/update-worker-documents.dto';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);
  private userMapper: (user: any) => UserDto;
  private userArrayMapper: (users: any[]) => UserDto[];
  private userPaginatedMapper: (data: { data: any[]; meta: any }) => { data: UserDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
    private mailService: MailService,
    private config: ConfigService,
  ) {
    // Initialize mappers with password exclusion
    this.userMapper = this.dtoMapper.createMapper(UserDto, {
      exclude: ['password'],
    });
    this.userArrayMapper = this.dtoMapper.createArrayMapper(UserDto, {
      exclude: ['password'],
    });
    this.userPaginatedMapper = this.dtoMapper.createPaginatedMapper(UserDto, {
      exclude: ['password'],
    });
  }

  async create(createUserDto: CreateUserDto, createdBy: string): Promise<UserDto> {
    const hashedPassword = await this.errorHandler.safeHashPassword(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      () => bcrypt.hash(createUserDto.password, 10),
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          ...createUserDto,
          password: hashedPassword,
        },
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
          company: true,
        },
      });

      // Log user creation activity
      await this.activityLogger.logUserActivity('create', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }, createdBy);

      // Send "user created" email (fire-and-forget; do not fail create if email fails)
      const loginUrl =
        (this.config.get<string>('app.frontendUrl') || 'http://localhost:5173') +
        '/login';
      const name =
        `${user.firstName} ${user.lastName}`.trim() || user.email;
      try {
        await this.mailService.sendUserCreatedEmail({
          email: user.email,
          name,
          loginUrl,
        });
      } catch (err) {
        this.logger.warn(
          `Failed to send user-created email to ${user.email}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }

      return this.userMapper(user);
    } catch (error: any) {
      // Handle Prisma unique constraint error for email
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async createGuestWorker(
    dto: CreateGuestWorkerDto,
    createdBy: string,
  ): Promise<UserDto> {
    const guestRole = await this.prisma.role.findFirst({
      where: { code: 'GUEST' },
    });
    if (!guestRole) {
      throw new BadRequestException('Guest role not found');
    }
    const defaultOffice = await this.prisma.office.findFirst({
      where: { isActive: true },
    });
    if (!defaultOffice) {
      throw new BadRequestException('No active office found');
    }
    const randomPassword = crypto.randomBytes(16).toString('base64');
    const hashedPassword = await this.errorHandler.safeHashPassword(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      () => bcrypt.hash(randomPassword, 10),
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
          roleId: guestRole.id,
          officeId: defaultOffice.id,
          companyId: dto.companyId,
          isActive: true,
        },
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
          company: true,
        },
      });

      await this.prisma.worker.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      await this.activityLogger.logUserActivity('create', {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
      }, createdBy);

      // Skip welcome email for guest workers (random password not shared; user can use Forgot password)
      return this.userMapper(user);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async createWorkPermitWorker(
    dto: CreateWorkPermitWorkerDto,
    createdBy: string,
    requester: { role: string; companyId: string | null },
  ): Promise<UserDto> {
    const contractorRole = await this.prisma.role.findFirst({
      where: { code: ROLE_CODES.CONTRACTOR },
    });
    if (!contractorRole) {
      throw new BadRequestException('Contractor role not found');
    }
    const defaultOffice = await this.prisma.office.findFirst({
      where: { isActive: true },
    });
    if (!defaultOffice) {
      throw new BadRequestException('No active office found');
    }

    let resolvedCompanyId: string | undefined;
    if (requester.role === (Role.SUPER_ADMIN as string)) {
      if (!dto.companyId) {
        throw new BadRequestException('companyId is required for Super Admin');
      }
      resolvedCompanyId = dto.companyId;
    } else {
      if (!requester.companyId) {
        throw new BadRequestException(
          'Only users associated with a company can create workers',
        );
      }
      resolvedCompanyId = requester.companyId;
    }

    const randomPassword = crypto.randomBytes(16).toString('base64');
    const hashedPassword = await this.errorHandler.safeHashPassword(
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      () => bcrypt.hash(randomPassword, 10),
    );

    if (dto.professionId) {
      const prof = await this.prisma.profession.findFirst({
        where: { id: dto.professionId, isActive: true },
      });
      if (!prof) {
        throw new BadRequestException('Profession not found or inactive');
      }
    }

    try {
      const user = await this.prisma.user.create({
        data: {
          email: dto.email,
          firstName: dto.firstName,
          lastName: dto.lastName,
          password: hashedPassword,
          roleId: contractorRole.id,
          officeId: defaultOffice.id,
          companyId: resolvedCompanyId,
          isActive: true,
          ...(dto.professionId ? { professionId: dto.professionId } : {}),
          ...(dto.idNumber !== undefined && dto.idNumber !== null
            ? { idNumber: dto.idNumber.trim() || null }
            : {}),
        },
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
          company: true,
          profession: true,
        },
      });

      await this.prisma.worker.upsert({
        where: { userId: user.id },
        create: { userId: user.id },
        update: {},
      });

      await this.activityLogger.logUserActivity(
        'create',
        {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        },
        createdBy,
      );

      return this.userMapper(user);
    } catch (error: any) {
      if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findAll(
    options?: FindUsersOptions,
    requester?: { role: string; companyId: string | null },
  ): Promise<{
    data: UserDto[];
    meta: { total: number; page: number; limit: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      search,
      roleId,
      roleCode,
      officeId,
      departmentId,
      jobPositionId,
      companyId: companyIdFromQuery,
    } = options || {};

    let companyId = companyIdFromQuery;

    if (requester) {
      if (requester.role !== (Role.SUPER_ADMIN as string)) {
        if (!requester.companyId) {
          return {
            data: [],
            meta: { total: 0, page, limit },
          };
        }
        companyId = requester.companyId;
      }
    }

    const where: Prisma.UserWhereInput = {};

    if (search) {
      // Use contains for full keyword search (matches anywhere in the text)
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { firstName: { contains: searchTerm, mode: 'insensitive' } },
          { lastName: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (roleId) {
      where.roleId = roleId;
    }

    if (roleCode) {
      where.role = { code: roleCode };
    }

    if (officeId) {
      where.officeId = officeId;
    }

    if (departmentId) {
      where.departmentId = departmentId;
    }

    if (jobPositionId) {
      where.jobPositionId = jobPositionId;
    }

    if (companyId) {
      where.companyId = companyId;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        include: {
          role: true,
          office: true,
          department: true,
          jobPosition: true,
          company: true,
          profession: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count({ where }),
    ]);

    return this.userPaginatedMapper({
      data: users,
      meta: { total, page, limit },
    });
  }

  async findOne(id: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: {
        role: { include: { permissions: { select: { name: true } } } },
        office: true,
        department: true,
        jobPosition: true,
        company: true,
        profession: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('User', id, user);

    const dto = this.userMapper(user);
    const permissions =
      user.role?.permissions?.map((p: { name: string }) => p.name) ?? [];
    return { ...dto, permissions, roleName: dto.roleName } as UserDto;
  }

  async getWorkPermitWorkerProfile(
    targetUserId: string,
    requester: { role: string; requesterUserId: string },
  ): Promise<WorkPermitWorkerProfileResponseDto> {
    const requesterUser =
      requester.role === (Role.SUPER_ADMIN as string)
        ? null
        : await this.prisma.user.findUnique({
            where: { id: requester.requesterUserId },
            select: { id: true, companyId: true },
          });
    if (requester.role !== (Role.SUPER_ADMIN as string)) {
      this.errorHandler.throwIfNotFoundById(
        'User',
        requester.requesterUserId,
        requesterUser,
      );
    }
    const requesterCompanyId =
      requester.role === (Role.SUPER_ADMIN as string)
        ? null
        : (requesterUser?.companyId ?? null);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, companyId: true },
    });
    this.errorHandler.throwIfNotFoundById('User', targetUserId, targetUser);

    if (requester.role !== (Role.SUPER_ADMIN as string)) {
      if (
        !requesterCompanyId ||
        targetUser.companyId !== requesterCompanyId
      ) {
        throw new ForbiddenException(
          'You can only view workers from your company',
        );
      }
    }

    const where: Prisma.WorkPermitWorkerWhereInput = {
      worker: { userId: targetUserId },
    };
    if (requester.role !== (Role.SUPER_ADMIN as string)) {
      where.workPermit = { companyId: requesterCompanyId! };
    }

    const rows = await this.prisma.workPermitWorker.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        worker: {
          include: {
            healthScreenings: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: {
                quiz: { select: { id: true, title: true } },
              },
            },
          },
        },
        workPermit: {
          select: {
            id: true,
            code: true,
            projectName: true,
            status: true,
            company: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const user = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      include: {
        role: { include: { permissions: { select: { name: true } } } },
        office: true,
        department: true,
        jobPosition: true,
        company: true,
        profession: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('User', targetUserId, user);

    const dto = this.userMapper(user);
    const permissions =
      user.role?.permissions?.map((p: { name: string }) => p.name) ?? [];
    const userOut = { ...dto, permissions, roleName: dto.roleName } as UserDto;

    const workerRow = await this.prisma.worker.findUnique({
      where: { userId: targetUserId },
      select: {
        certificateUrl: true,
        healthDeclarationUrl: true,
        healthScreenings: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          where:
            requester.role === (Role.SUPER_ADMIN as string)
              ? undefined
              : { companyId: requesterCompanyId! },
          include: {
            quiz: { select: { id: true, title: true } },
          },
        },
      },
    });

    const latestHealthScreening = workerRow?.healthScreenings?.[0]
      ? {
          id: workerRow.healthScreenings[0].id,
          status: workerRow.healthScreenings[0].status,
          quizId: workerRow.healthScreenings[0].quizId,
          quiz: workerRow.healthScreenings[0].quiz
            ? {
                id: workerRow.healthScreenings[0].quiz.id,
                title: workerRow.healthScreenings[0].quiz.title,
              }
            : undefined,
        }
      : null;

    const assignments = rows.map((r) => {
      const wr = r.worker;
      const hs = wr?.healthScreenings?.[0];
      return {
        id: r.id,
        order: r.order,
        createdAt: r.createdAt,
        idNumber: user.idNumber,
        certificateUrl: wr?.certificateUrl ?? null,
        healthDeclarationUrl: wr?.healthDeclarationUrl ?? null,
        profession: user.profession
          ? {
              id: user.profession.id,
              name: user.profession.name,
              code: user.profession.code,
            }
          : undefined,
        workPermit: {
          id: r.workPermit.id,
          code: r.workPermit.code,
          projectName: r.workPermit.projectName,
          status: r.workPermit.status,
          company: r.workPermit.company
            ? {
                id: r.workPermit.company.id,
                name: r.workPermit.company.name,
                code: r.workPermit.company.code,
              }
            : undefined,
        },
        healthScreening: hs
          ? {
              id: hs.id,
              status: hs.status,
              quizId: hs.quizId,
              quiz: hs.quiz
                ? {
                    id: hs.quiz.id,
                    title: hs.quiz.title,
                  }
                : undefined,
            }
          : null,
      };
    });

    return {
      user: userOut,
      latestHealthScreening,
      workerDocuments: {
        certificateUrl: workerRow?.certificateUrl ?? null,
        healthDeclarationUrl: workerRow?.healthDeclarationUrl ?? null,
      },
      assignments,
    };
  }

  /**
   * Updates `t_worker` document fields for a user (e.g. certificate URL).
   * Authorization matches {@link getWorkPermitWorkerProfile} (same company, or Super Admin).
   */
  async updateWorkerDocuments(
    targetUserId: string,
    dto: UpdateWorkerDocumentsDto,
    requester: { role: string; requesterUserId: string },
  ): Promise<{ certificateUrl: string | null }> {
    const requesterUser =
      requester.role === (Role.SUPER_ADMIN as string)
        ? null
        : await this.prisma.user.findUnique({
            where: { id: requester.requesterUserId },
            select: { id: true, companyId: true },
          });
    if (requester.role !== (Role.SUPER_ADMIN as string)) {
      this.errorHandler.throwIfNotFoundById(
        'User',
        requester.requesterUserId,
        requesterUser,
      );
    }
    const requesterCompanyId =
      requester.role === (Role.SUPER_ADMIN as string)
        ? null
        : (requesterUser?.companyId ?? null);

    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
      select: { id: true, companyId: true },
    });
    this.errorHandler.throwIfNotFoundById('User', targetUserId, targetUser);

    if (requester.role !== (Role.SUPER_ADMIN as string)) {
      if (
        !requesterCompanyId ||
        targetUser.companyId !== requesterCompanyId
      ) {
        throw new ForbiddenException(
          'You can only update worker documents for users in your company',
        );
      }
    }

    if (dto.certificateUrl === undefined) {
      const existing = await this.prisma.worker.findUnique({
        where: { userId: targetUserId },
      });
      return { certificateUrl: existing?.certificateUrl ?? null };
    }

    const normalized =
      dto.certificateUrl === null || String(dto.certificateUrl).trim() === ''
        ? null
        : String(dto.certificateUrl).trim();

    const worker = await this.prisma.worker.upsert({
      where: { userId: targetUserId },
      create: {
        userId: targetUserId,
        certificateUrl: normalized,
      },
      update: {
        certificateUrl: normalized,
      },
    });

    return { certificateUrl: worker.certificateUrl ?? null };
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('User', id, existingUser);

    const data = { ...updateUserDto };

    if (updateUserDto.password) {
      data.password = await this.errorHandler.safeHashPassword(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
        () => bcrypt.hash(updateUserDto.password, 10),
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data,
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
        company: true,
        profession: true,
      },
    });

    return this.userMapper(updatedUser);
  }

  async remove(id: string): Promise<void> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('User', id, existingUser);

    await this.prisma.user.delete({
      where: { id },
    });
  }

  async findByEmail(email: string): Promise<UserDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    return user ? this.userMapper(user) : null;
  }

  async findByEmailOrThrow(email: string): Promise<UserDto> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    this.errorHandler.throwIfNotFoundByField('User', 'email', email, user);

    return this.userMapper(user);
  }

  async updateProfile(userId: string, updateProfileDto: UpdateProfileDto): Promise<UserDto> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, existingUser);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        firstName: updateProfileDto.firstName,
        lastName: updateProfileDto.lastName,
      },
      include: {
        role: true,
        office: true,
        department: true,
        jobPosition: true,
      },
    });

    // Log profile update activity
    await this.activityLogger.logUserActivity('update', {
      id: updatedUser.id,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      email: updatedUser.email,
    }, userId);

    return this.userMapper(updatedUser);
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<{ message: string }> {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    this.errorHandler.throwIfNotFoundById('User', userId, existingUser);

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      existingUser.password,
    );

    if (!isCurrentPasswordValid) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await this.errorHandler.safeHashPassword(
      () => bcrypt.hash(changePasswordDto.newPassword, 10),
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    // Log password change activity
    await this.activityLogger.logUserActivity('update', {
      id: existingUser.id,
      firstName: existingUser.firstName,
      lastName: existingUser.lastName,
      email: existingUser.email,
    }, userId);

    return { message: 'Password changed successfully' };
  }
}
