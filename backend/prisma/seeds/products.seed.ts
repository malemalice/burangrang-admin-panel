import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('🌱 Seeding mental health products...');

  try {
    // Get a user to be the creator
    const user = await prisma.user.findFirst();
    if (!user) {
      throw new Error('No users found. Please seed users first.');
    }

    // Get categories for products
    const categories = await prisma.category.findMany();
    if (categories.length === 0) {
      throw new Error('No categories found. Please seed categories first.');
    }

    // Get product types
    const productTypes = await prisma.productType.findMany();
    if (productTypes.length === 0) {
      throw new Error('No product types found. Please seed product types first.');
    }

    console.log(`📊 Found ${categories.length} categories and ${productTypes.length} product types`);

    const mentalHealthProducts = [
      {
        name: 'Complete CBT Mastery Course',
        slug: 'complete-cbt-mastery-course',
        description: 'Master Cognitive Behavioral Therapy techniques for anxiety, depression, and emotional regulation. Learn evidence-based strategies to transform negative thought patterns and build lasting mental wellness.',
        shortDescription: 'Comprehensive CBT course for mental health professionals and self-learners',
        price: 199.99,
        salePrice: 149.99,
        sku: 'CBT-001',
        productType: 'COURSE',
        status: 'PUBLISHED',
        stockQuantity: 100,
        downloadLimit: 5,
        thumbnailUrl: 'https://picsum.photos/400/300?random=1',
        categoryIds: [categories.find(c => c.slug === 'cognitive-behavioral-therapy')?.id || categories[0].id],
      },
      {
        name: 'Mindfulness Meditation Guide eBook',
        slug: 'mindfulness-meditation-guide-ebook',
        description: 'A comprehensive guide to mindfulness meditation practices, breathing techniques, and awareness exercises. Perfect for beginners and those looking to deepen their meditation practice.',
        shortDescription: 'Complete guide to mindfulness and meditation practices',
        price: 29.99,
        sku: 'MINDFUL-001',
        productType: 'EBOOK',
        status: 'PUBLISHED',
        stockQuantity: 1000,
        downloadLimit: 3,
        thumbnailUrl: 'https://picsum.photos/400/300?random=2',
        categoryIds: [categories.find(c => c.slug === 'meditation-practices')?.id || categories[0].id],
      },
      {
        name: 'Trauma Recovery Video Series',
        slug: 'trauma-recovery-video-series',
        description: 'Professional video series on trauma-informed care, healing techniques, and recovery strategies. Created by licensed therapists specializing in trauma recovery.',
        shortDescription: 'Professional trauma recovery and healing video series',
        price: 299.99,
        sku: 'TRAUMA-001',
        productType: 'VIDEO',
        status: 'PUBLISHED',
        stockQuantity: 50,
        downloadLimit: 10,
        thumbnailUrl: 'https://picsum.photos/400/300?random=3',
        categoryIds: [categories.find(c => c.slug === 'trauma-recovery')?.id || categories[0].id],
      },
      {
        name: 'Mental Wellness Complete Bundle',
        slug: 'mental-wellness-complete-bundle',
        description: 'Complete package including CBT course, mindfulness guide, stress management tools, and therapeutic exercises. Everything you need for comprehensive mental wellness.',
        shortDescription: 'Complete mental wellness package with courses, guides, and tools',
        price: 499.99,
        salePrice: 299.99,
        sku: 'WELLNESS-001',
        productType: 'BUNDLE',
        status: 'PUBLISHED',
        stockQuantity: 25,
        downloadLimit: 15,
        thumbnailUrl: 'https://picsum.photos/400/300?random=4',
        categoryIds: [
          categories.find(c => c.slug === 'cognitive-behavioral-therapy')?.id || categories[0].id,
          categories.find(c => c.slug === 'mindfulness-meditation')?.id || categories[1].id,
        ],
      },
      {
        name: 'Anxiety Management Workshop',
        slug: 'anxiety-management-workshop',
        description: 'Interactive workshop on anxiety management techniques, panic attack prevention, and building resilience. Includes practical exercises and coping strategies.',
        shortDescription: 'Comprehensive anxiety management and coping strategies workshop',
        price: 89.99,
        sku: 'ANXIETY-001',
        productType: 'COURSE',
        status: 'REVIEW',
        stockQuantity: 75,
        downloadLimit: 5,
        thumbnailUrl: 'https://picsum.photos/400/300?random=5',
        categoryIds: [categories.find(c => c.slug === 'anxiety-depression')?.id || categories[0].id],
      },
      {
        name: 'Emotional Intelligence Handbook',
        slug: 'emotional-intelligence-handbook',
        description: 'Comprehensive guide to developing emotional intelligence, understanding emotions, and improving interpersonal relationships. Essential for personal and professional growth.',
        shortDescription: 'Complete guide to emotional intelligence and relationship skills',
        price: 39.99,
        sku: 'EQ-001',
        productType: 'EBOOK',
        status: 'DRAFT',
        stockQuantity: 500,
        downloadLimit: 3,
        thumbnailUrl: 'https://picsum.photos/400/300?random=6',
        categoryIds: [categories.find(c => c.slug === 'emotional-regulation')?.id || categories[0].id],
      },
      {
        name: 'Sleep Wellness Toolkit',
        slug: 'sleep-wellness-toolkit',
        description: 'Digital toolkit for improving sleep quality, managing insomnia, and establishing healthy sleep routines. Includes guided meditations, sleep tracking tools, and relaxation techniques.',
        shortDescription: 'Complete toolkit for better sleep and relaxation',
        price: 49.99,
        sku: 'SLEEP-001',
        productType: 'EBOOK',
        status: 'PUBLISHED',
        stockQuantity: 200,
        downloadLimit: 5,
        thumbnailUrl: 'https://picsum.photos/400/300?random=7',
        categoryIds: [categories.find(c => c.slug === 'sleep-wellness')?.id || categories[0].id],
      },
      {
        name: 'Mood Tracking & Journaling App',
        slug: 'mood-tracking-journaling-app',
        description: 'Digital app for mood tracking, emotional journaling, and mental health monitoring. Features include mood charts, gratitude journaling, and progress tracking.',
        shortDescription: 'Digital mood tracking and emotional journaling application',
        price: 19.99,
        sku: 'MOOD-001',
        productType: 'EBOOK',
        status: 'PUBLISHED',
        stockQuantity: 1000,
        downloadLimit: 1,
        thumbnailUrl: 'https://picsum.photos/400/300?random=8',
        categoryIds: [categories.find(c => c.slug === 'mood-tracking')?.id || categories[0].id],
      },
    ];

    let successCount = 0;
    let errorCount = 0;

    for (const productData of mentalHealthProducts) {
      try {
        const { categoryIds, ...productInfo } = productData;
        
        // Validate that all category IDs exist
        const validCategoryIds = categoryIds.filter(categoryId => 
          categories.some(cat => cat.id === categoryId)
        );
        
        if (validCategoryIds.length !== categoryIds.length) {
          const invalidIds = categoryIds.filter(id => !validCategoryIds.includes(id));
          console.warn(`⚠️  Invalid category IDs for product ${productInfo.sku}: ${invalidIds.join(', ')}`);
        }

        const product = await prisma.product.upsert({
          where: { sku: productInfo.sku },
          update: {
            ...productInfo,
            categories: {
              deleteMany: {}, // Remove existing category relations
              create: validCategoryIds.map(categoryId => ({
                categoryId,
              })),
            },
          },
          create: {
            ...productInfo,
            createdBy: user.id,
            categories: {
              create: validCategoryIds.map(categoryId => ({
                categoryId,
              })),
            },
          },
          include: {
            categories: {
              include: {
                category: true,
              },
            },
          },
        });

        console.log(`✅ Created/Updated product: ${product.name} (${product.sku}) with ${product.categories.length} categories`);
        successCount++;
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`❌ Failed to create/update product ${productData.sku}:`, errorMessage);
        errorCount++;
      }
    }

    console.log(`🎉 Mental health products seeding completed! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Products seeding failed:', errorMessage);
    throw error;
  }
}

export default seedProducts;