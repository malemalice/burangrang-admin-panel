import { PrismaClient } from '@prisma/client';

export const threatMitigations = [
  {
    level: 1,
    mitigationDescription: 'Regular cleaning and maintenance of floors',
    isActive: true,
  },
  {
    level: 2,
    mitigationDescription: 'Install non-slip mats and warning signs',
    isActive: true,
  },
  {
    level: 1,
    mitigationDescription: 'Proper PPE usage and training',
    isActive: true,
  },
  {
    level: 2,
    mitigationDescription: 'Regular air quality monitoring',
    isActive: true,
  },
  {
    level: 1,
    mitigationDescription: 'Ergonomic workstation setup',
    isActive: true,
  },
  {
    level: 2,
    mitigationDescription: 'Regular breaks and stretching exercises',
    isActive: true,
  },
];

export async function seedThreatMitigations(prisma: PrismaClient, threatIds: string[]) {
  console.log('Creating threat mitigations...');
  
  // Map mitigations to threats (2 mitigations per threat)
  const mitigationsWithThreats = [
    { ...threatMitigations[0], threatId: threatIds[0] }, // Slip and Fall - Level 1
    { ...threatMitigations[1], threatId: threatIds[0] }, // Slip and Fall - Level 2
    { ...threatMitigations[2], threatId: threatIds[1] }, // Chemical Exposure - Level 1
    { ...threatMitigations[3], threatId: threatIds[2] }, // Air Pollution - Level 1
    { ...threatMitigations[4], threatId: threatIds[3] }, // Poor Posture - Level 1
    { ...threatMitigations[5], threatId: threatIds[3] }, // Poor Posture - Level 2
  ];

  const createdMitigations = await Promise.all(
    mitigationsWithThreats.map((mitigation) =>
      prisma.threatMitigation.create({
        data: mitigation,
      })
    )
  );
  console.log('Created threat mitigations:', createdMitigations.length);
  return createdMitigations;
} 