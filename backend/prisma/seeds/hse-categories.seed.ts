import { PrismaClient } from '@prisma/client';

export const hseCategories = [
  {
    name: 'Natural Disaster',
    code: 'NAT-DIS',
    description: 'Natural disaster related hazards and risks',
    isActive: true,
  },
  {
    name: 'HSE - Physical Hazard',
    code: 'PHY-HAZ',
    description: 'Physical hazards in the workplace',
    isActive: true,
  },
  {
    name: 'HSE - Mechanical Hazard',
    code: 'MECH-HAZ',
    description: 'Mechanical and equipment related hazards',
    isActive: true,
  },
  {
    name: 'HSE - Ergonomic Hazard',
    code: 'ERG-HAZ',
    description: 'Ergonomic and workplace design hazards',
    isActive: true,
  },
  {
    name: 'HSE - Environmental Hazard',
    code: 'ENV-HAZ',
    description: 'Environmental impact and pollution hazards',
    isActive: true,
  },
  {
    name: 'HSE - Chemical Hazard',
    code: 'CHEM-HAZ',
    description: 'Chemical exposure and handling hazards',
    isActive: true,
  },
  {
    name: 'HSE - Biological Hazard',
    code: 'BIO-HAZ',
    description: 'Biological and health related hazards',
    isActive: true,
  },
  {
    name: 'Government Permit & License',
    code: 'GOV-PERM',
    description: 'Administrative and regulatory compliance requirements',
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