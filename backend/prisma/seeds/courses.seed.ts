import { PrismaClient, User, Category } from '@prisma/client';

export const courses = [
  {
    title: 'Introduction to Web Development',
    slug: 'intro-web-development',
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This comprehensive course covers everything you need to know to start building modern web applications.',
    shortDescription: 'Master the basics of web development with HTML, CSS, and JavaScript',
    thumbnailUrl: 'https://picsum.photos/400/300?random=7',
    difficulty: 'beginner',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-01-15'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Programming', 'Web Development'],
    productSku: 'REACT-001', // Associate with Complete React Development Course product
  },
  {
    title: 'Advanced React Development',
    slug: 'advanced-react-development',
    description: 'Deep dive into React development with advanced patterns, state management, performance optimization, and modern React features like hooks and context.',
    shortDescription: 'Master advanced React concepts and patterns',
    thumbnailUrl: 'https://picsum.photos/400/300?random=8',
    difficulty: 'advanced',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-02-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Programming', 'Frontend Development'],
    productSku: 'TS-001', // Associate with Advanced TypeScript Video Series product
  },
  {
    title: 'Database Design Fundamentals',
    slug: 'database-design-fundamentals',
    description: 'Learn how to design efficient and scalable databases. Cover normalization, relationships, indexing, and best practices for database architecture.',
    shortDescription: 'Master database design principles and best practices',
    thumbnailUrl: 'https://picsum.photos/400/300?random=9',
    difficulty: 'intermediate',
    language: 'en',
    status: 'draft',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Database', 'Backend Development'],
    // No product association - free course
  },
  {
    title: 'Mobile App Development with React Native',
    slug: 'mobile-app-react-native',
    description: 'Build cross-platform mobile applications using React Native. Learn navigation, state management, native modules, and deployment strategies.',
    shortDescription: 'Create mobile apps with React Native',
    thumbnailUrl: 'https://picsum.photos/400/300?random=10',
    difficulty: 'intermediate',
    language: 'en',
    status: 'review',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Mobile Development', 'React Native'],
    productSku: 'NODE-001', // Associate with Node.js Backend Development product
  },
  {
    title: 'DevOps and Cloud Deployment',
    slug: 'devops-cloud-deployment',
    description: 'Master DevOps practices and cloud deployment strategies. Learn Docker, Kubernetes, CI/CD pipelines, and cloud services like AWS and Azure.',
    shortDescription: 'Learn DevOps practices and cloud deployment',
    thumbnailUrl: 'https://picsum.photos/400/300?random=11',
    difficulty: 'advanced',
    language: 'en',
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['DevOps', 'Cloud Computing'],
    productSku: 'FULLSTACK-001', // Associate with Full Stack Developer Bundle product
  },
];

export async function seedCourses(
  prisma: PrismaClient,
  users: User[],
  categories: Category[]
) {
  console.log('Creating courses...');
  
  const createdCourses = await Promise.all(
    courses.map(async (courseData) => {
      const instructor = users.find((u) => u.email === courseData.instructorEmail);
      
      if (!instructor) {
        throw new Error(`Instructor with email ${courseData.instructorEmail} not found`);
      }

      // Find categories for this course
      const courseCategories = categories.filter(cat => 
        courseData.categoryNames.includes(cat.name)
      );

      // Find associated product if productSku is provided
      let productId: string | undefined;
      if (courseData.productSku) {
        const product = await prisma.product.findUnique({
          where: { sku: courseData.productSku }
        });
        if (product) {
          productId = product.id;
        } else {
          console.warn(`Product with SKU ${courseData.productSku} not found for course ${courseData.title}`);
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
            connect: courseCategories.map(cat => ({ id: cat.id }))
          }
        },
        include: {
          instructor: true,
          categories: true,
          product: true,
        },
      });

      console.log(`✓ Created course: ${course.title}${productId ? ` (associated with product)` : ' (free course)'}`);
      return course;
    })
  );

  console.log(`✓ Created ${createdCourses.length} courses`);
  return createdCourses;
}
