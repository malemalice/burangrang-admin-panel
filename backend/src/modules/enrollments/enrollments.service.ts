import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { NotificationsService } from '../notifications/services/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AssignEnrollmentDto } from './dto/assign-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';
import { Role } from '../../shared/types/role.enum';

@Injectable()
export class EnrollmentsService {
  private enrollmentMapper: (enrollment: any) => EnrollmentDto;
  private enrollmentArrayMapper: (enrollments: any[]) => EnrollmentDto[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly notificationsService: NotificationsService,
    private readonly mailService: MailService,
  ) {
    // Initialize mappers with relations
    this.enrollmentMapper = this.dtoMapper.createRelationMapper(EnrollmentDto, {
      user: {
        mapper: (user: any) => ({
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
        }),
        isArray: false,
      },
      course: {
        mapper: (course: any) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
          thumbnailUrl: course.thumbnailUrl,
        }),
        isArray: false,
      },
      assigner: {
        mapper: (assigner: any) => ({
          id: assigner.id,
          firstName: assigner.firstName,
          lastName: assigner.lastName,
          email: assigner.email,
        }),
        isArray: false,
      },
    });
    this.enrollmentArrayMapper = this.dtoMapper.createArrayMapper(EnrollmentDto);
  }

  async create(createEnrollmentDto: CreateEnrollmentDto, userId: string): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      const { courseId } = createEnrollmentDto;

      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      this.errorHandler.throwIfNotFoundById('Course', courseId, course);

      // Check if user has an ACTIVE enrollment (allow re-enrollment after completion)
      const activeEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          status: 'ACTIVE', // Only check for active enrollments
        },
      });

      if (activeEnrollment) {
        this.errorHandler.throwConflictCustom('User already has an active enrollment in this course');
      }

      // Auto-complete any previous COMPLETED enrollments (for tracking history)
      await this.prisma.enrollment.updateMany({
        where: {
          userId,
          courseId,
          status: 'COMPLETED',
        },
        data: {
          completedAt: new Date(),
        },
      });

      // Create new enrollment (allows retakes)
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'ACTIVE',
          enrolledAt: new Date(),
          progress: 0,
        },
      });

      return this.enrollmentMapper(enrollment);
    }, 'Creating enrollment');
  }

  async getUserEnrollments(userId: string): Promise<EnrollmentDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        orderBy: { enrolledAt: 'desc' },
      });

      return enrollments.map(enrollment => this.enrollmentMapper(enrollment));
    }, 'Getting user enrollments');
  }

  async assignCourse(assignDto: AssignEnrollmentDto, assignedBy: string): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      const { userId, courseId, dueDate, isRequired = false, notes, sendEmail = true } = assignDto;

      // Check if course exists
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      this.errorHandler.throwIfNotFoundById('Course', courseId, course);

      // Check if user exists
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      // Check if user already has an ACTIVE or INVITED enrollment for this course
      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          status: {
            in: ['ACTIVE', 'INVITED'],
          },
        },
      });

      if (existingEnrollment) {
        this.errorHandler.throwConflictCustom('User already has an active or invited enrollment in this course');
      }

      // Create enrollment with INVITED status
      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: 'INVITED',
          assignedBy,
          assignedAt: new Date(),
          dueDate: dueDate ? new Date(dueDate) : null,
          isRequired,
          notes: notes || null,
          progress: 0,
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      // Send notification if requested
      if (sendEmail) {
        try {
          // Get or create notification type
          let notificationType = await this.prisma.notificationType.findFirst({
            where: { name: 'COURSE_ENROLLMENT' },
          });

          if (!notificationType) {
            notificationType = await this.prisma.notificationType.create({
              data: {
                name: 'COURSE_ENROLLMENT',
                description: 'Course enrollment assignments',
              },
            });
          }

          // Create notification
          await this.notificationsService.createNotificationForRoles(
            {
              title: `Course Assignment: ${course.title}`,
              message: `You have been assigned to the course "${course.title}". ${notes ? `Notes: ${notes}` : ''}`,
              context: 'enrollment',
              contextId: enrollment.id,
              typeId: notificationType.id,
              roleIds: [user.roleId],
              userIds: [userId],
            },
            assignedBy,
          );

          // Send email notification using MailService
          const emailResult = await this.mailService.sendTemplatedMailWithResult({
            template: 'course-assignment',
            email: user.email,
            context: {
              userName: `${user.firstName} ${user.lastName}`,
              courseTitle: course.title,
              courseSlug: course.slug,
              dueDate: dueDate ? new Date(dueDate).toLocaleDateString() : null,
              notes: notes || null,
              enrollmentId: enrollment.id,
              isRequired: isRequired ? 'Yes' : 'No',
            },
          });

          if (!emailResult.success) {
            if (emailResult.skipped) {
              console.warn(
                `Email notification skipped for ${user.email}: ${emailResult.error}`,
              );
            } else {
              console.error(
                `Failed to send email to ${user.email}: ${emailResult.error}`,
              );
            }
          } else if (emailResult.skipped) {
            console.warn(
              `Email notification SKIPPED for ${user.email} (SMTP not configured) - Check server logs for details`,
            );
          } else {
            console.log(
              `Email notification sent successfully to ${user.email} for course "${course.title}"`,
            );
          }
        } catch (error) {
          // Log error but don't fail enrollment creation
          console.error('Failed to send notification:', error);
        }
      }

      return this.enrollmentMapper(enrollment);
    }, 'Assigning course');
  }

  async findAll(
    params: FindEnrollmentsDto,
    currentUserId: string,
    currentUserRole: string,
  ): Promise<PaginatedResponse<EnrollmentDto>> {
    return this.errorHandler.safeExecute(async () => {
      const {
        page = 1,
        limit = 10,
        search,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        courseId,
        userId,
        status,
        assignedBy,
      } = params;

      const pageNum = Math.max(1, typeof page === 'string' ? parseInt(page, 10) || 1 : page || 1);
      const limitNum = Math.max(1, Math.min(100, typeof limit === 'string' ? parseInt(limit, 10) || 10 : limit || 10));

      // Build where clause
      const where: any = {};

      // Role-based filtering: non-admin users can only see their own enrollments
      if (currentUserRole !== Role.ADMIN && currentUserRole !== Role.SUPER_ADMIN) {
        where.userId = currentUserId;
      }

      // Apply filters
      if (courseId) {
        where.courseId = courseId;
      }

      if (userId && (currentUserRole === Role.ADMIN || currentUserRole === Role.SUPER_ADMIN)) {
        where.userId = userId;
      }

      if (status) {
        where.status = status;
      }

      if (assignedBy && (currentUserRole === Role.ADMIN || currentUserRole === Role.SUPER_ADMIN)) {
        where.assignedBy = assignedBy;
      }

      // Search functionality - improved to match full words or exact substrings
      if (search) {
        const searchTerm = search.trim();
        where.OR = [
          {
            course: {
              title: {
                contains: searchTerm,
                mode: 'insensitive',
              },
            },
          },
          {
            user: {
              OR: [
                {
                  firstName: {
                    startsWith: searchTerm,
                    mode: 'insensitive',
                  },
                },
                {
                  lastName: {
                    startsWith: searchTerm,
                    mode: 'insensitive',
                  },
                },
                {
                  email: {
                    startsWith: searchTerm,
                    mode: 'insensitive',
                  },
                },
              ],
            },
          },
        ];
      }

      // Get total count
      const total = await this.prisma.enrollment.count({ where });

      // Get enrollments with relations
      const enrollments = await this.prisma.enrollment.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (pageNum - 1) * limitNum,
        take: limitNum,
      });

      return {
        data: enrollments.map(enrollment => this.enrollmentMapper(enrollment)),
        meta: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
        },
      };
    }, 'Finding all enrollments');
  }

  async update(
    id: string,
    updateDto: UpdateEnrollmentDto,
    userId: string,
    userRole: string,
  ): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      // Get enrollment
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.errorHandler.throwIfNotFoundById('Enrollment', id, enrollment);

      // Check permission: user can only update their own enrollment, admin can update any
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN && enrollment.userId !== userId) {
        this.errorHandler.throwForbidden('You can only update your own enrollments');
      }

      // Prepare update data
      const updateData: any = {};

      if (updateDto.status !== undefined) {
        updateData.status = updateDto.status;
        // Set completedAt if status is COMPLETED
        if (updateDto.status === 'COMPLETED' && !enrollment.completedAt) {
          updateData.completedAt = new Date();
        }
      }

      if (updateDto.dueDate !== undefined) {
        updateData.dueDate = updateDto.dueDate ? new Date(updateDto.dueDate) : null;
      }

      if (updateDto.notes !== undefined) {
        updateData.notes = updateDto.notes || null;
      }

      // Update enrollment
      const updatedEnrollment = await this.prisma.enrollment.update({
        where: { id },
        data: updateData,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      return this.enrollmentMapper(updatedEnrollment);
    }, 'Updating enrollment');
  }

  async findOne(id: string, userId: string, userRole?: string): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      // Build where clause
      const where: any = { id };

      // Non-admin users can only access their own enrollments
      if (userRole !== Role.ADMIN && userRole !== Role.SUPER_ADMIN) {
        where.userId = userId;
      }

      const enrollment = await this.prisma.enrollment.findFirst({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          course: {
            select: {
              id: true,
              title: true,
              slug: true,
              thumbnailUrl: true,
            },
          },
          assigner: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      this.errorHandler.throwIfNotFoundById('Enrollment', id, enrollment);

      return this.enrollmentMapper(enrollment);
    }, 'Finding enrollment');
  }
}
