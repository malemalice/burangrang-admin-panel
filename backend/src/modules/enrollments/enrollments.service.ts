import { Injectable } from '@nestjs/common';
import { EnrollmentStatusEnum, QuizAttemptStatusEnum } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { DataScopeService } from '../../shared/services/data-scope.service';
import { UserContext } from '../../shared/types/user-context';
import { NotificationsService } from '../notifications/services/notifications.service';
import { MailService } from '../mail/mail.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { AssignEnrollmentDto } from './dto/assign-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { FindEnrollmentsDto } from './dto/find-enrollments.dto';
import { EnrollmentDto } from './dto/enrollment.dto';
import { PaginatedResponse } from '../../shared/types/pagination-params';

@Injectable()
export class EnrollmentsService {
  private enrollmentMapper: (enrollment: any) => EnrollmentDto;
  private enrollmentArrayMapper: (enrollments: any[]) => EnrollmentDto[];

  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
    private readonly dataScopeService: DataScopeService,
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
          status: EnrollmentStatusEnum.ACTIVE,
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

  async assignCourse(assignDto: AssignEnrollmentDto, assignedBy: string): Promise<{
    enrollment: EnrollmentDto;
    emailStatus: 'sent' | 'skipped' | 'failed' | 'not_requested';
    emailMessage?: string;
  }> {
    return this.errorHandler.safeExecute(async () => {
      const { userId, courseId, dueDate, isRequired = false, notes, sendEmail = true } = assignDto;

      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
      });

      this.errorHandler.throwIfNotFoundById('Course', courseId, course);

      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      this.errorHandler.throwIfNotFoundById('User', userId, user);

      const existingEnrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          status: {
            in: [EnrollmentStatusEnum.ACTIVE, EnrollmentStatusEnum.INVITED],
          },
        },
      });

      if (existingEnrollment) {
        this.errorHandler.throwConflictCustom('User already has an active or invited enrollment in this course');
      }

      const enrollment = await this.prisma.enrollment.create({
        data: {
          userId,
          courseId,
          status: EnrollmentStatusEnum.INVITED,
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

      let emailStatus: 'sent' | 'skipped' | 'failed' | 'not_requested' = 'not_requested';
      let emailMessage: string | undefined;

      if (sendEmail) {
        try {
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

          if (emailResult.success && !emailResult.skipped) {
            emailStatus = 'sent';
          } else if (emailResult.skipped) {
            emailStatus = 'skipped';
            emailMessage = 'SMTP not configured - email notification was skipped';
          } else {
            emailStatus = 'failed';
            emailMessage = emailResult.error;
          }
        } catch (error) {
          emailStatus = 'failed';
          emailMessage = String(error);
          console.error('Failed to send notification:', error);
        }
      }

      return {
        enrollment: this.enrollmentMapper(enrollment),
        emailStatus,
        emailMessage,
      };
    }, 'Assigning course');
  }

  async findAll(
    params: FindEnrollmentsDto,
    userContext: UserContext | undefined,
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

      // Apply filters
      if (courseId) {
        where.courseId = courseId;
      }

      if (userId) {
        where.userId = userId;
      }

      if (status) {
        where.status = status;
      }

      if (assignedBy) {
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

      // Data-level scope: hide rows user is not allowed to see
      const scopeWhere = this.dataScopeService.buildWhereForList(userContext, 'Enrollment', where);
      const finalWhere =
        scopeWhere && Object.keys(scopeWhere).length > 0
          ? { AND: [where, scopeWhere] }
          : where;

      // Get total count
      const total = await this.prisma.enrollment.count({ where: finalWhere });

      // Get enrollments with relations
      const enrollments = await this.prisma.enrollment.findMany({
        where: finalWhere,
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

  async updateScore(enrollmentId: string): Promise<void> {
    // Get all completed quiz attempts for this enrollment
    const attempts = await this.prisma.quizAttempt.findMany({
      where: {
        enrollmentId,
        status: QuizAttemptStatusEnum.COMPLETED,
      },
      orderBy: {
        score: 'desc',
      },
    });

    if (attempts.length === 0) return;

    // Calculate average score from all completed attempts
    // Or use highest score - depends on business requirement
    const totalScore = attempts.reduce((sum, a) => sum + Number(a.score || 0), 0);
    const averageScore = totalScore / attempts.length;

    // Update enrollment score
    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: { score: averageScore },
    });
  }

  async update(
    id: string,
    updateDto: UpdateEnrollmentDto,
    userContext: UserContext | undefined,
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
              departmentId: true,
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

      // Data-level access: deny if user cannot access this record
      const recordForCheck = {
        ...enrollment,
        user: enrollment.user ? { departmentId: enrollment.user.departmentId } : undefined,
      };
      if (!this.dataScopeService.canAccessRecord(userContext, 'Enrollment', recordForCheck)) {
        this.errorHandler.throwForbidden('You do not have access to this record');
      }

      // Prepare update data
      const updateData: any = {};

      if (updateDto.status !== undefined) {
        updateData.status = updateDto.status;
        // Set completedAt if status is COMPLETED
        if (updateDto.status === EnrollmentStatusEnum.COMPLETED && !enrollment.completedAt) {
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

  async findOne(id: string, userContext: UserContext | undefined): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              departmentId: true,
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

      // Data-level access: deny if user cannot access this record
      const recordForCheck = {
        ...enrollment,
        user: enrollment.user ? { departmentId: enrollment.user.departmentId } : undefined,
      };
      if (!this.dataScopeService.canAccessRecord(userContext, 'Enrollment', recordForCheck)) {
        this.errorHandler.throwForbidden('You do not have access to this record');
      }

      return this.enrollmentMapper(enrollment);
    }, 'Finding enrollment');
  }

  async getLearningContext(id: string, userContext: UserContext | undefined): Promise<any> {
    return this.errorHandler.safeExecute(async () => {
      // Get enrollment with basic course info (no chapters yet)
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              departmentId: true,
            },
          },
          course: true, // Get course to check instructor
          progressRecords: true,
        },
      });

      this.errorHandler.throwIfNotFoundById('Enrollment', id, enrollment);

      // Data-level access: deny if user cannot access this record
      const recordForCheck = {
        ...enrollment,
        user: enrollment.user ? { departmentId: enrollment.user.departmentId } : undefined,
      };
      if (!this.dataScopeService.canAccessRecord(userContext, 'Enrollment', recordForCheck)) {
        this.errorHandler.throwForbidden('You do not have access to this record');
      }

      // Fetch chapters separately
      // Based on feedback: if course is published, all active chapters should be visible.
      // We rely on 'isActive' status and remove 'isPublished' filter for chapters.
      const chapters = await this.prisma.chapter.findMany({
        where: {
          courseId: enrollment.courseId,
          isActive: true,
        },
        orderBy: {
          order: 'asc',
        },
      });

      // Attach chapters to course object
      const courseWithChapters = {
        ...enrollment.course,
        chapters,
      };

      // Determine visibility for quizzes
      const canViewDrafts =
        userContext?.dataLevel === 'SUPER' ||
        enrollment.course.instructorId === userContext?.userId;

      // Fetch quizzes (both course-level and chapter-level)
      const chapterIds = courseWithChapters.chapters.map(ch => ch.id);

      const quizzes = await this.prisma.quiz.findMany({
        where: {
          OR: [
            { entity: 'COURSE', entityId: enrollment.courseId },
            { entity: 'CHAPTER', entityId: { in: chapterIds } }
          ],
          isActive: true,
          ...(canViewDrafts ? {} : { isPublished: true }),
        },
        orderBy: {
          createdAt: 'asc', // Or order if available
        },
      });

      return {
        enrollment: this.enrollmentMapper(enrollment),
        course: courseWithChapters,
        quizzes,
        progress: enrollment.progressRecords,
      };
    }, 'Getting learning context');
  }
}
