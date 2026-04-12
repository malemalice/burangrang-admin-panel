import { HseTargetTypeEnum, MonthEnum } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

/**
 * Seed data for KPI HSE Targets
 * Creates sample HSE targets for incident, risk, inspection, and audit types
 */
export async function seedKpiHseTargets(): Promise<void> {

  try {
    console.log('🎯 Seeding KPI HSE Targets...');

    const user = await prisma.user.findFirst({
      where: { isActive: true },
    });

    if (!user) {
      console.log('⚠️  No active user found. Skipping KPI HSE targets seed.');
      return;
    }

    const currentYear = new Date().getFullYear();
    const allMonths: MonthEnum[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Define targets: { type, code, name, month?, year, target }
    const targets: Array<{
      type: HseTargetTypeEnum;
      code: string;
      name: string;
      month?: MonthEnum | null;
      year: number;
      target: number;
    }> = [];

    // INCIDENT: FATALITY (0), MAJOR (2), MINOR (5), NEAR_MISS (10), HAZARD (15)
    for (const row of [
      { code: 'FATALITY', name: 'Fatality', target: 0 },
      { code: 'MAJOR', name: 'Major', target: 2 },
      { code: 'MINOR', name: 'Minor', target: 5 },
      { code: 'NEAR_MISS', name: 'Near Miss', target: 10 },
      { code: 'HAZARD', name: 'Hazard', target: 15 },
    ]) {
      targets.push({ type: HseTargetTypeEnum.INCIDENT, code: row.code, name: row.name, month: null, year: currentYear, target: row.target });
      // Add monthly for JAN as sample
      targets.push({ type: HseTargetTypeEnum.INCIDENT, code: row.code, name: row.name, month: MonthEnum.JAN, year: currentYear, target: row.target });
    }

    // RISK: HIGH (3), EXTREME (0)
    for (const row of [
      { code: 'HIGH', name: 'High Risk', target: 3 },
      { code: 'EXTREME', name: 'Extreme Risk', target: 0 },
    ]) {
      targets.push({ type: HseTargetTypeEnum.RISK, code: row.code, name: row.name, month: null, year: currentYear, target: row.target });
    }

    // INSPECTION: SCHEDULED (12 per year)
    targets.push({ type: HseTargetTypeEnum.INSPECTION, code: 'SCHEDULED', name: 'Scheduled Inspections', month: null, year: currentYear, target: 12 });

    // AUDIT: COMPLIANCE (95%)
    targets.push({ type: HseTargetTypeEnum.AUDIT, code: 'COMPLIANCE', name: 'Compliance Rate (%)', month: null, year: currentYear, target: 95 });

    let createdCount = 0;

    for (const t of targets) {
      try {
        const existing = await prisma.hseTarget.findFirst({
          where: {
            type: t.type,
            code: t.code,
            month: t.month ?? null,
            year: t.year,
          },
        });

        if (existing) {
          await prisma.hseTarget.update({
            where: { id: existing.id },
            data: { target: t.target },
          });
        } else {
          await prisma.hseTarget.create({
            data: {
              type: t.type,
              code: t.code,
              name: t.name,
              month: t.month ?? undefined,
              year: t.year,
              target: t.target,
              createdBy: user.id,
            },
          });
        }
        createdCount++;
      } catch (error: any) {
        if (error.code !== 'P2002') {
          console.error(`Error creating HSE target ${t.type}/${t.code}:`, error.message);
        }
      }
    }

    console.log(`   ✅ Created/Updated ${createdCount} KPI HSE target records`);
  } catch (error) {
    console.error('❌ Error seeding KPI HSE targets:', error);
    throw error;
  }
}
