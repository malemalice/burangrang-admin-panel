import { PrismaClient } from '@prisma/client';

export const riskMitigations = [
  {
    eliminationControl: 'Remove the source of risk completely',
    engineeringControl: 'Implement regular cleaning and maintenance of floors',
    isActive: true,
  },
  {
    engineeringControl: 'Install non-slip mats and warning signs',
    accept: 'Accept residual risk with proper training',
    isActive: true,
  },
  {
    eliminationControl: 'Remove hazardous chemicals from workplace',
    personalProtectiveEquipment: 'Proper PPE usage and training',
    isActive: true,
  },
  {
    engineeringControl: 'Regular air quality monitoring',
    transfer: 'Transfer to specialized environmental service provider',
    isActive: true,
  },
  {
    eliminationControl: 'Remove ergonomic hazards through workstation redesign',
    engineeringControl: 'Ergonomic workstation setup',
    isActive: true,
  },
  {
    administrationControl: 'Regular breaks and stretching exercises',
    accept: 'Accept with medical monitoring',
    isActive: true,
  },
];

export async function seedRiskMitigations(prisma: PrismaClient, riskIds: string[]) {
  console.log('Creating risk mitigations...');
  
  // Map mitigations to risks (2 mitigations per risk)
  const mitigationsWithRisks = [
    { ...riskMitigations[0], riskId: riskIds[0] }, // Slip and Fall
    { ...riskMitigations[1], riskId: riskIds[0] }, // Slip and Fall
    { ...riskMitigations[2], riskId: riskIds[1] }, // Chemical Exposure
    { ...riskMitigations[3], riskId: riskIds[2] }, // Air Pollution
    { ...riskMitigations[4], riskId: riskIds[3] }, // Poor Posture
    { ...riskMitigations[5], riskId: riskIds[3] }, // Poor Posture
  ];

  const createdMitigations = await Promise.all(
    mitigationsWithRisks.map((mitigation) =>
      (prisma as any).riskMitigation.create({
        data: mitigation,
      })
    )
  );
  console.log('Created risk mitigations:', createdMitigations.length);
  return createdMitigations;
}
