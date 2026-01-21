
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const COURSE_ID = 'faceb441-0a0b-424c-977f-9964f81e64fa';

async function seedContent() {
  console.log(`Seeding content for course: ${COURSE_ID}`);

  const course = await prisma.course.findUnique({
    where: { id: COURSE_ID },
  });

  if (!course) {
    console.error('Course not found!');
    return;
  }

  // Get an admin user for 'createdBy'
  const admin = await prisma.user.findFirst({
    where: { role: { name: 'Super Admin' } },
  });

  if (!admin) {
    console.error('Admin user not found!');
    return;
  }

  const userId = admin.id;

  // 1. Create Chapters (if not exists)
  console.log('Creating/Checking chapters...');

  const chaptersData = [
    {
      title: 'Welcome & Introduction',
      description: 'Introduction to the HSE Management System course.',
      order: 1,
      duration: 5,
      contentType: 'video',
      contentUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      isPublished: true,
      isActive: true,
    },
    {
      title: 'Course Syllabus & Handbook',
      description: 'Download the course materials and handbook.',
      order: 2,
      duration: 10,
      contentType: 'pdf',
      contentUrl: 'https://pdfobject.com/pdf/sample.pdf',
      isPublished: true,
      isActive: true,
    },
    {
      title: 'Module 1: Safety Fundamentals',
      description: 'Core concepts of workplace safety.',
      order: 3,
      duration: 15,
      contentType: 'text',
      content: `
        <h2>Safety Fundamentals</h2>
        <p>Workplace safety is the responsibility of everyone. This module covers:</p>
        <ul>
          <li>Hazard identification</li>
          <li>Risk assessment</li>
          <li>Control measures</li>
        </ul>
        <p>Remember: Safety First!</p>
      `,
      isPublished: true,
      isActive: true,
    },
    {
      title: 'Safety Procedures Podcast',
      description: 'Listen to the expert interview on safety procedures.',
      order: 4,
      duration: 20,
      contentType: 'audio',
      contentUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      isPublished: true,
      isActive: true,
    },
    {
      title: 'Hazard Identification Guide',
      description: 'Visual guide for identifying common hazards.',
      order: 5,
      duration: 5,
      contentType: 'image',
      contentUrl: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=1200&q=80',
      isPublished: true,
      isActive: true,
    },
    {
      title: 'Advanced Safety Protocols',
      description: 'Deep dive into advanced protocols.',
      order: 6,
      duration: 30,
      contentType: 'youtube',
      youtubeVideoId: 'dQw4w9WgXcQ',
      isPublished: true,
      isActive: true,
    },
  ];

  for (const ch of chaptersData) {
    // Check if chapter exists by title
    const existing = await prisma.chapter.findFirst({
      where: { courseId: COURSE_ID, title: ch.title }
    });

    if (!existing) {
      await prisma.chapter.create({
        data: {
          courseId: COURSE_ID,
          ...ch,
        },
      });
      console.log(`Created chapter: ${ch.title}`);
    } else {
      console.log(`Chapter exists: ${ch.title}`);
    }
  }

  // 2. Create Quizzes
  console.log('Creating/Checking quizzes...');

  // Course Level Quiz
  const existingCourseQuiz = await prisma.quiz.findFirst({
    where: { entity: 'COURSE', entityId: COURSE_ID, title: 'Final Certification Exam' }
  });

  if (!existingCourseQuiz) {
    await prisma.quiz.create({
      data: {
        title: 'Final Certification Exam',
        description: 'Complete this exam to earn your certificate.',
        entity: 'COURSE',
        entityId: COURSE_ID,
        duration: 60,
        passingScore: 80,
        createdBy: userId,
        isPublished: true,
        isActive: true,
        questions: {
          create: [
            {
              questionType: 'MULTIPLE_CHOICE',
              questionText: 'What is the first step in risk assessment?',
              points: 10,
              order: 1,
              options: {
                create: [
                  { optionText: 'Ignore the hazard', isCorrect: false, order: 1 },
                  { optionText: 'Identify the hazard', isCorrect: true, order: 2 },
                ],
              },
            },
          ],
        },
      },
    });
    console.log('Created Course Quiz');
  }

  // Chapter Level Quiz
  // Find Module 1 chapter
  const mod1 = await prisma.chapter.findFirst({
    where: { courseId: COURSE_ID, title: 'Module 1: Safety Fundamentals' }
  });

  if (mod1) {
    const existingChapterQuiz = await prisma.quiz.findFirst({
      where: { entity: 'CHAPTER', entityId: mod1.id, title: 'Module 1 Quiz' }
    });

    if (!existingChapterQuiz) {
      await prisma.quiz.create({
        data: {
          title: 'Module 1 Quiz',
          description: 'Quick check on safety fundamentals.',
          entity: 'CHAPTER',
          entityId: mod1.id,
          duration: 10,
          passingScore: 70,
          createdBy: userId,
          isPublished: true,
          isActive: true,
          questions: {
            create: [
              {
                questionType: 'TRUE_FALSE',
                questionText: 'Safety is everyone\'s responsibility.',
                points: 10,
                order: 1,
                options: {
                  create: [
                    { optionText: 'True', isCorrect: true, order: 1 },
                    { optionText: 'False', isCorrect: false, order: 2 },
                  ],
                },
              },
            ],
          },
        },
      });
      console.log('Created Chapter Quiz for Module 1');
    }
  }

  console.log('Seed completed successfully!');
}

seedContent()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
