/**
 * Quiz seed data
 * Following TRD.md patterns for seed data
 */
import { PrismaClient, QuizAttemptStatusEnum } from '@prisma/client';

const prisma = new PrismaClient();

export const seedQuizzes = async () => {
  console.log('🌱 Seeding quizzes...');

  try {
    // Get admin user as creator
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

    const creator = await prisma.user.findFirst({
      where: {
        roleId: {
          in: roleIds,
        },
        isActive: true,
      },
    });

    if (!creator) {
      console.log('⚠️  No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`📝 Using creator: ${creator.firstName} ${creator.lastName}`);

    // Get courses and chapters for binding
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      take: 3,
    });

    const chapters = await prisma.chapter.findMany({
      where: { isActive: true },
      take: 3,
    });

    // Define quizzes
    const quizzesData = [
      {
        title: 'safety quiz',
        description: 'Safety awareness, PPE, hazard, fire safety, emergency response, ergonomics',
        instructions: 'choose one correct answer',
        entity: null as 'COURSE' | 'CHAPTER' | null,
        entityId: null,
        duration: 30,
        passingScore: 80,
        maxAttempts: 2,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswer: true,
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the primary purpose of Personal Protective Equipment (PPE)?',
            explanation: 'PPE is designed to reduce exposure to workplace hazards when engineering and administrative controls are not feasible or effective.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'To replace engineering controls', isCorrect: false, order: 1 },
              { optionText: 'To eliminate all hazards', isCorrect: false, order: 2 },
              { optionText: 'To reduce exposure to workplace hazards', isCorrect: true, order: 3 },
              { optionText: 'To increase productivity', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'Which of the following is considered a physical hazard?',
            explanation: 'Physical hazards include factors within the environment that can harm the body without necessarily touching it, such as noise, radiation, and extreme temperatures.',
            points: 10,
            order: 2,
            options: [
              { optionText: 'Chemicals', isCorrect: false, order: 1 },
              { optionText: 'Noise', isCorrect: true, order: 2 },
              { optionText: 'Biological agents', isCorrect: false, order: 3 },
              { optionText: 'Stress', isCorrect: false, order: 4 },
            ],
          },
        ],
      },
      {
        title: 'Basic Safety Knowledge Quiz',
        description: 'Test your understanding of basic safety principles and workplace safety protocols.',
        instructions: 'Answer all questions. You have 30 minutes to complete this quiz. Passing score is 70%.',
        entity: null as 'COURSE' | 'CHAPTER' | null,
        entityId: null,
        duration: 30,
        passingScore: 70,
        maxAttempts: 3,
        shuffleQuestions: false,
        shuffleOptions: true,
        showCorrectAnswer: true,
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the primary purpose of Personal Protective Equipment (PPE)?',
            explanation: 'PPE is designed to protect workers from workplace hazards and reduce the risk of injury.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'To make workers look professional', isCorrect: false, order: 1 },
              { optionText: 'To protect workers from workplace hazards', isCorrect: true, order: 2 },
              { optionText: 'To comply with fashion standards', isCorrect: false, order: 3 },
              { optionText: 'To increase productivity', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What should you do if you discover a fire in the workplace?',
            explanation: 'In case of fire, the priority is to alert others and evacuate safely, then call emergency services.',
            points: 10,
            order: 2,
            options: [
              { optionText: 'Try to extinguish it yourself first', isCorrect: false, order: 1 },
              { optionText: 'Alert others and evacuate, then call emergency services', isCorrect: true, order: 2 },
              { optionText: 'Continue working until someone else notices', isCorrect: false, order: 3 },
              { optionText: 'Hide and wait for it to go away', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'TRUE_FALSE',
            questionText: 'It is safe to use damaged electrical equipment if it still works.',
            explanation: 'Damaged electrical equipment can cause electric shock, fire, or other hazards. It should never be used.',
            points: 5,
            order: 3,
            options: [
              { optionText: 'True', isCorrect: false, order: 1 },
              { optionText: 'False', isCorrect: true, order: 2 },
            ],
          },
          {
            questionType: 'ESSAY',
            questionText: 'Explain the importance of conducting regular safety inspections in the workplace.',
            explanation: 'Regular safety inspections help identify hazards before they cause accidents, ensure compliance with safety regulations, and maintain a safe working environment.',
            points: 15,
            order: 4,
            options: [],
          },
        ],
      },
      {
        title: 'Fire Safety Assessment',
        description: 'Evaluate your knowledge of fire safety procedures and prevention techniques.',
        instructions: 'Complete all questions within 20 minutes. You need 75% to pass.',
        entity: courses.length > 0 ? ('COURSE' as const) : null,
        entityId: courses.length > 0 ? courses[0].id : null,
        duration: 20,
        passingScore: 75,
        maxAttempts: 2,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswer: true,
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What type of fire extinguisher should be used for electrical fires?',
            explanation: 'Class C fire extinguishers are designed for electrical fires. Water-based extinguishers should never be used on electrical fires.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'Water-based extinguisher', isCorrect: false, order: 1 },
              { optionText: 'Class C (CO2 or dry chemical)', isCorrect: true, order: 2 },
              { optionText: 'Foam extinguisher', isCorrect: false, order: 3 },
              { optionText: 'Any type will work', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What does the acronym PASS stand for in fire extinguisher operation?',
            explanation: 'PASS stands for Pull, Aim, Squeeze, Sweep - the correct sequence for using a fire extinguisher.',
            points: 10,
            order: 2,
            options: [
              { optionText: 'Pull, Aim, Squeeze, Sweep', isCorrect: true, order: 1 },
              { optionText: 'Point, Activate, Spray, Stop', isCorrect: false, order: 2 },
              { optionText: 'Press, Aim, Shoot, Stop', isCorrect: false, order: 3 },
              { optionText: 'Pull, Activate, Spray, Sweep', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'TRUE_FALSE',
            questionText: 'Smoke detectors should be tested monthly.',
            explanation: 'Regular monthly testing ensures smoke detectors are functioning properly and can save lives.',
            points: 5,
            order: 3,
            options: [
              { optionText: 'True', isCorrect: true, order: 1 },
              { optionText: 'False', isCorrect: false, order: 2 },
            ],
          },
        ],
      },
      {
        title: 'First Aid Fundamentals Quiz',
        description: 'Test your knowledge of basic first aid procedures and emergency response.',
        instructions: 'Answer all questions carefully. Passing score is 80%.',
        entity: chapters.length > 0 ? ('CHAPTER' as const) : null,
        entityId: chapters.length > 0 ? chapters[0].id : null,
        duration: 25,
        passingScore: 80,
        maxAttempts: null,
        shuffleQuestions: false,
        shuffleOptions: false,
        showCorrectAnswer: true,
        isPublished: true,
        publishedAt: new Date(),
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the first step in providing first aid to an unconscious person?',
            explanation: 'The first step is always to check for responsiveness and ensure the scene is safe before approaching.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'Start CPR immediately', isCorrect: false, order: 1 },
              { optionText: 'Check for responsiveness and ensure scene safety', isCorrect: true, order: 2 },
              { optionText: 'Call emergency services', isCorrect: false, order: 3 },
              { optionText: 'Move the person to a comfortable position', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'How many chest compressions should be given per minute during CPR for adults?',
            explanation: 'The recommended rate for adult CPR is 100-120 compressions per minute.',
            points: 10,
            order: 2,
            options: [
              { optionText: '60-80 compressions per minute', isCorrect: false, order: 1 },
              { optionText: '100-120 compressions per minute', isCorrect: true, order: 2 },
              { optionText: '140-160 compressions per minute', isCorrect: false, order: 3 },
              { optionText: '80-100 compressions per minute', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'TRUE_FALSE',
            questionText: 'You should remove an embedded object from a wound before applying pressure.',
            explanation: 'Never remove embedded objects as they may be preventing further bleeding. Apply pressure around the object instead.',
            points: 5,
            order: 3,
            options: [
              { optionText: 'True', isCorrect: false, order: 1 },
              { optionText: 'False', isCorrect: true, order: 2 },
            ],
          },
          {
            questionType: 'ESSAY',
            questionText: 'Describe the steps you would take when encountering someone who is choking.',
            explanation: 'The Heimlich maneuver should be used for conscious choking victims, followed by checking for responsiveness and calling emergency services if needed.',
            points: 15,
            order: 4,
            options: [],
          },
        ],
      },
      {
        title: 'Workplace Ergonomics Quiz',
        description: 'Assess your understanding of ergonomic principles and workplace design.',
        instructions: 'Complete this quiz in 15 minutes. Score 70% or higher to pass.',
        entity: courses.length > 1 ? ('COURSE' as const) : null,
        entityId: courses.length > 1 ? courses[1].id : null,
        duration: 15,
        passingScore: 70,
        maxAttempts: 5,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswer: true,
        isPublished: false, // Draft quiz
        publishedAt: null,
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the recommended height for a computer monitor?',
            explanation: 'The top of the monitor should be at or slightly below eye level to prevent neck strain.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'At eye level or slightly below', isCorrect: true, order: 1 },
              { optionText: 'Well above eye level', isCorrect: false, order: 2 },
              { optionText: 'Well below eye level', isCorrect: false, order: 3 },
              { optionText: 'Height does not matter', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'TRUE_FALSE',
            questionText: 'Taking regular breaks from computer work can help prevent repetitive strain injuries.',
            explanation: 'Regular breaks allow muscles to rest and recover, reducing the risk of repetitive strain injuries.',
            points: 5,
            order: 2,
            options: [
              { optionText: 'True', isCorrect: true, order: 1 },
              { optionText: 'False', isCorrect: false, order: 2 },
            ],
          },
        ],
      },
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const quizData of quizzesData) {
      // Check if quiz with same title already exists
      const existingQuiz = await prisma.quiz.findFirst({
        where: {
          title: quizData.title,
          createdBy: creator.id,
        },
      });

      if (existingQuiz) {
        console.log(`⏭️  Quiz "${quizData.title}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Create quiz with questions and options
      const quiz = await prisma.quiz.create({
        data: {
          title: quizData.title,
          description: quizData.description,
          instructions: quizData.instructions,
          entity: quizData.entity,
          entityId: quizData.entityId,
          duration: quizData.duration,
          passingScore: quizData.passingScore,
          maxAttempts: quizData.maxAttempts,
          shuffleQuestions: quizData.shuffleQuestions,
          shuffleOptions: quizData.shuffleOptions,
          showCorrectAnswer: quizData.showCorrectAnswer,
          isPublished: quizData.isPublished,
          publishedAt: quizData.publishedAt,
          isActive: quizData.isActive,
          createdBy: creator.id,
          questions: {
            create: quizData.questions.map((q) => ({
              questionType: q.questionType,
              questionText: q.questionText,
              explanation: q.explanation,
              points: q.points,
              order: q.order,
              isActive: true,
              options: {
                create: q.options.map((opt) => ({
                  optionText: opt.optionText,
                  isCorrect: opt.isCorrect,
                  order: opt.order,
                })),
              },
            })),
          },
        },
      });

      createdCount++;
      const entityInfo = quizData.entity
        ? ` (bound to ${quizData.entity}${quizData.entityId ? ' ID: ' + quizData.entityId : ''})`
        : ' (standalone)';
      console.log(`✅ Created quiz: ${quiz.title}${entityInfo} with ${quizData.questions.length} questions`);
    }

    // Seed quiz attempts for Admin Overview dashboard (LMS quiz pass rate)
    const existingAttemptCount = await prisma.quizAttempt.count();
    if (existingAttemptCount < 25) {
      const publishedQuizzes = await prisma.quiz.findMany({
        where: { isPublished: true, isActive: true },
        take: 5,
      });
      const usersForAttempts = await prisma.user.findMany({
        where: { isActive: true },
        take: 8,
      });
      if (publishedQuizzes.length > 0 && usersForAttempts.length > 0) {
        const now = new Date();
        const past = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        let attemptsCreated = 0;
        for (const quiz of publishedQuizzes) {
          for (let u = 0; u < usersForAttempts.length && attemptsCreated < 25; u++) {
            const user = usersForAttempts[u];
            const isPassed = u % 3 !== 0;
            const score = isPassed ? 85 : 55;
            await prisma.quizAttempt.create({
              data: {
                quizId: quiz.id,
                userId: user.id,
                enrollmentId: null,
                attemptNumber: 1,
                status: QuizAttemptStatusEnum.COMPLETED,
                score,
                totalPoints: 100,
                earnedPoints: score,
                isPassed,
                startedAt: past,
                completedAt: now,
                timeSpent: 600,
              },
            });
            attemptsCreated++;
          }
        }
        console.log(`✅ Created ${attemptsCreated} quiz attempts for Admin Overview (LMS)`);
      }
    }

    console.log(`\n📊 Summary: Created ${createdCount} quizzes, skipped ${skippedCount}`);
    return { created: createdCount, skipped: skippedCount };
  } catch (error) {
    console.error('❌ Error seeding quizzes:', error);
    throw error;
  }
};

export default seedQuizzes;
