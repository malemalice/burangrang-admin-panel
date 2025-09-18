import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function seedProductTypes() {
  console.log('🌱 Seeding product types...');

  const productTypes = [
    {
      name: 'E-Book',
      description: 'Digital books and publications',
      isActive: true,
    },
    {
      name: 'Course',
      description: 'Online courses and educational content',
      isActive: true,
    },
    {
      name: 'Video',
      description: 'Video content and tutorials',
      isActive: true,
    },
    {
      name: 'Bundle',
      description: 'Package of multiple products',
      isActive: true,
    },
    {
      name: 'Software',
      description: 'Digital software and applications',
      isActive: true,
    },
    {
      name: 'Template',
      description: 'Design templates and resources',
      isActive: true,
    },
    {
      name: 'Audio',
      description: 'Audio content and music',
      isActive: true,
    },
    {
      name: 'Document',
      description: 'PDF documents and reports',
      isActive: true,
    },
  ];

  for (const productType of productTypes) {
    await prisma.productType.upsert({
      where: { name: productType.name },
      update: productType,
      create: productType,
    });
  }

  console.log('✅ Product types seeded successfully');
}

export default seedProductTypes;
