import { PrismaClient } from '@prisma/client';

type RiskEquipmentSeed = {
  workClassificationCode: string;
  riskCode: string;
  safetyEquipmentCode: string;
  notes?: string;
};

export async function seedWorkClassificationRiskMitigations(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Classification risk mitigation rows (Risk + SafetyEquipment)...');

  // Example rows. Update these codes to match your seeded master data.
  const seeds: RiskEquipmentSeed[] = [
    {
      workClassificationCode: 'HW',
      riskCode: 'FIRE',
      safetyEquipmentCode: 'FIRE-EXT-01',
      notes: 'Fire extinguisher must be available near hot work area',
    },
    {
      workClassificationCode: 'HW',
      riskCode: 'EYE',
      safetyEquipmentCode: 'FACE-SHIELD-01',
    },
    {
      workClassificationCode: 'HEIGHT',
      riskCode: 'FALL',
      safetyEquipmentCode: 'SAFETY-HARNESS-01',
    },
  ];

  const byWc = new Map<string, RiskEquipmentSeed[]>();
  for (const s of seeds) {
    byWc.set(s.workClassificationCode, [...(byWc.get(s.workClassificationCode) ?? []), s]);
  }

  for (const [workClassificationCode, rows] of byWc.entries()) {
    const wc = await prisma.workClassification.findUnique({
      where: { code: workClassificationCode },
      select: { id: true },
    });
    if (!wc) continue;

    await prisma.workClassificationRiskEquipment.deleteMany({
      where: { workClassificationId: wc.id },
    });

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;

      const risk = await (prisma as any).risk.findUnique({
        where: { code: r.riskCode },
        select: { id: true },
      });
      const se = await prisma.safetyEquipment.findUnique({
        where: { code: r.safetyEquipmentCode },
        select: { id: true },
      });

      if (!risk || !se) continue;

      await prisma.workClassificationRiskEquipment.create({
        data: {
          workClassificationId: wc.id,
          riskId: risk.id,
          safetyEquipmentId: se.id,
          notes: r.notes ?? undefined,
          order: i,
        },
      });
    }
  }

  console.log('✅ Seeded work classification risk mitigation rows');
}

