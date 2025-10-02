import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('🌱 Seeding products...');

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

  const sampleProducts = [
    {
      name: 'Complete React Development Course',
      slug: 'complete-react-development-course',
      description: 'Master React from basics to advanced concepts including hooks, context, and modern patterns.',
      shortDescription: 'Learn React development from scratch to advanced level',
      price: 99.99,
      salePrice: 79.99,
      sku: 'REACT-001',
      productType: 'COURSE',
      status: 'PUBLISHED',
      stockQuantity: 100,
      downloadLimit: 5,
      thumbnailUrl: 'https://picsum.photos/400/300?random=1',
      categoryIds: [categories[0].id],
    },
    {
      name: 'JavaScript Fundamentals eBook',
      slug: 'javascript-fundamentals-ebook',
      description: 'A comprehensive guide to JavaScript fundamentals including ES6+ features, async programming, and best practices.',
      shortDescription: 'Complete guide to JavaScript fundamentals',
      price: 29.99,
      sku: 'JS-001',
      productType: 'EBOOK',
      status: 'PUBLISHED',
      stockQuantity: 1000,
      downloadLimit: 3,
      thumbnailUrl: 'https://picsum.photos/400/300?random=2',
      categoryIds: [categories[0].id],
    },
    {
      name: 'Advanced TypeScript Video Series',
      slug: 'advanced-typescript-video-series',
      description: 'Deep dive into TypeScript advanced features including generics, decorators, and advanced type manipulation.',
      shortDescription: 'Master advanced TypeScript concepts',
      price: 149.99,
      sku: 'TS-001',
      productType: 'VIDEO',
      status: 'PUBLISHED',
      stockQuantity: 50,
      downloadLimit: 10,
      thumbnailUrl: 'https://picsum.photos/400/300?random=3',
      categoryIds: categories.length > 1 ? [categories[1].id] : [categories[0].id],
    },
    {
      name: 'Full Stack Developer Bundle',
      slug: 'full-stack-developer-bundle',
      description: 'Complete package including frontend, backend, and DevOps courses for becoming a full-stack developer.',
      shortDescription: 'Complete full-stack development package',
      price: 299.99,
      salePrice: 199.99,
      sku: 'FULLSTACK-001',
      productType: 'BUNDLE',
      status: 'PUBLISHED',
      stockQuantity: 25,
      downloadLimit: 15,
      thumbnailUrl: 'https://picsum.photos/400/300?random=4',
      categoryIds: categories.slice(0, 2).map(c => c.id),
    },
    {
      name: 'Node.js Backend Development',
      slug: 'nodejs-backend-development',
      description: 'Learn to build robust backend applications with Node.js, Express, and modern development practices.',
      shortDescription: 'Master Node.js backend development',
      price: 89.99,
      sku: 'NODE-001',
      productType: 'COURSE',
      status: 'REVIEW',
      stockQuantity: 75,
      downloadLimit: 5,
      thumbnailUrl: 'https://picsum.photos/400/300?random=5',
      categoryIds: [categories[0].id],
    },
    {
      name: 'Python Data Science Handbook',
      slug: 'python-data-science-handbook',
      description: 'Comprehensive guide to data science with Python, covering pandas, numpy, matplotlib, and machine learning.',
      shortDescription: 'Complete Python data science guide',
      price: 49.99,
      sku: 'PYTHON-001',
      productType: 'EBOOK',
      status: 'DRAFT',
      stockQuantity: 500,
      downloadLimit: 3,
      thumbnailUrl: 'https://picsum.photos/400/300?random=6',
      categoryIds: categories.length > 2 ? [categories[2].id] : [categories[0].id],
    },
  ];

    let successCount = 0;
    let errorCount = 0;

    for (const productData of sampleProducts) {
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

    console.log(`🎉 Products seeding completed! Success: ${successCount}, Errors: ${errorCount}`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Products seeding failed:', errorMessage);
    throw error;
  }
}

export default seedProducts;
