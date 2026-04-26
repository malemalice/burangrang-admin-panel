/**
 * Course seed data
 * Following TRD.md patterns for seed data
 */
import { Course, EnrollmentStatusEnum } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

/** Shared demo LMS assets (HSE playlist link is text-only — app embeds single video IDs only). */
export const LMS_SAMPLE_HSE_PLAYLIST_URL =
  'https://www.youtube.com/playlist?list=PLazxnOp16YC4FRUI5-RMw6YUjxLzdhmjn';
export const LMS_SAMPLE_YOUTUBE_VIDEO_ID = '_GAH8JGff8Y';
export const LMS_SAMPLE_YOUTUBE_WATCH_URL = `https://www.youtube.com/watch?v=${LMS_SAMPLE_YOUTUBE_VIDEO_ID}`;
export const LMS_SAMPLE_PDF_URL = 'https://pdfobject.com/pdf/sample.pdf';

function playlistSupplementParagraph(): string {
  return `<p>For more short K3 / HSE training videos, see the <a href="${LMS_SAMPLE_HSE_PLAYLIST_URL}" target="_blank" rel="noopener noreferrer">HSE Training playlist</a> on YouTube.</p>`;
}

type ChapterSeedDef = {
  title: string;
  description: string;
  duration: number;
  contentType: 'youtube' | 'pdf' | 'text';
  contentUrl?: string | null;
  youtubeVideoId?: string | null;
  content?: string | null;
};

const CHAPTERS_BY_SLUG: Record<string, ChapterSeedDef[]> = {
  'basic-safety-training': [
    {
      title: 'Course orientation & HSE video resources',
      description: 'How to use this course and where to find additional HSE training videos.',
      duration: 10,
      contentType: 'text',
      content: `<h2>Welcome</h2><p>This module orients you to basic workplace safety. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'Safety culture introduction (video)',
      description: 'Sample video lesson aligned with general safety awareness.',
      duration: 30,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
    },
    {
      title: 'Reference: safety briefing document (PDF)',
      description: 'Demonstration PDF viewer in the LMS (sample document).',
      duration: 20,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
    },
    {
      title: 'Hazards and controls overview (video)',
      description: 'Reinforcement lesson using the same demo video asset.',
      duration: 30,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_WATCH_URL,
    },
    {
      title: 'Summary and next steps',
      description: 'Key takeaways and where to continue learning.',
      duration: 30,
      contentType: 'text',
      content: `<p>Review the topics covered and discuss with your supervisor. ${playlistSupplementParagraph()}</p>`,
    },
  ],
  'fire-safety-prevention': [
    {
      title: 'Fire safety scope & resources',
      description: 'Objectives for fire prevention and the HSE video playlist.',
      duration: 10,
      contentType: 'text',
      content: `<p>Fire safety in the workplace. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'Fire prevention principles (video)',
      description: 'Demo video chapter for fire awareness context.',
      duration: 20,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
    },
    {
      title: 'Emergency procedures reference (PDF)',
      description: 'Sample PDF for reading evacuation and reporting concepts.',
      duration: 12,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
    },
    {
      title: 'Extinguisher concepts — PASS (video)',
      description: 'Video reinforcement (demo asset).',
      duration: 15,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
    },
    {
      title: 'Evacuation routes and drills (text)',
      description: 'Site-specific content placeholder; links to broader HSE materials.',
      duration: 18,
      contentType: 'text',
      content: `<p>Always follow your site’s evacuation plan and assembly points. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'Review checklist (PDF)',
      description: 'Sample document for end-of-module review.',
      duration: 15,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
    },
  ],
  'occupational-health-safety': [
    {
      title: 'OHS management systems overview',
      description: 'Framework for occupational health and safety.',
      duration: 22,
      contentType: 'text',
      content: `<p>Introduction to OHS systems and continuous improvement. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'Roles and responsibilities (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo video for leadership and worker roles.',
    },
    {
      title: 'Regulatory reference outline (PDF)',
      description: 'Sample reading material.',
      duration: 20,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
    },
    {
      title: 'Risk control hierarchy (video)',
      duration: 24,
      contentType: 'youtube',
      description: 'Elimination, substitution, engineering, admin, PPE.',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
    },
    {
      title: 'Worker participation & consultation',
      duration: 22,
      contentType: 'text',
      description: 'Communication and reporting in OHS.',
      content: `<p>Effective consultation reduces incidents. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'Incident learning (PDF)',
      duration: 24,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample PDF chapter.',
    },
    {
      title: 'Contractor and visitor safety (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_WATCH_URL,
      description: 'Demo asset.',
    },
    {
      title: 'Course wrap-up',
      duration: 20,
      contentType: 'text',
      description: 'Next steps for management system maturity.',
      content: `<p>Apply the plan-do-check-act cycle. ${playlistSupplementParagraph()}</p>`,
    },
  ],
  'first-aid-cpr': [
    {
      title: 'Scene safety and initial assessment',
      description: 'Assess the scene, use PPE, and call for help. First chapter for chapter-level quiz binding.',
      duration: 20,
      contentType: 'text',
      content: `<p>Ensure it is safe before helping. ${playlistSupplementParagraph()}</p>`,
    },
    {
      title: 'DRSABCD overview (video)',
      duration: 25,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo video; formal certification requires accredited training.',
    },
    {
      title: 'Bleeding and shock basics (PDF)',
      duration: 22,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample reference document.',
    },
    {
      title: 'CPR compression rate (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Reinforcement on compressions (demo).',
    },
    {
      title: 'AED and emergency services',
      duration: 20,
      contentType: 'text',
      content: `<p>Know AED locations and how to hand over to responders. ${playlistSupplementParagraph()}</p>`,
      description: 'Coordination with EMS.',
    },
    {
      title: 'Musculoskeletal injury awareness (PDF)',
      duration: 17,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample PDF.',
    },
    {
      title: 'Course summary',
      duration: 22,
      contentType: 'text',
      content: '<p>Practice skills regularly with qualified instructors.</p>',
      description: 'Recap.',
    },
  ],
  'environmental-management': [
    {
      title: 'Environmental aspects & impacts',
      duration: 24,
      contentType: 'text',
      content: `<p>Identify aspects that can affect the environment. ${playlistSupplementParagraph()}</p>`,
      description: 'EMS context.',
    },
    {
      title: 'Pollution prevention (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo video.',
    },
    {
      title: 'Permits and records (PDF)',
      duration: 22,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample document.',
    },
    {
      title: 'Waste segregation (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo asset.',
    },
    {
      title: 'Spill response awareness',
      duration: 24,
      contentType: 'text',
      content: `<p>Contain, report, and clean per procedure. ${playlistSupplementParagraph()}</p>`,
      description: 'Emergency response basics.',
    },
    {
      title: 'Review (PDF)',
      duration: 22,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample closing chapter.',
    },
  ],
  'hazard-identification-risk-assessment': [
    {
      title: 'What is a hazard?',
      duration: 20,
      contentType: 'text',
      content: `<p>Hazards vs risk; examples in typical workplaces. ${playlistSupplementParagraph()}</p>`,
      description: 'Foundation.',
    },
    {
      title: 'Observation techniques (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo video.',
    },
    {
      title: 'Risk matrix basics (PDF)',
      duration: 20,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample reading.',
    },
    {
      title: 'Likelihood and severity (video)',
      duration: 22,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Scoring concepts.',
    },
    {
      title: 'Control measures selection',
      duration: 22,
      contentType: 'text',
      content: `<p>Use the hierarchy of controls. ${playlistSupplementParagraph()}</p>`,
      description: 'Planning.',
    },
    {
      title: 'Job safety analysis outline (PDF)',
      duration: 24,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample PDF.',
    },
    {
      title: 'Toolbox meetings (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo.',
    },
    {
      title: 'Review and documentation',
      duration: 24,
      contentType: 'text',
      content: `<p>Keep records retrievable for audit. ${playlistSupplementParagraph()}</p>`,
      description: 'Documentation.',
    },
    {
      title: 'Final assessment prep (PDF)',
      duration: 20,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample chapter.',
    },
  ],
  'workplace-ergonomics': [
    {
      title: 'Ergonomics and musculoskeletal risk',
      duration: 18,
      contentType: 'text',
      content: `<p>Posture, load, repetition. ${playlistSupplementParagraph()}</p>`,
      description: 'Intro.',
    },
    {
      title: 'Workstation setup (video)',
      duration: 22,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Monitor and chair demo.',
    },
    {
      title: 'Stretching and micro-breaks (PDF)',
      duration: 20,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample reference.',
    },
    {
      title: 'Manual handling awareness (video)',
      duration: 22,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo.',
    },
    {
      title: 'Reporting discomfort',
      duration: 18,
      contentType: 'text',
      content: `<p>Early reporting prevents chronic injury. ${playlistSupplementParagraph()}</p>`,
      description: 'Close.',
    },
  ],
  'chemical-safety-handling': [
    {
      title: 'Chemical inventory and labeling',
      duration: 22,
      contentType: 'text',
      content: `<p>GHS labels and SDS availability. ${playlistSupplementParagraph()}</p>`,
      description: 'Intro.',
    },
    {
      title: 'Reading an SDS (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo asset for structure of SDS.',
    },
    {
      title: 'Storage compatibility (PDF)',
      duration: 22,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample PDF.',
    },
    {
      title: 'PPE for chemical tasks (video)',
      duration: 24,
      contentType: 'youtube',
      youtubeVideoId: LMS_SAMPLE_YOUTUBE_VIDEO_ID,
      description: 'Demo.',
    },
    {
      title: 'Spill and exposure response',
      duration: 24,
      contentType: 'text',
      content: `<p>Follow site EHS procedures and eyewash locations. ${playlistSupplementParagraph()}</p>`,
      description: 'Emergency.',
    },
    {
      title: 'Waste labeling (PDF)',
      duration: 22,
      contentType: 'pdf',
      contentUrl: LMS_SAMPLE_PDF_URL,
      description: 'Sample.',
    },
    {
      title: 'Course recap',
      duration: 22,
      contentType: 'text',
      content: '<p>Always substitute less hazardous materials when feasible.</p>',
      description: 'Outro.',
    },
  ],
};

const LMS_COURSE_SLUGS = Object.keys(CHAPTERS_BY_SLUG);

async function syncCourseChapterAggregates(courseId: string): Promise<void> {
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
  });
  const totalDuration = chapters.reduce((sum, ch) => sum + ch.duration, 0);
  await prisma.course.update({
    where: { id: courseId },
    data: {
      totalChapters: chapters.length,
      totalDuration,
    },
  });
}

async function seedChaptersForCourseIfEmpty(course: Course): Promise<void> {
  const defs = CHAPTERS_BY_SLUG[course.slug];
  if (!defs?.length) {
    return;
  }

  const existingCount = await prisma.chapter.count({
    where: { courseId: course.id },
  });

  if (existingCount > 0) {
    await syncCourseChapterAggregates(course.id);
    console.log(
      `⏭️  Chapters already exist for "${course.slug}" (${existingCount}), synced totals`,
    );
    return;
  }

  const publishedAt = new Date();
  for (let i = 0; i < defs.length; i++) {
    const d = defs[i];
    await prisma.chapter.create({
      data: {
        courseId: course.id,
        title: d.title,
        description: d.description,
        order: i + 1,
        duration: d.duration,
        contentType: d.contentType,
        contentUrl: d.contentUrl ?? null,
        youtubeVideoId: d.youtubeVideoId ?? null,
        content: d.content ?? null,
        isFree: false,
        isPublished: true,
        publishedAt,
        isActive: true,
      },
    });
  }

  await syncCourseChapterAggregates(course.id);
  console.log(`✅ Seeded ${defs.length} chapters for "${course.slug}"`);
}

async function seedAllLmsCourseChapters(): Promise<void> {
  const courses = await prisma.course.findMany({
    where: { slug: { in: LMS_COURSE_SLUGS } },
  });
  for (const c of courses) {
    await seedChaptersForCourseIfEmpty(c);
  }
}

function daysAgo(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d;
}

function daysFromNow(days: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

export const seedCourses = async () => {
  console.log('🌱 Seeding courses...');

  try {
    // Get or create course categories
    let safetyCategory = await prisma.courseCategory.findFirst({
      where: { slug: 'safety' },
    });

    if (!safetyCategory) {
      safetyCategory = await prisma.courseCategory.create({
        data: {
          name: 'Safety',
          slug: 'safety',
          description: 'Safety and health related courses',
          isActive: true,
        },
      });
      console.log('✅ Created course category: Safety');
    }

    let healthCategory = await prisma.courseCategory.findFirst({
      where: { slug: 'health' },
    });

    if (!healthCategory) {
      healthCategory = await prisma.courseCategory.create({
        data: {
          name: 'Health',
          slug: 'health',
          description: 'Health and wellness related courses',
          isActive: true,
        },
      });
      console.log('✅ Created course category: Health');
    }

    let environmentCategory = await prisma.courseCategory.findFirst({
      where: { slug: 'environment' },
    });

    if (!environmentCategory) {
      environmentCategory = await prisma.courseCategory.create({
        data: {
          name: 'Environment',
          slug: 'environment',
          description: 'Environmental management courses',
          isActive: true,
        },
      });
      console.log('✅ Created course category: Environment');
    }

    // Get instructor (use first admin or super admin user)
    const superAdminRole = await prisma.role.findFirst({
      where: { name: 'Super Admin' },
    });

    const adminRole = await prisma.role.findFirst({
      where: { name: 'Administrator' },
    });

    if (!superAdminRole && !adminRole) {
      console.log('⚠️  No admin roles found. Please run role seeds first.');
      return;
    }

    const roleIds = [superAdminRole?.id, adminRole?.id].filter(Boolean) as string[];

    const instructor = await prisma.user.findFirst({
      where: {
        roleId: {
          in: roleIds,
        },
        isActive: true,
      },
    });

    if (!instructor) {
      console.log('⚠️  No instructor found. Please create an admin user first.');
      return;
    }

    console.log(`📚 Using instructor: ${instructor.firstName} ${instructor.lastName}`);

    // Create courses
    const courses = [
      {
        title: 'Basic Safety Training',
        slug: 'basic-safety-training',
        description:
          'Comprehensive safety training covering workplace hazards, personal protective equipment, and emergency procedures.',
        shortDescription: 'Learn fundamental safety principles and practices',
        thumbnailUrl: null,
        totalChapters: 5,
        totalDuration: 120, // minutes — superseded after chapter seed by real sum
        rating: 4.5,
        reviewCount: 25,
        studentCount: 150,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Fire Safety and Prevention',
        slug: 'fire-safety-prevention',
        description:
          'Learn about fire hazards, prevention techniques, and proper use of fire extinguishers. Includes evacuation procedures and emergency response.',
        shortDescription: 'Master fire safety protocols and emergency response',
        thumbnailUrl: null,
        totalChapters: 6,
        totalDuration: 90,
        rating: 4.7,
        reviewCount: 18,
        studentCount: 120,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Occupational Health and Safety',
        slug: 'occupational-health-safety',
        description:
          'Advanced course on occupational health standards, risk assessment, and workplace safety management systems.',
        shortDescription: 'Advanced OHS management and compliance',
        thumbnailUrl: null,
        totalChapters: 8,
        totalDuration: 180,
        rating: 4.8,
        reviewCount: 32,
        studentCount: 200,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety', 'health'],
      },
      {
        title: 'First Aid and CPR',
        slug: 'first-aid-cpr',
        description:
          'Essential first aid techniques and CPR procedures. Learn how to respond to medical emergencies in the workplace.',
        shortDescription: 'Life-saving first aid and CPR skills',
        thumbnailUrl: null,
        totalChapters: 7,
        totalDuration: 150,
        rating: 4.9,
        reviewCount: 45,
        studentCount: 300,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['health', 'safety'],
      },
      {
        title: 'Environmental Management',
        slug: 'environmental-management',
        description:
          'Learn about environmental regulations, waste management, pollution control, and sustainable practices.',
        shortDescription: 'Environmental compliance and sustainability',
        thumbnailUrl: null,
        totalChapters: 6,
        totalDuration: 140,
        rating: 4.6,
        reviewCount: 20,
        studentCount: 100,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['environment'],
      },
      {
        title: 'Hazard Identification and Risk Assessment',
        slug: 'hazard-identification-risk-assessment',
        description:
          'Comprehensive guide to identifying workplace hazards and conducting effective risk assessments.',
        shortDescription: 'Master hazard identification and risk analysis',
        thumbnailUrl: null,
        totalChapters: 9,
        totalDuration: 200,
        rating: 4.7,
        reviewCount: 28,
        studentCount: 180,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Workplace Ergonomics',
        slug: 'workplace-ergonomics',
        description:
          'Learn how to design ergonomic workstations and prevent musculoskeletal disorders.',
        shortDescription: 'Optimize workplace design for health and productivity',
        thumbnailUrl: null,
        totalChapters: 5,
        totalDuration: 100,
        rating: 4.4,
        reviewCount: 15,
        studentCount: 90,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['health'],
      },
      {
        title: 'Chemical Safety and Handling',
        slug: 'chemical-safety-handling',
        description:
          'Safe handling, storage, and disposal of hazardous chemicals. Includes MSDS understanding and emergency procedures.',
        shortDescription: 'Safe chemical management and handling',
        thumbnailUrl: null,
        totalChapters: 7,
        totalDuration: 160,
        rating: 4.8,
        reviewCount: 22,
        studentCount: 140,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety', 'environment'],
      },
    ];

    const createdCourses: Course[] = [];

    for (const courseData of courses) {
      // Check if course already exists
      const existingCourse = await prisma.course.findUnique({
        where: { slug: courseData.slug },
      });

      if (existingCourse) {
        console.log(`⏭️  Course "${courseData.title}" already exists, skipping...`);
        createdCourses.push(existingCourse);
        continue;
      }

      // Get categories
      const categories: Array<{ id: string }> = [];
      if (courseData.categorySlugs.includes('safety') && safetyCategory) {
        categories.push({ id: safetyCategory.id });
      }
      if (courseData.categorySlugs.includes('health') && healthCategory) {
        categories.push({ id: healthCategory.id });
      }
      if (courseData.categorySlugs.includes('environment') && environmentCategory) {
        categories.push({ id: environmentCategory.id });
      }

      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          thumbnailUrl: courseData.thumbnailUrl,
          totalChapters: courseData.totalChapters,
          totalDuration: courseData.totalDuration,
          rating: courseData.rating,
          reviewCount: courseData.reviewCount,
          studentCount: courseData.studentCount,
          instructorId: instructor.id,
          publishedAt: courseData.publishedAt,
          isActive: courseData.isActive,
          categories: {
            connect: categories,
          },
        },
      });

      createdCourses.push(course);
      console.log(`✅ Created course: ${course.title}`);
    }

    // Chapters for all eight LMS courses (including pre-existing DB rows with no chapters)
    await seedAllLmsCourseChapters();

    // Seed enrollments for Admin Overview dashboard (LMS metrics)
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 10,
    });
    if (createdCourses.length > 0 && users.length > 0 && instructor) {
      const existingEnrollmentCount = await prisma.enrollment.count();
      if (existingEnrollmentCount < 20) {
        const enrollmentsToCreate: Array<{
          userId: string;
          courseId: string;
          status: EnrollmentStatusEnum;
          assignedBy: string;
          assignedAt: Date;
          dueDate: Date | null;
          completedAt: Date | null;
          progress: number;
          isRequired: boolean;
        }> = [];
        const courseIds = createdCourses.slice(0, 3).map((c) => c.id);
        // Overdue: dueDate in past, status not COMPLETED/CANCELLED/EXPIRED
        for (let i = 0; i < 4 && users[i]; i++) {
          enrollmentsToCreate.push({
            userId: users[i].id,
            courseId: courseIds[i % courseIds.length],
            status: EnrollmentStatusEnum.ACTIVE,
            assignedBy: instructor.id,
            assignedAt: daysAgo(30),
            dueDate: daysAgo(5),
            completedAt: null,
            progress: 0,
            isRequired: true,
          });
        }
        // Completed
        for (let i = 4; i < 10 && users[i % users.length]; i++) {
          enrollmentsToCreate.push({
            userId: users[i % users.length].id,
            courseId: courseIds[(i - 4) % courseIds.length],
            status: EnrollmentStatusEnum.COMPLETED,
            assignedBy: instructor.id,
            assignedAt: daysAgo(60),
            dueDate: daysFromNow(30),
            completedAt: daysAgo(10),
            progress: 100,
            isRequired: false,
          });
        }
        // Active with future due date
        for (let i = 2; i < 5; i++) {
          if (users[i]) {
            enrollmentsToCreate.push({
              userId: users[i].id,
              courseId: courseIds[i % courseIds.length],
              status: EnrollmentStatusEnum.ACTIVE,
              assignedBy: instructor.id,
              assignedAt: new Date(),
              dueDate: daysFromNow(14),
              completedAt: null,
              progress: 25,
              isRequired: true,
            });
          }
        }
        for (const enr of enrollmentsToCreate) {
          await prisma.enrollment.create({
            data: {
              ...enr,
              progress: enr.progress,
            },
          });
        }
        console.log(`✅ Created ${enrollmentsToCreate.length} enrollments for Admin Overview (LMS)`);
      }
    }

    console.log(`\n📊 Summary: Created ${createdCourses.length} courses`);
    return createdCourses;
  } catch (error) {
    console.error('❌ Error seeding courses:', error);
    throw error;
  }
};
