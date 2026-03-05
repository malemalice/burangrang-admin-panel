import { PrismaClient } from '@prisma/client';

export const riskCategories = [
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
  // Security-related categories (code prefix SEC-) — names match incident category labels from security dashboard
  { name: 'Inappropriate behavior (CP) (Major)', code: 'SEC-IBH', description: 'Inappropriate behavior (CP)', isActive: true },
  { name: 'Sabotage (Major)', code: 'SEC-SAB', description: 'Sabotage (Major)', isActive: true },
  { name: 'Confrontation / Assault (Major)', code: 'SEC-ASL', description: 'Confrontation / Assault (Major)', isActive: true },
  { name: 'External Dispute (Major)', code: 'SEC-EXD', description: 'External Dispute (Major)', isActive: true },
  { name: 'Trespasser / Intruder (Moderate)', code: 'SEC-TRS', description: 'Trespasser / Intruder (Moderate)', isActive: true },
  { name: 'Internal Dispute', code: 'SEC-IND', description: 'Internal Dispute', isActive: true },
  { name: 'Access Without RFID / Access Violation', code: 'SEC-ACC', description: 'Access Without RFID / Access Violation', isActive: true },
  { name: 'Traffic Violation', code: 'SEC-TRF', description: 'Traffic Violation', isActive: true },
  { name: 'Vandalism', code: 'SEC-VND', description: 'Vandalism', isActive: true },
  { name: 'Theft', code: 'SEC-THF', description: 'Theft', isActive: true },
  { name: 'Smoking / Vaping', code: 'SEC-SMK', description: 'Smoking / Vaping', isActive: true },
  { name: 'Lost and Found', code: 'SEC-LST', description: 'Lost and Found', isActive: true },
  { name: 'Others', code: 'SEC-OTH', description: 'Other security incidents', isActive: true },
];

export async function seedRiskCategories(prisma: PrismaClient) {
  console.log('Creating risk categories...');
  const createdCategories = await Promise.all(
    riskCategories.map((category) =>
      (prisma as any).riskCategory.create({
        data: category,
      })
    )
  );
  console.log('Created risk categories:', createdCategories.map((c) => c.name));
  return createdCategories;
} 