import { PrismaClient, Course } from '@prisma/client';

export const chapters = [
  // Chapters for "Introduction to Web Development"
  {
    courseSlug: 'intro-web-development',
    chapters: [
      {
        title: 'Getting Started with HTML',
        description: 'Learn the basics of HTML structure, elements, and semantic markup.',
        order: 1,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/html-basics.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'CSS Fundamentals',
        description: 'Understanding CSS selectors, properties, and styling techniques.',
        order: 2,
        duration: 60,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/css-fundamentals.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'JavaScript Basics',
        description: 'Introduction to JavaScript programming concepts and DOM manipulation.',
        order: 3,
        duration: 75,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/js-basics.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Building Your First Website',
        description: 'Put it all together to create a complete website project.',
        order: 4,
        duration: 90,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/first-website.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
      {
        title: 'Course Resources and References',
        description: 'Additional resources, links, and reference materials for further learning.',
        order: 5,
        duration: 0,
        contentType: 'text',
        content: `# Additional Resources

## HTML Resources
- [MDN HTML Documentation](https://developer.mozilla.org/en-US/docs/Web/HTML)
- [HTML5 Semantic Elements Guide](https://example.com/html5-guide)

## CSS Resources
- [CSS-Tricks](https://css-tricks.com/)
- [Flexbox Guide](https://css-tricks.com/snippets/css/a-guide-to-flexbox/)

## JavaScript Resources
- [JavaScript.info](https://javascript.info/)
- [MDN JavaScript Guide](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide)

## Practice Projects
1. Personal Portfolio Website
2. Company Landing Page
3. Blog Template
4. E-commerce Product Page`,
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-01-15'),
      },
    ],
  },
  // Chapters for "Advanced React Development"
  {
    courseSlug: 'advanced-react-development',
    chapters: [
      {
        title: 'React Hooks Deep Dive',
        description: 'Advanced patterns with useState, useEffect, useContext, and custom hooks.',
        order: 1,
        duration: 80,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/react-hooks.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'State Management with Redux Toolkit',
        description: 'Modern Redux patterns with Redux Toolkit and RTK Query.',
        order: 2,
        duration: 95,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/redux-toolkit.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Performance Optimization',
        description: 'React.memo, useMemo, useCallback, and advanced performance techniques.',
        order: 3,
        duration: 70,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/react-performance.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Testing React Applications',
        description: 'Unit testing, integration testing, and E2E testing with Jest and Testing Library.',
        order: 4,
        duration: 85,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/react-testing.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
      {
        title: 'Advanced Component Patterns',
        description: 'Render props, compound components, and advanced React patterns.',
        order: 5,
        duration: 90,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/react-patterns.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-02-01'),
      },
    ],
  },
  // Chapters for "Database Design Fundamentals"
  {
    courseSlug: 'database-design-fundamentals',
    chapters: [
      {
        title: 'Introduction to Database Design',
        description: 'Understanding databases, RDBMS concepts, and design principles.',
        order: 1,
        duration: 50,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/db-intro.mp4',
        isFree: true,
        isPublished: false,
      },
      {
        title: 'Entity-Relationship Modeling',
        description: 'Creating ER diagrams and understanding relationships between entities.',
        order: 2,
        duration: 65,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/er-modeling.mp4',
        isFree: false,
        isPublished: false,
      },
      {
        title: 'Normalization and Normal Forms',
        description: 'Database normalization techniques and achieving different normal forms.',
        order: 3,
        duration: 70,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/normalization.mp4',
        isFree: false,
        isPublished: false,
      },
    ],
  },
  // Chapters for "Mobile App Development with React Native"
  {
    courseSlug: 'mobile-app-react-native',
    chapters: [
      {
        title: 'React Native Setup and Environment',
        description: 'Setting up development environment for iOS and Android.',
        order: 1,
        duration: 40,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/rn-setup.mp4',
        isFree: true,
        isPublished: false,
      },
      {
        title: 'Core Components and Navigation',
        description: 'Understanding React Native components and implementing navigation.',
        order: 2,
        duration: 75,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/rn-components.mp4',
        isFree: false,
        isPublished: false,
      },
    ],
  },
  // Chapters for "DevOps and Cloud Deployment"
  {
    courseSlug: 'devops-cloud-deployment',
    chapters: [
      {
        title: 'Introduction to DevOps',
        description: 'DevOps culture, practices, and tools overview.',
        order: 1,
        duration: 45,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/devops-intro.mp4',
        isFree: true,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Containerization with Docker',
        description: 'Docker fundamentals, creating images, and container orchestration.',
        order: 2,
        duration: 85,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/docker-fundamentals.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Kubernetes Orchestration',
        description: 'Kubernetes concepts, deployments, services, and scaling applications.',
        order: 3,
        duration: 95,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/kubernetes.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'CI/CD Pipeline Implementation',
        description: 'Setting up continuous integration and deployment pipelines.',
        order: 4,
        duration: 80,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/cicd-pipeline.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'Cloud Services and AWS Deployment',
        description: 'Deploying applications to AWS using various services and best practices.',
        order: 5,
        duration: 90,
        contentType: 'video',
        contentUrl: 'https://example.com/videos/aws-deployment.mp4',
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
      {
        title: 'YouTube Integration Example',
        description: 'Example of embedding YouTube videos in course content.',
        order: 6,
        duration: 15,
        contentType: 'youtube',
        youtubeVideoId: 'dQw4w9WgXcQ', // Example YouTube video ID
        isFree: false,
        isPublished: true,
        publishedAt: new Date('2024-03-01'),
      },
    ],
  },
];

export async function seedChapters(prisma: PrismaClient, courses: Course[]): Promise<any[]> {
  console.log('Creating chapters...');
  
  let totalChapters = 0;
  
  for (const courseChapters of chapters) {
    const course = courses.find(c => c.slug === courseChapters.courseSlug);
    
    if (!course) {
      console.warn(`Course with slug ${courseChapters.courseSlug} not found, skipping chapters`);
      continue;
    }

    const createdChapters = await Promise.all(
      courseChapters.chapters.map(async (chapterData) => {
        const chapter = await prisma.chapter.create({
          data: {
            courseId: course.id,
            title: chapterData.title,
            description: chapterData.description,
            order: chapterData.order,
            duration: chapterData.duration,
            contentType: chapterData.contentType,
            contentUrl: chapterData.contentUrl,
            youtubeVideoId: chapterData.youtubeVideoId,
            content: chapterData.content,
            isFree: chapterData.isFree,
            isPublished: chapterData.isPublished,
            publishedAt: chapterData.publishedAt,
          },
        });

        return chapter;
      })
    );

    // Update course with chapter count and total duration
    const totalDuration = courseChapters.chapters.reduce((sum, chapter) => sum + chapter.duration, 0);
    await prisma.course.update({
      where: { id: course.id },
      data: {
        totalChapters: createdChapters.length,
        totalDuration: totalDuration,
      },
    });

    console.log(`✓ Created ${createdChapters.length} chapters for course: ${course.title}`);
    totalChapters += createdChapters.length;
  }

  console.log(`✓ Created ${totalChapters} chapters total`);
  
  // Return all chapters
  return await prisma.chapter.findMany();
}
