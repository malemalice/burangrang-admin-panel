import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../core/prisma/prisma.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { ChapterDto } from './dto/chapter.dto';
import { FindChaptersOptions } from './dto/find-chapters.dto';
import { Prisma } from '@prisma/client';
import { ErrorHandlingService } from '../../shared/services/error-handling.service';
import { DtoMapperService } from '../../shared/services/dto-mapper.service';
import { ActivityLoggerService } from '../../shared/services/activity-logger.service';

@Injectable()
export class ChaptersService {
  private readonly logger = new Logger(ChaptersService.name);
  private chapterMapper: (chapter: any) => ChapterDto;
  private chapterArrayMapper: (chapters: any[]) => ChapterDto[];
  private chapterPaginatedMapper: (data: { data: any[]; meta: any }) => { data: ChapterDto[]; meta: any };

  constructor(
    private prisma: PrismaService,
    private errorHandler: ErrorHandlingService,
    private dtoMapper: DtoMapperService,
    private activityLogger: ActivityLoggerService,
  ) {
    // Initialize mappers
    this.chapterMapper = this.dtoMapper.createRelationMapper(ChapterDto, {
      course: {
        mapper: (course: any) => ({
          id: course.id,
          title: course.title,
          slug: course.slug,
        }),
        isArray: false,
      },
    });

    this.chapterArrayMapper = this.dtoMapper.createArrayMapper(ChapterDto);
    this.chapterPaginatedMapper = this.dtoMapper.createPaginatedMapper(ChapterDto);
  }

  async create(createChapterDto: CreateChapterDto, createdBy: string): Promise<ChapterDto> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: createChapterDto.courseId },
    });

    this.errorHandler.throwIfNotFoundById('Course', createChapterDto.courseId, course);

    // Check if order already exists for this course
    const existingChapter = await this.prisma.chapter.findFirst({
      where: {
        courseId: createChapterDto.courseId,
        order: createChapterDto.order,
      },
    });

    if (existingChapter) {
      // Adjust order of existing chapters
      await this.adjustChapterOrders(createChapterDto.courseId, createChapterDto.order);
    }

    // Handle publishing
    let publishedAt: Date | null = null;
    if (createChapterDto.isPublished) {
      publishedAt = new Date();
    }

    const chapter = await this.prisma.chapter.create({
      data: {
        courseId: createChapterDto.courseId,
        title: createChapterDto.title,
        description: createChapterDto.description,
        order: createChapterDto.order,
        duration: createChapterDto.duration || 0,
        contentType: createChapterDto.contentType,
        contentUrl: createChapterDto.contentUrl,
        youtubeVideoId: createChapterDto.youtubeVideoId,
        content: createChapterDto.content,
        isFree: createChapterDto.isFree || false,
        isPublished: createChapterDto.isPublished || false,
        publishedAt,
      },
      include: {
        course: true,
      },
    });

    // Update course chapter count and total duration
    await this.updateCourseStats(createChapterDto.courseId);

    // Log activity
    await this.activityLogger.logActivity(
      'CHAPTER_CREATED',
      chapter.id,
      `Created chapter: ${chapter.title} for course: ${course.title}`,
      [], // roleIds - empty for now
      createdBy
    );

    return this.chapterMapper(chapter);
  }

  async findAll(options?: FindChaptersOptions): Promise<{
    data: ChapterDto[];
    meta: { total: number; page: number; limit: number; pageCount: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'order',
      sortOrder = 'asc',
      isActive,
      isPublished,
      isFree,
      contentType,
      courseId,
      search,
    } = options || {};

    const where: Prisma.ChapterWhereInput = {};

    // Apply filters
    if (search) {
      const searchTerm = search.trim();
      if (searchTerm.length > 0) {
        where.OR = [
          { title: { contains: searchTerm, mode: 'insensitive' } },
          { description: { contains: searchTerm, mode: 'insensitive' } },
          { content: { contains: searchTerm, mode: 'insensitive' } },
        ];
      }
    }

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (isFree !== undefined) {
      where.isFree = isFree;
    }

    if (contentType) {
      where.contentType = contentType;
    }

    if (courseId) {
      where.courseId = courseId;
    }

    const [chapters, total] = await Promise.all([
      this.prisma.chapter.findMany({
        where,
        include: {
          course: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.chapter.count({ where }),
    ]);

    const pageCount = Math.ceil(total / limit);

    return {
      data: chapters.map(chapter => this.chapterMapper(chapter)),
      meta: { total, page, limit, pageCount },
    };
  }

  async findByCourse(courseId: string): Promise<ChapterDto[]> {
    // Verify course exists
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    this.errorHandler.throwIfNotFoundById('Course', courseId, course);

    const chapters = await this.prisma.chapter.findMany({
      where: {
        courseId,
        isActive: true,
      },
      include: {
        course: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return chapters.map(chapter => this.chapterMapper(chapter));
  }

  async findPublishedByCourse(courseId: string): Promise<ChapterDto[]> {
    // Verify course exists and is active (not necessarily published)
    const course = await this.prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Course', courseId, course);

    const chapters = await this.prisma.chapter.findMany({
      where: {
        courseId,
        isActive: true,
        isPublished: true,
      },
      select: {
        id: true,
        courseId: true,
        title: true,
        order: true,
        duration: true,
        // Only include fields needed for curriculum display
        // Remove sensitive fields like contentUrl, youtubeVideoId, content, etc.
      },
      orderBy: {
        order: 'asc',
      },
    });

    return chapters.map(chapter => this.chapterMapper(chapter));
  }

  async findPurchasedCourseChapters(courseId: string, userId: string): Promise<ChapterDto[]> {
    // Verify course exists and is active
    const course = await this.prisma.course.findUnique({
      where: { 
        id: courseId,
        isActive: true,
      },
      include: {
        product: true
      }
    });

    this.errorHandler.throwIfNotFoundById('Course', courseId, course);

    // Verify user has purchased the course (check for FULFILLED order)
    const hasPurchased = await this.verifyUserCourseAccess(userId, courseId);
    
    if (!hasPurchased) {
      this.errorHandler.throwForbidden('You must purchase this course to access its content');
    }

    // Get all published chapters with full content for purchased users
    const chapters = await this.prisma.chapter.findMany({
      where: {
        courseId,
        isActive: true,
        isPublished: true,
      },
      orderBy: {
        order: 'asc',
      },
    });

    return chapters.map(chapter => this.chapterMapper(chapter));
  }

  private async verifyUserCourseAccess(userId: string, courseId: string): Promise<boolean> {
    try {
      // Check if user has an active enrollment for this course
      const enrollment = await this.prisma.enrollment.findFirst({
        where: {
          userId,
          courseId,
          status: 'ACTIVE',
        },
      });

      if (enrollment) {
        return true;
      }

      // Get the course with its associated product
      const course = await this.prisma.course.findUnique({
        where: { id: courseId },
        include: { product: true }
      });

      if (!course || !course.product) {
        return false;
      }

      // Check if user has a completed order for this course's product
      const order = await this.prisma.order.findFirst({
        where: {
          user: { id: userId },
          items: {
            some: {
              OR: [
                { productId: course.product.id },
                { courseId: course.id }
              ]
            }
          },
          status: 'completed' // Only completed orders grant access
        }
      });

      return !!order;
    } catch (error) {
      this.logger.error(`Error verifying user course access: ${error.message}`, error.stack);
      return false;
    }
  }

  async findOne(id: string): Promise<ChapterDto> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    this.errorHandler.throwIfNotFoundById('Chapter', id, chapter);

    return this.chapterMapper(chapter);
  }

  async update(id: string, updateChapterDto: UpdateChapterDto, updatedBy: string): Promise<ChapterDto> {
    // Check if chapter exists
    const existingChapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { course: true },
    });
    
    this.errorHandler.throwIfNotFoundById('Chapter', id, existingChapter);

    // Handle order change
    if (updateChapterDto.order && updateChapterDto.order !== existingChapter.order) {
      await this.reorderChapters(
        existingChapter.courseId,
        existingChapter.order,
        updateChapterDto.order
      );
    }

    // Handle publishing
    let publishedAt = existingChapter.publishedAt;
    if (updateChapterDto.isPublished === true && !existingChapter.isPublished) {
      publishedAt = new Date();
    } else if (updateChapterDto.isPublished === false && existingChapter.isPublished) {
      publishedAt = null;
    }

    const chapter = await this.prisma.chapter.update({
      where: { id },
      data: {
        courseId: updateChapterDto.courseId,
        title: updateChapterDto.title,
        description: updateChapterDto.description,
        order: updateChapterDto.order,
        duration: updateChapterDto.duration,
        contentType: updateChapterDto.contentType,
        contentUrl: updateChapterDto.contentUrl,
        youtubeVideoId: updateChapterDto.youtubeVideoId,
        content: updateChapterDto.content,
        isFree: updateChapterDto.isFree,
        isPublished: updateChapterDto.isPublished,
        publishedAt,
        isActive: updateChapterDto.isActive,
      },
      include: {
        course: true,
      },
    });

    // Update course stats if course changed or duration changed
    if (updateChapterDto.courseId && updateChapterDto.courseId !== existingChapter.courseId) {
      await this.updateCourseStats(existingChapter.courseId);
      await this.updateCourseStats(updateChapterDto.courseId);
    } else {
      await this.updateCourseStats(chapter.courseId);
    }

    // Log activity
    await this.activityLogger.logActivity(
      'CHAPTER_UPDATED',
      chapter.id,
      `Updated chapter: ${chapter.title} for course: ${chapter.course.title}`,
      [], // roleIds - empty for now
      updatedBy
    );

    return this.chapterMapper(chapter);
  }

  async remove(id: string, deletedBy: string): Promise<void> {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { course: true },
    });

    this.errorHandler.throwIfNotFoundById('Chapter', id, chapter);

    await this.prisma.chapter.delete({
      where: { id },
    });

    // Reorder remaining chapters
    await this.reorderAfterDeletion(chapter.courseId, chapter.order);

    // Update course stats
    await this.updateCourseStats(chapter.courseId);

    // Log activity
    await this.activityLogger.logActivity(
      'CHAPTER_DELETED',
      id,
      `Deleted chapter: ${chapter.title} from course: ${chapter.course.title}`,
      [], // roleIds - empty for now
      deletedBy
    );
  }

  async reorderChapters(courseId: string, fromOrder: number, toOrder: number): Promise<void> {
    if (fromOrder === toOrder) return;

    if (fromOrder < toOrder) {
      // Moving down: decrease order of chapters in between
      await this.prisma.chapter.updateMany({
        where: {
          courseId,
          order: {
            gt: fromOrder,
            lte: toOrder,
          },
        },
        data: {
          order: {
            decrement: 1,
          },
        },
      });
    } else {
      // Moving up: increase order of chapters in between
      await this.prisma.chapter.updateMany({
        where: {
          courseId,
          order: {
            gte: toOrder,
            lt: fromOrder,
          },
        },
        data: {
          order: {
            increment: 1,
          },
        },
      });
    }
  }

  private async adjustChapterOrders(courseId: string, insertOrder: number): Promise<void> {
    // Increment order of all chapters at or after the insert position
    await this.prisma.chapter.updateMany({
      where: {
        courseId,
        order: {
          gte: insertOrder,
        },
      },
      data: {
        order: {
          increment: 1,
        },
      },
    });
  }

  private async reorderAfterDeletion(courseId: string, deletedOrder: number): Promise<void> {
    // Decrement order of all chapters after the deleted chapter
    await this.prisma.chapter.updateMany({
      where: {
        courseId,
        order: {
          gt: deletedOrder,
        },
      },
      data: {
        order: {
          decrement: 1,
        },
      },
    });
  }

  private async updateCourseStats(courseId: string): Promise<void> {
    const stats = await this.prisma.chapter.aggregate({
      where: {
        courseId,
        isActive: true,
      },
      _count: true,
      _sum: {
        duration: true,
      },
    });

    await this.prisma.course.update({
      where: { id: courseId },
      data: {
        totalChapters: stats._count,
        totalDuration: stats._sum.duration || 0,
      },
    });
  }
}
