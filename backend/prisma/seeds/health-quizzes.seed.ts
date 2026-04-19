/**
 * Health declaration questionnaire seed (HEALTH_DECLARATION)
 * Follows patterns in quizzes.seed.ts
 */
import { seedPrisma as prisma } from './prisma-seed-client';

const HEALTH_QUIZ_TITLE = 'Deklarasi Kesehatan — Skrining Kondisi Medis';

const yesNoOptions = [
  { optionText: 'Ya', isCorrect: true, order: 1 },
  { optionText: 'Tidak', isCorrect: true, order: 2 },
];

const healthDeclarationQuestions = [
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda pernah dinyatakan menderita hipertensi?',
    explanation: null as string | null,
    points: 1,
    order: 1,
    options: yesNoOptions,
  },
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda pernah dinyatakan menderita diabetes?',
    explanation: null,
    points: 1,
    order: 2,
    options: yesNoOptions,
  },
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda pernah dinyatakan menderita asma?',
    explanation: null,
    points: 1,
    order: 3,
    options: yesNoOptions,
  },
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda memiliki riwayat penyakit jantung?',
    explanation: null,
    points: 1,
    order: 4,
    options: yesNoOptions,
  },
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda memiliki riwayat penyakit paru?',
    explanation: null,
    points: 1,
    order: 5,
    options: yesNoOptions,
  },
  {
    questionType: 'MULTIPLE_CHOICE' as const,
    questionText: 'Apakah Anda sedang hamil?',
    explanation: null,
    points: 1,
    order: 6,
    options: yesNoOptions,
  },
  {
    questionType: 'ESSAY' as const,
    questionText:
      'If I have one or more of the above conditions, the medication I am taking is (Apabila saya memiliki salah satu atau beberapa kondisi di atas, obat yang saya konsumsi adalah):',
    explanation: null,
    points: 1,
    order: 7,
    options: [] as { optionText: string; isCorrect: boolean; order: number }[],
  },
];

export const seedHealthQuizzes = async () => {
  console.log('🌱 Seeding health declaration questionnaires...');

  try {
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
        roleId: { in: roleIds },
        isActive: true,
      },
    });

    if (!creator) {
      console.log('⚠️  No admin user found. Please create an admin user first.');
      return;
    }

    const existing = await prisma.quiz.findFirst({
      where: {
        kind: 'HEALTH_DECLARATION',
        title: HEALTH_QUIZ_TITLE,
      },
    });

    if (existing) {
      console.log(`⏭️  Health quiz "${HEALTH_QUIZ_TITLE}" already exists, skipping...`);
      return { created: 0, skipped: 1 };
    }

    const defaultCount = await prisma.quiz.count({
      where: { kind: 'HEALTH_DECLARATION', isDefaultForHealthScreening: true },
    });
    const setAsDefault = defaultCount === 0;

    const baseQuiz = {
      kind: 'HEALTH_DECLARATION' as const,
      title: HEALTH_QUIZ_TITLE,
      description:
        'Kuesioner deklarasi kesehatan: riwayat medis dan obat yang dikonsumsi (jika ada).',
      instructions:
        'Jawab setiap pertanyaan dengan memilih Ya atau Tidak. Isi pertanyaan esai jika berlaku.',
      entity: null,
      entityId: null,
      duration: null,
      passingScore: 0,
      maxAttempts: null,
      shuffleQuestions: false,
      shuffleOptions: false,
      showCorrectAnswer: false,
      isPublished: true,
      publishedAt: new Date(),
      isActive: true,
      createdBy: creator.id,
      questions: {
        create: healthDeclarationQuestions.map((q) => ({
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
    };

    if (setAsDefault) {
      await prisma.$transaction(async (tx) => {
        await tx.quiz.updateMany({
          where: { isDefaultForHealthScreening: true },
          data: { isDefaultForHealthScreening: false },
        });
        await tx.quiz.create({
          data: {
            ...baseQuiz,
            isDefaultForHealthScreening: true,
          },
        });
      });
      console.log(
        `✅ Created health quiz: ${HEALTH_QUIZ_TITLE} (${healthDeclarationQuestions.length} questions, set as default health screening template)`,
      );
    } else {
      await prisma.quiz.create({
        data: {
          ...baseQuiz,
          isDefaultForHealthScreening: false,
        },
      });
      console.log(
        `✅ Created health quiz: ${HEALTH_QUIZ_TITLE} (${healthDeclarationQuestions.length} questions)`,
      );
    }

    return { created: 1, skipped: 0 };
  } catch (error) {
    console.error('❌ Error seeding health quizzes:', error);
    throw error;
  }
};

export default seedHealthQuizzes;
