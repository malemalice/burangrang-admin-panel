import { PrismaClient } from '@prisma/client';

export const threats = [
  {
    name: 'Slip and Fall',
    code: 'SLIP',
    description: 'Risk of slipping and falling on wet or uneven surfaces',
    isActive: true,
  },
  {
    name: 'Chemical Exposure',
    code: 'CHEM-EXP',
    description: 'Exposure to hazardous chemicals',
    isActive: true,
  },
  {
    name: 'Air Pollution',
    code: 'AIR-POL',
    description: 'Air quality and pollution concerns',
    isActive: true,
  },
  {
    name: 'Poor Posture',
    code: 'POSTURE',
    description: 'Ergonomic risks from poor posture',
    isActive: true,
  },
];

export async function seedThreats(prisma: PrismaClient, hseCategoryIds: string[]) {
  console.log('Creating threats...');
  
  // Map threats to categories
  const threatsWithCategories = [
    { ...threats[0], hseCategoryId: hseCategoryIds[0] }, // Physical Safety
    { ...threats[1], hseCategoryId: hseCategoryIds[1] }, // Chemical Safety
    { ...threats[2], hseCategoryId: hseCategoryIds[2] }, // Environmental
    { ...threats[3], hseCategoryId: hseCategoryIds[3] }, // Ergonomics
  ];

  const createdThreats = await Promise.all(
    threatsWithCategories.map((threat) =>
      prisma.threat.create({
        data: threat,
      })
    )
  );
  console.log('Created threats:', createdThreats.map((t) => t.name));
  return createdThreats;
} 