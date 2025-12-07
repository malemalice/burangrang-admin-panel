import { PrismaClient } from '@prisma/client';

export async function seedCategories(prisma: PrismaClient): Promise<any[]> {
  console.log('🌱 Seeding mental health categories...');

  try {
    // Create root categories for mental health
    const mentalHealth = await prisma.category.upsert({
      where: { slug: 'mental-health' },
      update: {},
      create: {
        name: 'Mental Health & Wellness',
        slug: 'mental-health',
        description: 'Comprehensive mental health resources, courses, and tools for personal growth and healing',
        order: 1,
        isActive: true,
      },
    });

    const therapy = await prisma.category.upsert({
      where: { slug: 'therapy-courses' },
      update: {},
      create: {
        name: 'Therapy & Counseling',
        slug: 'therapy-courses',
        description: 'Professional therapy courses and counseling resources',
        parentId: mentalHealth.id,
        order: 1,
        isActive: true,
      },
    });

    const mindfulness = await prisma.category.upsert({
      where: { slug: 'mindfulness-meditation' },
      update: {},
      create: {
        name: 'Mindfulness & Meditation',
        slug: 'mindfulness-meditation',
        description: 'Mindfulness practices, meditation techniques, and awareness training',
        parentId: mentalHealth.id,
        order: 2,
        isActive: true,
      },
    });

    const selfHelp = await prisma.category.upsert({
      where: { slug: 'self-help-resources' },
      update: {},
      create: {
        name: 'Self-Help & Personal Development',
        slug: 'self-help-resources',
        description: 'Self-help guides, personal development tools, and healing resources',
        parentId: mentalHealth.id,
        order: 3,
        isActive: true,
      },
    });

    const wellness = await prisma.category.upsert({
      where: { slug: 'wellness-tools' },
      update: {},
      create: {
        name: 'Wellness Tools & Apps',
        slug: 'wellness-tools',
        description: 'Digital wellness tools, apps, and therapeutic resources',
        parentId: mentalHealth.id,
        order: 4,
        isActive: true,
      },
    });

    // Create subcategories for therapy
    await prisma.category.upsert({
      where: { slug: 'cognitive-behavioral-therapy' },
      update: {},
      create: {
        name: 'Cognitive Behavioral Therapy (CBT)',
        slug: 'cognitive-behavioral-therapy',
        description: 'CBT techniques, worksheets, and therapeutic exercises',
        parentId: therapy.id,
        order: 1,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'trauma-recovery' },
      update: {},
      create: {
        name: 'Trauma Recovery & Healing',
        slug: 'trauma-recovery',
        description: 'Trauma-informed care, healing techniques, and recovery resources',
        parentId: therapy.id,
        order: 2,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'anxiety-depression' },
      update: {},
      create: {
        name: 'Anxiety & Depression Management',
        slug: 'anxiety-depression',
        description: 'Resources for managing anxiety, depression, and mood disorders',
        parentId: therapy.id,
        order: 3,
        isActive: true,
      },
    });

    // Create subcategories for mindfulness
    await prisma.category.upsert({
      where: { slug: 'meditation-practices' },
      update: {},
      create: {
        name: 'Meditation Practices',
        slug: 'meditation-practices',
        description: 'Guided meditations, breathing exercises, and mindfulness techniques',
        parentId: mindfulness.id,
        order: 1,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'stress-management' },
      update: {},
      create: {
        name: 'Stress Management',
        slug: 'stress-management',
        description: 'Stress reduction techniques, relaxation methods, and coping strategies',
        parentId: mindfulness.id,
        order: 2,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'emotional-regulation' },
      update: {},
      create: {
        name: 'Emotional Regulation',
        slug: 'emotional-regulation',
        description: 'Techniques for understanding and managing emotions effectively',
        parentId: mindfulness.id,
        order: 3,
        isActive: true,
      },
    });

    // Create subcategories for self-help
    await prisma.category.upsert({
      where: { slug: 'personal-growth' },
      update: {},
      create: {
        name: 'Personal Growth & Development',
        slug: 'personal-growth',
        description: 'Self-improvement, goal setting, and personal transformation resources',
        parentId: selfHelp.id,
        order: 1,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'relationships-communication' },
      update: {},
      create: {
        name: 'Relationships & Communication',
        slug: 'relationships-communication',
        description: 'Building healthy relationships, communication skills, and social connections',
        parentId: selfHelp.id,
        order: 2,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'addiction-recovery' },
      update: {},
      create: {
        name: 'Addiction Recovery & Support',
        slug: 'addiction-recovery',
        description: 'Recovery programs, support resources, and healing from addictions',
        parentId: selfHelp.id,
        order: 3,
        isActive: true,
      },
    });

    // Create subcategories for wellness tools
    await prisma.category.upsert({
      where: { slug: 'mood-tracking' },
      update: {},
      create: {
        name: 'Mood Tracking & Journaling',
        slug: 'mood-tracking',
        description: 'Digital tools for mood tracking, journaling, and emotional monitoring',
        parentId: wellness.id,
        order: 1,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'sleep-wellness' },
      update: {},
      create: {
        name: 'Sleep & Wellness',
        slug: 'sleep-wellness',
        description: 'Sleep improvement, relaxation techniques, and overall wellness tools',
        parentId: wellness.id,
        order: 2,
        isActive: true,
      },
    });

    await prisma.category.upsert({
      where: { slug: 'therapeutic-exercises' },
      update: {},
      create: {
        name: 'Therapeutic Exercises & Activities',
        slug: 'therapeutic-exercises',
        description: 'Interactive exercises, worksheets, and therapeutic activities',
        parentId: wellness.id,
        order: 3,
        isActive: true,
      },
    });

    console.log('✅ Mental health categories seeded successfully');
    
    // Return all categories
    return await prisma.category.findMany();
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Categories seeding failed:', errorMessage);
    throw error;
  }
}

export default seedCategories;