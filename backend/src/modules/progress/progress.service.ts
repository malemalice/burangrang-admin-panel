import { Injectable, NotFoundException } from '@nestjs/common';
import { EnrollmentStatusEnum } from '@prisma/client';
import { PrismaService } from '../../core/prisma/prisma.service';
import { ProgressDto, ProgressStatus } from './dto/progress.dto';
import { UpdateProgressDto } from './dto/update-progress.dto';

@Injectable()
export class ProgressService {
  constructor(private prisma: PrismaService) {}

  async getProgress(enrollmentId: string, chapterId: string): Promise<ProgressDto> {
    const progress = await this.prisma.progress.findUnique({
      where: {
        enrollmentId_chapterId: {
          enrollmentId,
          chapterId,
        },
      },
    });

    if (!progress) {
      // Create new progress record if not exists
      return this.createInitialProgress(enrollmentId, chapterId);
    }

    // Update lastAccessedAt
    const updated = await this.prisma.progress.update({
      where: { id: progress!.id },
      data: { lastAccessedAt: new Date() },
    });

    return this.mapToDto(updated);
  }

  private mapToDto(progress: any): ProgressDto {
    return {
      id: progress.id,
      enrollmentId: progress.enrollmentId,
      chapterId: progress.chapterId,
      status: progress.status,
      timeSpent: progress.timeSpent,
      progress: Number(progress.progress),
      startedAt: progress.startedAt,
      completedAt: progress.completedAt,
      lastAccessedAt: progress.lastAccessedAt,
    };
  }

  async createInitialProgress(enrollmentId: string, chapterId: string): Promise<ProgressDto> {
    // Verify enrollment and chapter exist
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });
    if (!enrollment) throw new NotFoundException('Enrollment not found');

    const chapter = await this.prisma.chapter.findUnique({
      where: { id: chapterId },
    });
    if (!chapter) throw new NotFoundException('Chapter not found');

    const progress = await this.prisma.progress.create({
      data: {
        enrollmentId,
        chapterId,
        status: ProgressStatus.NOT_STARTED,
        progress: 0,
        timeSpent: 0,
        lastAccessedAt: new Date(),
      },
    });

    return this.mapToDto(progress);
  }

  async updateProgress(
    enrollmentId: string,
    chapterId: string,
    updateDto: UpdateProgressDto,
  ): Promise<ProgressDto> {
    let progress = await this.prisma.progress.findUnique({
      where: {
        enrollmentId_chapterId: {
          enrollmentId,
          chapterId,
        },
      },
    });

    if (!progress) {
      progress = await this.createInitialProgress(enrollmentId, chapterId) as any;
    }

    const data: any = {
      ...updateDto,
      lastAccessedAt: new Date(),
    };

    if (updateDto.status === ProgressStatus.IN_PROGRESS && !progress!.startedAt) {
      data.startedAt = new Date();
    }

    if (updateDto.status === ProgressStatus.COMPLETED && !progress!.completedAt) {
      data.completedAt = new Date();
      data.progress = 100; // Force 100% if completed
    }

    const updated = await this.prisma.progress.update({
      where: { id: progress!.id },
      data,
    });

    // Recalculate overall enrollment progress asynchronously
    this.recalculateEnrollmentProgress(enrollmentId);

    return this.mapToDto(updated);
  }

  async completeChapter(enrollmentId: string, chapterId: string): Promise<ProgressDto> {
    return this.updateProgress(enrollmentId, chapterId, {
      status: ProgressStatus.COMPLETED,
      progress: 100,
    });
  }

  private async recalculateEnrollmentProgress(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: { course: true },
    });

    if (!enrollment) return;

    const totalChapters = await this.prisma.chapter.count({
      where: {
        courseId: enrollment.courseId,
        isActive: true,
      },
    });

    if (totalChapters === 0) return;

    const progressRecords = await this.prisma.progress.findMany({
      where: { enrollmentId },
    });

    const totalProgressSum = progressRecords.reduce((sum, record) => {
      const p = Number(record.progress);
      return sum + (p > 100 ? 100 : p);
    }, 0);

    const overallProgress = Math.min(100, Math.round((totalProgressSum / totalChapters) * 100) / 100);

    const updateData: any = {
      progress: overallProgress,
    };

    if (overallProgress === 100 && enrollment.status !== EnrollmentStatusEnum.COMPLETED) {
      updateData.status = EnrollmentStatusEnum.COMPLETED;
      updateData.completedAt = new Date();
    } else if (enrollment.status === EnrollmentStatusEnum.INVITED) {
      updateData.status = EnrollmentStatusEnum.ACTIVE;
      if (!enrollment.enrolledAt) {
        updateData.enrolledAt = new Date();
      }
    }

    await this.prisma.enrollment.update({
      where: { id: enrollmentId },
      data: updateData,
    });
  }
}
