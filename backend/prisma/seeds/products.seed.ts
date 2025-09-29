import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProducts() {
  console.log('🌱 Seeding products...');

  // Get a user to be the creator
  const user = await prisma.user.findFirst();
  if (!user) {
    console.log('❌ No users found. Please seed users first.');
    return;
  }

  // Get categories for products
  const categories = await prisma.category.findMany();
  if (categories.length === 0) {
    console.log('❌ No categories found. Please seed categories first.');
    return;
  }

  // Get product types
  const productTypes = await prisma.productType.findMany();
  if (productTypes.length === 0) {
    console.log('❌ No product types found. Please seed product types first.');
    return;
  }

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
      thumbnailUrl: 'https://example.com/thumbnails/react-course.jpg',
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
      thumbnailUrl: 'https://example.com/thumbnails/js-ebook.jpg',
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
      thumbnailUrl: 'https://example.com/thumbnails/typescript-video.jpg',
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
      thumbnailUrl: 'https://example.com/thumbnails/fullstack-bundle.jpg',
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
      thumbnailUrl: 'https://example.com/thumbnails/nodejs-course.jpg',
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
      thumbnailUrl: 'https://example.com/thumbnails/python-ebook.jpg',
      categoryIds: categories.length > 2 ? [categories[2].id] : [categories[0].id],
    },
  ];

  for (const productData of sampleProducts) {
    const { categoryIds, ...productInfo } = productData;
    
    const product = await prisma.product.upsert({
      where: { sku: productInfo.sku },
      update: productInfo,
      create: {
        ...productInfo,
        createdBy: user.id,
        categories: {
          create: categoryIds.map(categoryId => ({
            categoryId,
          })),
        },
      },
      include: {
        categories: true,
      },
    });

    console.log(`✅ Created/Updated product: ${product.name} (${product.sku})`);
  }

  console.log('🎉 Products seeding completed!');
}

export default seedProducts;
