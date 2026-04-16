import { PrismaClient } from '@prisma/client';

/** Must match `WORK_CLASSIFICATION_OTHER_CODE` in frontend workClassification constants */
export const SEED_WORK_CLASSIFICATION_OTHER_CODE = 'OTHERS';

/** Risk / safety equipment codes must exist in risks.seed and safety-equipments.seed.ts */

type RiskEquipmentTemplateRow = {
  workClassificationCode: string;
  riskCode: string;
  safetyEquipmentCode: string;
  notes?: string;
};

const WORK_CLASSIFICATION_RISK_EQUIPMENT_TEMPLATES: RiskEquipmentTemplateRow[] = [
  {
    workClassificationCode: 'HW',
    riskCode: 'BURNS',
    safetyEquipmentCode: 'GLOVES_WELDING_L',
    notes: 'Heat / welding gloves for hot work',
  },
  {
    workClassificationCode: 'HW',
    riskCode: 'FIRE-SC',
    safetyEquipmentCode: 'GOGGLES_TINTED_ONESIZE',
    notes: 'Eye protection for sparks / arc',
  },
  {
    workClassificationCode: 'HW',
    riskCode: 'NOISE-HL',
    safetyEquipmentCode: 'EAR_MUFF_ADJUSTABLE',
  },
  {
    workClassificationCode: 'HEIGHT',
    riskCode: 'FALL-HGT',
    safetyEquipmentCode: 'HARNESS_FULL_BODY_STD',
  },
  {
    workClassificationCode: 'HEIGHT',
    riskCode: 'FALL-HGT',
    safetyEquipmentCode: 'LANYARD_SHOCK_ABS',
    notes: 'Use with approved full body harness',
  },
  {
    workClassificationCode: 'ELEC',
    riskCode: 'ELEC-SHOCK',
    safetyEquipmentCode: 'GOGGLES_CLEAR_ONESIZE',
  },
  {
    workClassificationCode: 'CS',
    riskCode: 'CHEM-EXP',
    safetyEquipmentCode: 'GOGGLES_CLEAR_ONESIZE',
  },
  {
    workClassificationCode: 'CS',
    riskCode: 'CO2-POISON',
    safetyEquipmentCode: 'EAR_PLUG_DISPOSABLE',
    notes: 'Hearing protection where required in confined space operations',
  },
  {
    workClassificationCode: 'EXC',
    riskCode: 'FALL-OBJ',
    safetyEquipmentCode: 'HELMET_FULL_BRIM_M',
  },
  {
    workClassificationCode: 'PLUMB',
    riskCode: 'SLIP-FLOOR',
    safetyEquipmentCode: 'SHOES_STEEL_TOE_42',
  },
  {
    workClassificationCode: 'PAINT',
    riskCode: 'CHEM-EXP',
    safetyEquipmentCode: 'GOGGLES_CLEAR_ONESIZE',
  },
  {
    workClassificationCode: 'MAINT',
    riskCode: 'MSD',
    safetyEquipmentCode: 'VEST_HI_VIS_L',
  },
  {
    workClassificationCode: 'MAINT',
    riskCode: 'FALL-OBJ',
    safetyEquipmentCode: 'HELMET_FULL_BRIM_M',
  },
  {
    workClassificationCode: 'OTHERS',
    riskCode: 'PED-HIT',
    safetyEquipmentCode: 'VEST_HI_VIS_L',
    notes: 'High-visibility when working near vehicle / plant movement',
  },
];

/**
 * Template rows on `WorkClassificationRiskEquipment` (risk + safety equipment per classification).
 * Run after `m_risk` and `m_safety_equipment` seeds. Safe to re-run (replaces rows per classification).
 */
export async function seedWorkClassificationRiskMitigations(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Classification risk–equipment templates (Risk + SafetyEquipment)...');

  const byWc = new Map<string, RiskEquipmentTemplateRow[]>();
  for (const s of WORK_CLASSIFICATION_RISK_EQUIPMENT_TEMPLATES) {
    byWc.set(s.workClassificationCode, [...(byWc.get(s.workClassificationCode) ?? []), s]);
  }

  for (const [workClassificationCode, templateRows] of byWc.entries()) {
    const wc = await prisma.workClassification.findUnique({
      where: { code: workClassificationCode },
      select: { id: true },
    });
    if (!wc) continue;

    await prisma.workClassificationRiskEquipment.deleteMany({
      where: { workClassificationId: wc.id },
    });

    for (let i = 0; i < templateRows.length; i++) {
      const row = templateRows[i]!;

      const risk = await prisma.risk.findUnique({
        where: { code: row.riskCode },
        select: { id: true },
      });
      const se = await prisma.safetyEquipment.findUnique({
        where: { code: row.safetyEquipmentCode },
        select: { id: true },
      });

      if (!risk || !se) {
        console.warn(
          `⚠️  Skip WC ${workClassificationCode} template: missing risk ${row.riskCode} or safety equipment ${row.safetyEquipmentCode}`,
        );
        continue;
      }

      await prisma.workClassificationRiskEquipment.create({
        data: {
          workClassificationId: wc.id,
          riskId: risk.id,
          safetyEquipmentId: se.id,
          notes: row.notes ?? undefined,
          order: i,
        },
      });
    }
  }

  console.log('✅ Seeded work classification risk–equipment templates');
}

export async function seedWorkClassifications(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Classification master data...');

  const rows = [
    {
      name: 'Hot Work',
      code: 'HW',
      description: 'Welding, cutting, grinding operations',
    },
    {
      name: 'Electrical Work',
      code: 'ELEC',
      description: 'Electrical installation and maintenance',
    },
    {
      name: 'Confined Space',
      code: 'CS',
      description: 'Work in confined spaces',
    },
    {
      name: 'Height Work',
      code: 'HEIGHT',
      description: 'Work at height above 1.5 meters',
    },
    {
      name: 'Excavation',
      code: 'EXC',
      description: 'Digging and excavation work',
    },
    {
      name: 'Plumbing',
      code: 'PLUMB',
      description: 'Plumbing installation and repair',
    },
    {
      name: 'Painting',
      code: 'PAINT',
      description: 'Painting and coating work',
    },
    {
      name: 'General Maintenance',
      code: 'MAINT',
      description: 'General maintenance work',
    },
    {
      name: 'Lainnya / Others',
      code: SEED_WORK_CLASSIFICATION_OTHER_CODE,
      description:
        'Other work types — specify in work permit (workClassificationOtherDetail)',
    },
  ];

  for (const classification of rows) {
    await prisma.workClassification.upsert({
      where: { code: classification.code },
      update: classification,
      create: classification,
    });
  }

  console.log(`✅ Upserted ${rows.length} work classifications`);

  await seedWorkClassificationRiskMitigations(prisma);
}
