/**
 * Course seed data
 * Following TRD.md patterns for seed data
 */
import { PrismaClient, Course, EnrollmentStatusEnum } from '@prisma/client';

const prisma = new PrismaClient();

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

    // Clear existing courses (optional - comment out if you want to keep existing courses)
    // await prisma.chapter.deleteMany();
    // await prisma.enrollment.deleteMany();
    // await prisma.course.deleteMany();

    // Create courses
    const courses = [
      {
        title: 'Basic Safety Training',
        slug: 'basic-safety-training',
        description: 'Comprehensive safety training covering workplace hazards, personal protective equipment, and emergency procedures.',
        shortDescription: 'Learn fundamental safety principles and practices',
        thumbnailUrl: null,
        totalChapters: 5,
        totalDuration: 120, // minutes
        difficulty: 'beginner',
        language: 'en',
        rating: 4.5,
        reviewCount: 25,
        studentCount: 150,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Fire Safety and Prevention',
        slug: 'fire-safety-prevention',
        description: 'Learn about fire hazards, prevention techniques, and proper use of fire extinguishers. Includes evacuation procedures and emergency response.',
        shortDescription: 'Master fire safety protocols and emergency response',
        thumbnailUrl: null,
        totalChapters: 6,
        totalDuration: 90,
        difficulty: 'beginner',
        language: 'en',
        rating: 4.7,
        reviewCount: 18,
        studentCount: 120,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Occupational Health and Safety',
        slug: 'occupational-health-safety',
        description: 'Advanced course on occupational health standards, risk assessment, and workplace safety management systems.',
        shortDescription: 'Advanced OHS management and compliance',
        thumbnailUrl: null,
        totalChapters: 8,
        totalDuration: 180,
        difficulty: 'intermediate',
        language: 'en',
        rating: 4.8,
        reviewCount: 32,
        studentCount: 200,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety', 'health'],
      },
      {
        title: 'First Aid and CPR',
        slug: 'first-aid-cpr',
        description: 'Essential first aid techniques and CPR procedures. Learn how to respond to medical emergencies in the workplace.',
        shortDescription: 'Life-saving first aid and CPR skills',
        thumbnailUrl: null,
        totalChapters: 7,
        totalDuration: 150,
        difficulty: 'beginner',
        language: 'en',
        rating: 4.9,
        reviewCount: 45,
        studentCount: 300,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['health', 'safety'],
      },
      {
        title: 'Environmental Management',
        slug: 'environmental-management',
        description: 'Learn about environmental regulations, waste management, pollution control, and sustainable practices.',
        shortDescription: 'Environmental compliance and sustainability',
        thumbnailUrl: null,
        totalChapters: 6,
        totalDuration: 140,
        difficulty: 'intermediate',
        language: 'en',
        rating: 4.6,
        reviewCount: 20,
        studentCount: 100,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['environment'],
      },
      {
        title: 'Hazard Identification and Risk Assessment',
        slug: 'hazard-identification-risk-assessment',
        description: 'Comprehensive guide to identifying workplace hazards and conducting effective risk assessments.',
        shortDescription: 'Master hazard identification and risk analysis',
        thumbnailUrl: null,
        totalChapters: 9,
        totalDuration: 200,
        difficulty: 'advanced',
        language: 'en',
        rating: 4.7,
        reviewCount: 28,
        studentCount: 180,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['safety'],
      },
      {
        title: 'Workplace Ergonomics',
        slug: 'workplace-ergonomics',
        description: 'Learn how to design ergonomic workstations and prevent musculoskeletal disorders.',
        shortDescription: 'Optimize workplace design for health and productivity',
        thumbnailUrl: null,
        totalChapters: 5,
        totalDuration: 100,
        difficulty: 'beginner',
        language: 'en',
        rating: 4.4,
        reviewCount: 15,
        studentCount: 90,
        status: 'published',
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        categorySlugs: ['health'],
      },
      {
        title: 'Chemical Safety and Handling',
        slug: 'chemical-safety-handling',
        description: 'Safe handling, storage, and disposal of hazardous chemicals. Includes MSDS understanding and emergency procedures.',
        shortDescription: 'Safe chemical management and handling',
        thumbnailUrl: null,
        totalChapters: 7,
        totalDuration: 160,
        difficulty: 'intermediate',
        language: 'en',
        rating: 4.8,
        reviewCount: 22,
        studentCount: 140,
        status: 'published',
        isPublished: true,
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
          difficulty: courseData.difficulty,
          language: courseData.language,
          rating: courseData.rating,
          reviewCount: courseData.reviewCount,
          studentCount: courseData.studentCount,
          instructorId: instructor.id,
          status: courseData.status,
          isPublished: courseData.isPublished,
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

    // Seed enrollments for Admin Overview dashboard (LMS metrics)
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 10,
    });
    if (createdCourses.length > 0 && users.length > 0 && instructor) {
      const existingEnrollmentCount = await prisma.enrollment.count();
      if (existingEnrollmentCount < 20) {
        const now = new Date();
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
