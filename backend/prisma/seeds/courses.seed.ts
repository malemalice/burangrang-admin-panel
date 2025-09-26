import { PrismaClient, User, Category } from '@prisma/client';

export const courses = [
  {
    title: 'Introduction to Web Development',
    slug: 'intro-web-development',
    description: 'Learn the fundamentals of web development including HTML, CSS, and JavaScript. This comprehensive course covers everything you need to know to start building modern web applications.',
    shortDescription: 'Master the basics of web development with HTML, CSS, and JavaScript',
    thumbnailUrl: 'https://via.placeholder.com/400x300/4F46E5/FFFFFF?text=Web+Dev',
    difficulty: 'beginner',
    language: 'en',
    price: 99.99,
    salePrice: 79.99,
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-01-15'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Programming', 'Web Development'],
  },
  {
    title: 'Advanced React Development',
    slug: 'advanced-react-development',
    description: 'Deep dive into React development with advanced patterns, state management, performance optimization, and modern React features like hooks and context.',
    shortDescription: 'Master advanced React concepts and patterns',
    thumbnailUrl: 'https://via.placeholder.com/400x300/06B6D4/FFFFFF?text=React+Advanced',
    difficulty: 'advanced',
    language: 'en',
    price: 149.99,
    salePrice: 119.99,
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-02-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['Programming', 'Frontend Development'],
  },
  {
    title: 'Database Design Fundamentals',
    slug: 'database-design-fundamentals',
    description: 'Learn how to design efficient and scalable databases. Cover normalization, relationships, indexing, and best practices for database architecture.',
    shortDescription: 'Master database design principles and best practices',
    thumbnailUrl: 'https://via.placeholder.com/400x300/10B981/FFFFFF?text=Database',
    difficulty: 'intermediate',
    language: 'en',
    price: 89.99,
    status: 'draft',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Database', 'Backend Development'],
  },
  {
    title: 'Mobile App Development with React Native',
    slug: 'mobile-app-react-native',
    description: 'Build cross-platform mobile applications using React Native. Learn navigation, state management, native modules, and deployment strategies.',
    shortDescription: 'Create mobile apps with React Native',
    thumbnailUrl: 'https://via.placeholder.com/400x300/8B5CF6/FFFFFF?text=Mobile+Dev',
    difficulty: 'intermediate',
    language: 'en',
    price: 129.99,
    status: 'review',
    isPublished: false,
    instructorEmail: 'admin@example.com',
    categoryNames: ['Mobile Development', 'React Native'],
  },
  {
    title: 'DevOps and Cloud Deployment',
    slug: 'devops-cloud-deployment',
    description: 'Master DevOps practices and cloud deployment strategies. Learn Docker, Kubernetes, CI/CD pipelines, and cloud services like AWS and Azure.',
    shortDescription: 'Learn DevOps practices and cloud deployment',
    thumbnailUrl: 'https://via.placeholder.com/400x300/F59E0B/FFFFFF?text=DevOps',
    difficulty: 'advanced',
    language: 'en',
    price: 179.99,
    status: 'published',
    isPublished: true,
    publishedAt: new Date('2024-03-01'),
    instructorEmail: 'admin@example.com',
    categoryNames: ['DevOps', 'Cloud Computing'],
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

      const course = await prisma.course.create({
        data: {
          title: courseData.title,
          slug: courseData.slug,
          description: courseData.description,
          shortDescription: courseData.shortDescription,
          thumbnailUrl: courseData.thumbnailUrl,
          difficulty: courseData.difficulty,
          language: courseData.language,
          price: courseData.price,
          salePrice: courseData.salePrice,
          status: courseData.status,
          isPublished: courseData.isPublished,
          publishedAt: courseData.publishedAt,
          instructorId: instructor.id,
          categories: {
            connect: courseCategories.map(cat => ({ id: cat.id }))
          }
        },
        include: {
          instructor: true,
          categories: true,
        },
      });

      console.log(`✓ Created course: ${course.title}`);
      return course;
    })
  );

  console.log(`✓ Created ${createdCourses.length} courses`);
  return createdCourses;
}
