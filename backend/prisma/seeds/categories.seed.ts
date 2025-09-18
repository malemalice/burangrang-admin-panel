import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedCategories() {
  console.log('🌱 Seeding categories...');

  // Create root categories
  const digitalProducts = await prisma.category.upsert({
    where: { slug: 'digital-products' },
    update: {},
    create: {
      name: 'Digital Products',
      slug: 'digital-products',
      description: 'All digital products including ebooks, courses, and software',
      order: 1,
      isActive: true,
    },
  });

  const ebooks = await prisma.category.upsert({
    where: { slug: 'ebooks' },
    update: {},
    create: {
      name: 'Ebooks',
      slug: 'ebooks',
      description: 'Digital books and publications',
      parentId: digitalProducts.id,
      order: 1,
      isActive: true,
    },
  });

  const courses = await prisma.category.upsert({
    where: { slug: 'courses' },
    update: {},
    create: {
      name: 'Online Courses',
      slug: 'courses',
      description: 'Educational courses and training materials',
      parentId: digitalProducts.id,
      order: 2,
      isActive: true,
    },
  });

  const software = await prisma.category.upsert({
    where: { slug: 'software' },
    update: {},
    create: {
      name: 'Software & Tools',
      slug: 'software',
      description: 'Software applications and digital tools',
      parentId: digitalProducts.id,
      order: 3,
      isActive: true,
    },
  });

  // Create subcategories for ebooks
  await prisma.category.upsert({
    where: { slug: 'business-ebooks' },
    update: {},
    create: {
      name: 'Business & Finance',
      slug: 'business-ebooks',
      description: 'Business strategy, finance, and entrepreneurship ebooks',
      parentId: ebooks.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'technology-ebooks' },
    update: {},
    create: {
      name: 'Technology',
      slug: 'technology-ebooks',
      description: 'Technology, programming, and IT ebooks',
      parentId: ebooks.id,
      order: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'self-help-ebooks' },
    update: {},
    create: {
      name: 'Self-Help & Personal Development',
      slug: 'self-help-ebooks',
      description: 'Personal development and self-improvement ebooks',
      parentId: ebooks.id,
      order: 3,
      isActive: true,
    },
  });

  // Create subcategories for courses
  await prisma.category.upsert({
    where: { slug: 'programming-courses' },
    update: {},
    create: {
      name: 'Programming & Development',
      slug: 'programming-courses',
      description: 'Programming languages and software development courses',
      parentId: courses.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'design-courses' },
    update: {},
    create: {
      name: 'Design & Creative',
      slug: 'design-courses',
      description: 'Graphic design, UI/UX, and creative courses',
      parentId: courses.id,
      order: 2,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'marketing-courses' },
    update: {},
    create: {
      name: 'Marketing & Sales',
      slug: 'marketing-courses',
      description: 'Digital marketing, sales, and business growth courses',
      parentId: courses.id,
      order: 3,
      isActive: true,
    },
  });

  // Create subcategories for software
  await prisma.category.upsert({
    where: { slug: 'productivity-software' },
    update: {},
    create: {
      name: 'Productivity Tools',
      slug: 'productivity-software',
      description: 'Tools to improve productivity and workflow',
      parentId: software.id,
      order: 1,
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'development-tools' },
    update: {},
    create: {
      name: 'Development Tools',
      slug: 'development-tools',
      description: 'Software development and programming tools',
      parentId: software.id,
      order: 2,
      isActive: true,
    },
  });

  console.log('✅ Categories seeded successfully');
}

export default seedCategories;
