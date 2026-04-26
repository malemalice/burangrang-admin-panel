/**
 * Quiz seed data
 * Following TRD.md patterns for seed data
 */
import { QuizAttemptStatusEnum } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

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

    const courseBasicSafety = await prisma.course.findUnique({
      where: { slug: 'basic-safety-training' },
    });
    const courseFireSafety = await prisma.course.findUnique({
      where: { slug: 'fire-safety-prevention' },
    });
    const courseErgonomics = await prisma.course.findUnique({
      where: { slug: 'workplace-ergonomics' },
    });
    const chapterFirstAidIntro = await prisma.chapter.findFirst({
      where: {
        isActive: true,
        order: 1,
        course: { slug: 'first-aid-cpr' },
      },
    });

    if (!courseBasicSafety) {
      console.log('⚠️  Course basic-safety-training not found; Basic Safety Knowledge quiz may be standalone.');
    }
    if (!courseFireSafety) {
      console.log('⚠️  Course fire-safety-prevention not found; Fire Safety quiz will be standalone.');
    }
    if (!courseErgonomics) {
      console.log('⚠️  Course workplace-ergonomics not found; Ergonomics quiz will be standalone.');
    }
    if (!chapterFirstAidIntro) {
      console.log(
        '⚠️  First Aid chapter (order 1) not found; First Aid quiz will not bind to a chapter.',
      );
    }

    // Define quizzes (entity bindings resolved by slug after seedCourses)
    const quizzesData = [
      {
        title: 'safety quiz',
        description:
          'Short standalone check on reporting culture and common trip hazards (LMS demo).',
        instructions: 'Choose one correct answer per question.',
        entity: null as 'COURSE' | 'CHAPTER' | null,
        entityId: null as string | null,
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
            questionText: 'What is a “near miss”?',
            explanation:
              'A near miss is an unplanned event that did not result in injury or damage but could have.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'An injury that required first aid only', isCorrect: false, order: 1 },
              {
                optionText: 'An incident with no injury or loss but with potential for harm',
                isCorrect: true,
                order: 2,
              },
              { optionText: 'A hazard that has been fully eliminated', isCorrect: false, order: 3 },
              { optionText: 'A scheduled safety audit', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText:
              'Which factor most often contributes to slips and trips in workplaces?',
            explanation:
              'Contamination (wet or oily floors, debris) is a leading contributor to slip and trip events.',
            points: 10,
            order: 2,
            options: [
              { optionText: 'Poor lighting only', isCorrect: false, order: 1 },
              { optionText: 'Floor contamination or obstacles in walkways', isCorrect: true, order: 2 },
              { optionText: 'Only footwear choice', isCorrect: false, order: 3 },
              { optionText: 'Outdoor weather only', isCorrect: false, order: 4 },
            ],
          },
        ],
      },
      {
        title: 'Basic Safety Knowledge Quiz',
        description:
          'Aligned with Basic Safety Training: PPE, electrical safety, fire discovery, and inspections.',
        instructions: 'Answer all questions. You have 30 minutes to complete this quiz. Passing score is 70%.',
        entity: courseBasicSafety ? ('COURSE' as const) : null,
        entityId: courseBasicSafety?.id ?? null,
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
            questionText:
              'When must personal protective equipment (PPE) typically be used?',
            explanation:
              'PPE is used when hazards cannot be fully controlled by elimination, substitution, or engineering/administrative controls.',
            points: 10,
            order: 1,
            options: [
              { optionText: 'Only on Fridays', isCorrect: false, order: 1 },
              {
                optionText:
                  'When required by risk assessment and site rules for the task',
                isCorrect: true,
                order: 2,
              },
              { optionText: 'Only for visitors', isCorrect: false, order: 3 },
              { optionText: 'Never if the task is quick', isCorrect: false, order: 4 },
            ],
          },
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What should you do if you discover a fire in the workplace?',
            explanation:
              'In case of fire, the priority is to alert others and evacuate safely, then call emergency services.',
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
            explanation:
              'Damaged electrical equipment can cause electric shock, fire, or other hazards. It should never be used.',
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
            explanation:
              'Regular safety inspections help identify hazards before they cause accidents, ensure compliance with safety regulations, and maintain a safe working environment.',
            points: 15,
            order: 4,
            options: [],
          },
        ],
      },
      {
        title: 'Fire Safety Assessment',
        description:
          'Course-level assessment for Fire Safety and Prevention (extinguishers, PASS, alarms).',
        instructions: 'Complete all questions within 20 minutes. You need 75% to pass.',
        entity: courseFireSafety ? ('COURSE' as const) : null,
        entityId: courseFireSafety?.id ?? null,
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
            explanation:
              'Class C fire extinguishers are designed for electrical fires. Water-based extinguishers should never be used on electrical fires.',
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
            explanation:
              'PASS stands for Pull, Aim, Squeeze, Sweep - the correct sequence for using a fire extinguisher.',
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
            explanation:
              'Regular monthly testing ensures smoke detectors are functioning properly and can save lives.',
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
        description:
          'Chapter assessment for the first module of First Aid and CPR (scene safety and initial assessment).',
        instructions: 'Answer all questions carefully. Passing score is 80%.',
        entity: chapterFirstAidIntro ? ('CHAPTER' as const) : null,
        entityId: chapterFirstAidIntro?.id ?? null,
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
            explanation:
              'The first step is always to check for responsiveness and ensure the scene is safe before approaching.',
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
            questionText: 'How many chest compressions per minute are recommended for adult CPR?',
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
            explanation:
              'Never remove embedded objects as they may be preventing further bleeding. Apply pressure around the object instead.',
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
            explanation:
              'The Heimlich maneuver should be used for conscious choking victims, followed by checking for responsiveness and calling emergency services if needed.',
            points: 15,
            order: 4,
            options: [],
          },
        ],
      },
      {
        title: 'Workplace Ergonomics Quiz',
        description: 'Course draft quiz for Workplace Ergonomics (monitor height, micro-breaks).',
        instructions: 'Complete this quiz in 15 minutes. Score 70% or higher to pass.',
        entity: courseErgonomics ? ('COURSE' as const) : null,
        entityId: courseErgonomics?.id ?? null,
        duration: 15,
        passingScore: 70,
        maxAttempts: 5,
        shuffleQuestions: true,
        shuffleOptions: true,
        showCorrectAnswer: true,
        isPublished: false,
        publishedAt: null,
        isActive: true,
        questions: [
          {
            questionType: 'MULTIPLE_CHOICE',
            questionText: 'What is the recommended height for a computer monitor?',
            explanation:
              'The top of the monitor should be at or slightly below eye level to prevent neck strain.',
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
            explanation:
              'Regular breaks allow muscles to rest and recover, reducing the risk of repetitive strain injuries.',
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
      await prisma.quiz.create({
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
      console.log(`✅ Created quiz: ${quizData.title}${entityInfo} with ${quizData.questions.length} questions`);
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
