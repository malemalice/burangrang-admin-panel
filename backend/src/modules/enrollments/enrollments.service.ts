import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { EnrollmentDto } from './dto/enrollment.dto';

@Injectable()
export class EnrollmentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly errorHandler: ErrorHandlingService,
    private readonly dtoMapper: DtoMapperService,
  ) {}

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
        throw new ConflictException('User already has an active enrollment in this course');
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

      return this.dtoMapper.mapToDto(EnrollmentDto, enrollment);
    }, 'Creating enrollment');
  }

  async getUserEnrollments(userId: string): Promise<EnrollmentDto[]> {
    return this.errorHandler.safeExecute(async () => {
      const enrollments = await this.prisma.enrollment.findMany({
        where: { userId },
        orderBy: { enrolledAt: 'desc' },
      });

      return enrollments.map(enrollment => 
        this.dtoMapper.mapToDto(EnrollmentDto, enrollment)
      );
    }, 'Getting user enrollments');
  }

  async findOne(id: string, userId: string): Promise<EnrollmentDto> {
    return this.errorHandler.safeExecute(async () => {
      const enrollment = await this.prisma.enrollment.findFirst({
        where: { 
          id,
          userId, // Ensure user can only access their own enrollments
        },
      });

      this.errorHandler.throwIfNotFoundById('Enrollment', id, enrollment);

      return this.dtoMapper.mapToDto(EnrollmentDto, enrollment);
    }, 'Finding enrollment');
  }
}
