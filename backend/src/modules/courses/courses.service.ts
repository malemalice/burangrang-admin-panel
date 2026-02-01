import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { CourseDto } from './dto/course.dto';
import { FindCoursesOptions } from './dto/find-courses.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';
import { COURSE_STATUS } from './constants/course-status';

@Injectable()
export class CoursesService {
  private courseMapper: (course: any) => CourseDto;
  private courseArrayMapper: (courses: any[]) => CourseDto[];
  private coursePaginatedMapper: (data: { data: any[]; meta: any }) => { data: CourseDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
  ) {
    // Initialize mappers
    this.courseMapper = this.dtoMapper.createRelationMapper(CourseDto, {
      instructor: {
        mapper: (instructor: any) => ({
          id: instructor.id,
          firstName: instructor.firstName,
          lastName: instructor.lastName,
          email: instructor.email,
        }),
        isArray: false,
      },
      categories: {
        mapper: (category: any) => ({
          id: category.id,
          name: category.name,
          slug: category.slug,
        }),
        isArray: true,
      },
      studentCount: {
        mapper: (course: any) => {
          if (course._count && typeof course._count.enrollments === 'number') {
            return course._count.enrollments;
          }
          return course.studentCount || 0;
        },
        isArray: false,
      },
      chapters: {
        mapper: (chapter: any) => ({
          id: chapter.id,
          title: chapter.title,
          order: chapter.order,
          duration: chapter.duration,
          isPublished: chapter.isPublished,
        }),
        isArray: true,
      },
    });

    this.courseArrayMapper = this.dtoMapper.createArrayMapper(CourseDto);
    this.coursePaginatedMapper = this.dtoMapper.createPaginatedMapper(CourseDto);
  }

  async create(createCourseDto: CreateCourseDto, createdBy: string): Promise<CourseDto> {
    // Generate slug if not provided
    if (!createCourseDto.slug) {
      createCourseDto.slug = this.generateSlug(createCourseDto.title);
    }

    // Ensure slug is unique
    const existingCourse = await this.prisma.course.findUnique({
      where: { slug: createCourseDto.slug },
    });

    if (existingCourse) {
      createCourseDto.slug = await this.generateUniqueSlug(createCourseDto.slug);
    }

    const course = await this.prisma.course.create({
      data: {
        title: createCourseDto.title,
        slug: createCourseDto.slug,
        description: createCourseDto.description,
        shortDescription: createCourseDto.shortDescription,
        thumbnailUrl: createCourseDto.thumbnailUrl,
        difficulty: createCourseDto.difficulty || 'beginner',
        language: createCourseDto.language || 'en',
        instructorId: createCourseDto.instructorId,
        status: createCourseDto.status || 'draft',
        categories: createCourseDto.categoryIds ? {
          connect: createCourseDto.categoryIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        instructor: true,
        categories: true,
        chapters: {
          orderBy: { order: 'asc' }
        },
      },
    });

    // Log activity
    await this.activityLogger.logActivity(
      'COURSE_CREATED',
      course.id,
      `Created course: ${course.title}`,
      [], // roleIds - empty for now
      createdBy
    );

    return this.courseMapper(course);
  }

  async findAll(options?: FindCoursesOptions): Promise<{
    data: CourseDto[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isActive,
      isPublished,
      status,
      difficulty,
      instructorId,
      categoryId,
      language,
      search,
      title,
    } = options || {};

    const where: Prisma.CourseWhereInput = {};

    // Apply filters
    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }

    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { shortDescription: { contains: searchTerm, mode: 'insensitive' } },
          // Removed instructor search to prevent irrelevant matches and performance issues
          // Only search within course content
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (status) {
      where.status = status;
    }

    if (difficulty) {
      where.difficulty = difficulty;
    }

    if (instructorId) {
      where.instructorId = instructorId;
    }

    if (categoryId) {
      where.categories = {
        some: { id: categoryId }
      };
    }

    if (language) {
      where.language = language;
    }

    const [courses, total] = await Promise.all([
      this.prisma.course.findMany({
        where,
        include: {
          instructor: true,
          categories: true,
          chapters: {
            orderBy: { order: 'asc' }
          },
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.course.count({ where }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return {
      data: courses.map(course => this.courseMapper(course)),
      meta: { total, page, limit, pageCount },
    };
  }

  async findOne(id: string): Promise<CourseDto> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      include: {
        instructor: true,
        categories: true,
        chapters: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    this.errorHandler.throwIfNotFoundById('Course', id, course);

    return this.courseMapper(course);
  }

  async findBySlug(slug: string): Promise<CourseDto> {
    const course = await this.prisma.course.findUnique({
      where: { slug },
      include: {
        instructor: true,
        categories: true,
        chapters: {
          orderBy: { order: 'asc' }
        },
      },
    });

    this.errorHandler.throwIfNotFound('Course', `slug "${slug}"`, course);

    return this.courseMapper(course);
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, updatedBy: string): Promise<CourseDto> {
    // Check if course exists
    const existingCourse = await this.prisma.course.findUnique({
      where: { id },
    });

    this.errorHandler.throwIfNotFoundById('Course', id, existingCourse);

    // Handle slug update
    if (updateCourseDto.slug && updateCourseDto.slug !== existingCourse.slug) {
      const slugExists = await this.prisma.course.findUnique({
        where: { slug: updateCourseDto.slug },
      });

      if (slugExists) {
        updateCourseDto.slug = await this.generateUniqueSlug(updateCourseDto.slug);
      }
    }

    // Handle publishing
    if (updateCourseDto.isPublished === true && !existingCourse.isPublished) {
      updateCourseDto.publishedAt = new Date();
      updateCourseDto.status = COURSE_STATUS.PUBLISHED;
    } else if (updateCourseDto.isPublished === false && existingCourse.isPublished) {
      updateCourseDto.publishedAt = null;
      if (existingCourse.status === COURSE_STATUS.PUBLISHED) {
        updateCourseDto.status = COURSE_STATUS.DRAFT;
      }
    }

    const course = await this.prisma.course.update({
      where: { id },
      data: {
        title: updateCourseDto.title,
        slug: updateCourseDto.slug,
        description: updateCourseDto.description,
        shortDescription: updateCourseDto.shortDescription,
        thumbnailUrl: updateCourseDto.thumbnailUrl,
        difficulty: updateCourseDto.difficulty,
        language: updateCourseDto.language,
        instructorId: updateCourseDto.instructorId,
        status: updateCourseDto.status,
        isPublished: updateCourseDto.isPublished,
        publishedAt: updateCourseDto.publishedAt,
        isActive: updateCourseDto.isActive,
        categories: updateCourseDto.categoryIds ? {
          set: updateCourseDto.categoryIds.map(id => ({ id }))
        } : undefined,
      },
      include: {
        instructor: true,
        categories: true,
        chapters: {
          orderBy: { order: 'asc' }
        },
      },
    });

    // Log activity
    await this.activityLogger.logActivity(
      'COURSE_UPDATED',
      course.id,
      `Updated course: ${course.title}`,
      [], // roleIds - empty for now
      updatedBy
    );

    return this.courseMapper(course);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const course = await this.prisma.course.findUnique({
      where: { id },
      select: { id: true, title: true },
    });

    this.errorHandler.throwIfNotFoundById('Course', id, course);

    await this.prisma.course.delete({
      where: { id },
    });

    // Log activity
    await this.activityLogger.logActivity(
      'COURSE_DELETED',
      id,
      `Deleted course: ${course.title}`,
      [], // roleIds - empty for now
      deletedBy
    );
  }

  async getStats(): Promise<{
    total: number;
    published: number;
    draft: number;
    byDifficulty: { beginner: number; intermediate: number; advanced: number };
    byStatus: { draft: number; review: number; published: number; archived: number };
  }> {
    const [
      total,
      published,
      draft,
      beginner,
      intermediate,
      advanced,
      statusDraft,
      statusReview,
      statusPublished,
      statusArchived,
    ] = await Promise.all([
      this.prisma.course.count({ where: { isActive: true } }),
      this.prisma.course.count({ where: { isActive: true, isPublished: true } }),
      this.prisma.course.count({ where: { isActive: true, isPublished: false } }),
      this.prisma.course.count({ where: { isActive: true, difficulty: 'beginner' } }),
      this.prisma.course.count({ where: { isActive: true, difficulty: 'intermediate' } }),
      this.prisma.course.count({ where: { isActive: true, difficulty: 'advanced' } }),
      this.prisma.course.count({ where: { isActive: true, status: 'draft' } }),
      this.prisma.course.count({ where: { isActive: true, status: 'review' } }),
      this.prisma.course.count({ where: { isActive: true, status: 'published' } }),
      this.prisma.course.count({ where: { isActive: true, status: 'archived' } }),
    ]);

    return {
      total,
      published,
      draft,
      byDifficulty: { beginner, intermediate, advanced },
      byStatus: {
        draft: statusDraft,
        review: statusReview,
        published: statusPublished,
        archived: statusArchived
      },
    };
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  private async generateUniqueSlug(baseSlug: string): Promise<string> {
    let counter = 1;
    let uniqueSlug = `${baseSlug}-${counter}`;

    while (await this.prisma.course.findUnique({ where: { slug: uniqueSlug } })) {
      counter++;
      uniqueSlug = `${baseSlug}-${counter}`;
    }

    return uniqueSlug;
  }
}
