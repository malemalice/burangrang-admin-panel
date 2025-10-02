import { PrismaClient, User, Category } from '@prisma/client';

export const courses = [
  {
    title: 'Introduction to Cognitive Behavioral Therapy',
    slug: 'intro-cognitive-behavioral-therapy',
    description:
      'Learn the fundamentals of CBT, including identifying negative thought patterns, challenging cognitive distortions, and developing healthier thinking habits. This comprehensive course covers everything you need to know to start applying CBT techniques in your daily life.',
    shortDescription: 'Master the basics of CBT for anxiety, depression, and emotional regulation',
    thumbnailUrl: 'https://picsum.photos/400/300?random=7',
    difficulty: 'beginner',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-01-15'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Cognitive Behavioral Therapy (CBT)', 'Therapy & Counseling'],
    productSku: 'CBT-001', // Associate with Complete CBT Mastery Course product
  },
  {
    title: 'Advanced Mindfulness and Meditation Practices',
    slug: 'advanced-mindfulness-meditation',
    description:
      'Deep dive into advanced mindfulness techniques, meditation practices, and awareness training. Learn to cultivate present-moment awareness, develop concentration, and integrate mindfulness into daily life for lasting mental wellness.',
    shortDescription: 'Master advanced mindfulness and meditation techniques',
    thumbnailUrl: 'https://picsum.photos/400/300?random=8',
    difficulty: 'advanced',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-02-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Meditation Practices', 'Mindfulness & Meditation'],
    productSku: 'MINDFUL-001', // Associate with Mindfulness Meditation Guide eBook product
  },
  {
    title: 'Trauma Recovery and Healing Fundamentals',
    slug: 'trauma-recovery-healing-fundamentals',
    description:
      'Learn evidence-based approaches to trauma recovery, including understanding trauma responses, building resilience, and developing healthy coping strategies. This course provides a safe foundation for healing and growth.',
    shortDescription: 'Master trauma-informed care and healing techniques',
    thumbnailUrl: 'https://picsum.photos/400/300?random=9',
    difficulty: 'intermediate',
    language: 'en',
    status: 'draft',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Trauma Recovery & Healing', 'Therapy & Counseling'],
    // No product association - free course
  },
  {
    title: 'Anxiety Management and Coping Strategies',
    slug: 'anxiety-management-coping-strategies',
    description:
      'Comprehensive course on managing anxiety, panic attacks, and worry. Learn practical techniques for anxiety reduction, building confidence, and developing resilience in challenging situations.',
    shortDescription: 'Master anxiety management and coping techniques',
    thumbnailUrl: 'https://picsum.photos/400/300?random=10',
    difficulty: 'intermediate',
    language: 'en',
    status: 'review',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Anxiety & Depression Management', 'Stress Management'],
    productSku: 'ANXIETY-001', // Associate with Anxiety Management Workshop product
  },
  {
    title: 'Emotional Intelligence and Regulation',
    slug: 'emotional-intelligence-regulation',
    description:
      'Develop emotional intelligence skills including self-awareness, emotional regulation, empathy, and social skills. Learn to understand and manage emotions effectively for better relationships and personal growth.',
    shortDescription: 'Master emotional intelligence and regulation skills',
    thumbnailUrl: 'https://picsum.photos/400/300?random=11',
    difficulty: 'intermediate',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Emotional Regulation', 'Personal Growth & Development'],
    productSku: 'EQ-001', // Associate with Emotional Intelligence Handbook product
  },
  {
    title: 'Sleep Wellness and Relaxation Techniques',
    slug: 'sleep-wellness-relaxation-techniques',
    description:
      'Learn evidence-based techniques for improving sleep quality, managing insomnia, and establishing healthy sleep routines. Includes guided meditations, relaxation exercises, and sleep hygiene practices.',
    shortDescription: 'Master sleep improvement and relaxation techniques',
    thumbnailUrl: 'https://picsum.photos/400/300?random=12',
    difficulty: 'beginner',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-03-15'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Sleep & Wellness', 'Stress Management'],
    productSku: 'SLEEP-001', // Associate with Sleep Wellness Toolkit product
  },
  {
    title: 'Building Healthy Relationships',
    slug: 'building-healthy-relationships',
    description:
      'Learn essential skills for building and maintaining healthy relationships, including communication techniques, boundary setting, conflict resolution, and emotional intimacy.',
    shortDescription: 'Master relationship skills and communication techniques',
    thumbnailUrl: 'https://picsum.photos/400/300?random=13',
    difficulty: 'beginner',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-04-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Relationships & Communication', 'Personal Growth & Development'],
    // No product association - free course
  },
  {
    title: 'Addiction Recovery and Support',
    slug: 'addiction-recovery-support',
    description:
      'Comprehensive course on addiction recovery, including understanding addiction, building support systems, developing coping strategies, and maintaining long-term recovery.',
    shortDescription: 'Master addiction recovery and support strategies',
    thumbnailUrl: 'https://picsum.photos/400/300?random=14',
    difficulty: 'advanced',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-04-15'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Addiction Recovery & Support', 'Therapy & Counseling'],
    // No product association - free course
  },
];

export async function seedCourses(
  prisma: PrismaClient,
  users: User[],
  categories: Category[],
) {
  console.log('🌱 Creating mental health courses...');

  try {
    if (users.length === 0) {
      throw new Error('No users provided for course creation');
    }

    if (categories.length === 0) {
      throw new Error('No categories provided for course creation');
    }

    console.log(
      `📊 Found ${users.length} users and ${categories.length} categories`,
    );

    const createdCourses: any[] = [];
    let successCount = 0;
    let errorCount = 0;

    for (const courseData of courses) {
      try {
        const instructor = users.find(
          (u) => u.email === courseData.instructorEmail,
        );

        if (!instructor) {
          throw new Error(
            `Instructor with email ${courseData.instructorEmail} not found`,
          );
        }

        // Find categories for this course
        const courseCategories = categories.filter((cat) =>
          courseData.categoryNames.includes(cat.name),
        );

        if (courseCategories.length === 0) {
          console.warn(
            `⚠️  No categories found for course ${courseData.title}. Available categories: ${categories
              .map((c) => c.name)
              .join(', ')}`,
          );
        }

        // Find associated product if productSku is provided
        let productId: string | undefined;
        if (courseData.productSku) {
          const product = await prisma.product.findUnique({
            where: { sku: courseData.productSku },
          });
          if (product) {
            productId = product.id;
            console.log(
              `🔗 Linking course "${courseData.title}" to product "${product.name}" (${courseData.productSku})`,
            );
          } else {
            console.warn(
              `⚠️  Product with SKU ${courseData.productSku} not found for course ${courseData.title}. Course will be created without product association.`,
            );
          }
        }

        const course = await prisma.course.create({
          data: {
            title: courseData.title,
            slug: courseData.slug,
            description: courseData.description,
            shortDescription: courseData.shortDescription,
            thumbnailUrl: courseData.thumbnailUrl,
            difficulty: courseData.difficulty,
            language: courseData.language,
            status: courseData.status,
            isPublished: courseData.isPublished,
            publishedAt: courseData.publishedAt,
            instructorId: instructor.id,
            productId: productId,
            categories: {
              connect: courseCategories.map((cat) => ({ id: cat.id })),
            },
          },
          include: {
            instructor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            categories: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
            product: {
              select: {
                id: true,
                name: true,
                sku: true,
                price: true,
                status: true,
              },
            },
          },
        });

        const categoryNames = course.categories.map((c) => c.name).join(', ');
        const productInfo = course.product
          ? ` (linked to product: ${course.product.name})`
          : ' (free course)';
        console.log(
          `✅ Created course: ${course.title}${productInfo} | Categories: ${categoryNames}`,
        );

        createdCourses.push(course);
        successCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `❌ Failed to create course ${courseData.title}:`,
          errorMessage,
        );
        errorCount++;
      }
    }

    console.log(
      `🎉 Created ${successCount} mental health courses successfully! Errors: ${errorCount}`,
    );
    return createdCourses;
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Courses seeding failed:', errorMessage);
    throw error;
  }
}