
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourse(courseId: string) {
  console.log(`Checking course: ${courseId}`);
  
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        chapters: true,
      }
    });

    if (!course) {
      console.log('Course not found');
      return;
    }

    console.log(`Course found: ${course.title}`);
    console.log(`Status: ${course.status}, isPublished: ${course.isPublished}, isActive: ${course.isActive}`);
    console.log(`Total Chapters in DB: ${course.chapters.length}`);

    course.chapters.forEach(ch => {
      console.log(`- Chapter: ${ch.title} (ID: ${ch.id})`);
      console.log(`  Type: ${ch.contentType}`);
      console.log(`  Published: ${ch.isPublished}, Active: ${ch.isActive}`);
    });

    // Check Quizzes
    console.log('\nChecking Quizzes...');
    const quizzes = await prisma.quiz.findMany({
      where: {
        OR: [
          { entity: 'COURSE', entityId: courseId },
          { entity: 'CHAPTER', entityId: { in: course.chapters.map(c => c.id) } }
        ]
      }
    });

    console.log(`Total Quizzes found: ${quizzes.length}`);
    quizzes.forEach(q => {
      console.log(`- Quiz: ${q.title} (ID: ${q.id})`);
      console.log(`  Entity: ${q.entity} (ID: ${q.entityId})`);
      console.log(`  Published: ${q.isPublished}, Active: ${q.isActive}`);
    });

  } catch (error) {
    console.error('Error checking database:', error);
  }
}

const courseId = 'faceb441-0a0b-424c-977f-9964f81e64fa';
checkCourse(courseId)
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
