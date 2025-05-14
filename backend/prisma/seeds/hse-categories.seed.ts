import { PrismaClient } from '@prisma/client';

export const hseCategories = [
  {
    name: 'Physical Safety',
    code: 'PHY',
    description: 'Physical safety hazards and risks in the workplace',
    isActive: true,
  },
  {
    name: 'Chemical Safety',
    code: 'CHEM',
    description: 'Chemical hazards and exposure risks',
    isActive: true,
  },
  {
    name: 'Environmental',
    code: 'ENV',
    description: 'Environmental impact and sustainability concerns',
    isActive: true,
  },
  {
    name: 'Ergonomics',
    code: 'ERG',
    description: 'Workplace ergonomics and human factors',
    isActive: true,
  },
];

export async function seedHseCategories(prisma: PrismaClient) {
  console.log('Creating HSE categories...');
  const createdCategories = await Promise.all(
    hseCategories.map((category) =>
      prisma.hseCategory.create({
        data: category,
      })
    )
  );
  console.log('Created HSE categories:', createdCategories.map((c) => c.name));
  return createdCategories;
} 