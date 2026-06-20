/**
 * Audit Schedules seed data
 * Creates AuditPeriods and their child Audits (one per active element per period).
 */
import { CompliantStatusEnum, GeneralStatusEnum, PrismaClient } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

const addDays = (date: Date, days: number): Date => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const getRandomInt = (min: number, max: number): number => {
  const minCeil = Math.ceil(min);
  const maxFloor = Math.floor(max);
  return Math.floor(Math.random() * (maxFloor - minCeil + 1)) + minCeil;
};

const pickRandom = <T>(items: T[], count: number): T[] => {
  if (count <= 0) return [];
  if (count >= items.length) return [...items];
  const copy = [...items];
  const picked: T[] = [];
  while (picked.length < count && copy.length > 0) {
    const idx = Math.floor(Math.random() * copy.length);
    picked.push(copy.splice(idx, 1)[0]);
  }
  return picked;
};

const autoDetermineStatus = (auditDate: Date): GeneralStatusEnum => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(auditDate);
  d.setHours(0, 0, 0, 0);
  return d < today ? GeneralStatusEnum.DONE : GeneralStatusEnum.SCHEDULED;
};

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

export const seedAuditSchedules = async (
  prismaClient?: PrismaClient,
): Promise<void> => {
  const client = prismaClient || prisma;
  console.log('🌱 Seeding audit periods and schedules...');

  try {
    // ── Dependencies ────────────────────────────────────────────────────────
    const adminUser = await client.user.findFirst({
      where: { email: 'admin@example.com' },
    });
    if (!adminUser) {
      console.log('⚠️  Admin user not found. Please run users seed first.');
      return;
    }

    const auditElements = await client.auditElement.findMany({
      where: { isActive: true },
    });
    if (auditElements.length === 0) {
      console.log('⚠️  No audit elements found. Please run audit-policy seed first.');
      return;
    }

    const users = await client.user.findMany({ where: { isActive: true }, take: 10 });
    if (users.length === 0) {
      console.log('⚠️  No users found. Please run users seed first.');
      return;
    }

    // ── Clear existing data ──────────────────────────────────────────────────
    console.log('Clearing existing audit data...');
    await client.auditImage.deleteMany();
    await client.auditItemToDepartment.deleteMany();
    await client.auditItemToUser.deleteMany();
    await client.auditItem.deleteMany();
    await client.auditToUser.deleteMany();
    await client.auditToArea.deleteMany();
    await client.audit.deleteMany();
    await client.auditPeriod.deleteMany();

    // ── Build 3 periods: 2 months ago, last month, current month ────────────
    const today = new Date();
    const periodsToSeed = [
      { month: today.getMonth() - 1 < 0 ? 12 : today.getMonth(),     year: today.getMonth() - 1 < 0 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() === 0 ? 12 : today.getMonth(),        year: today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() + 1,                                   year: today.getFullYear() },
    ];
    // Normalise: JS getMonth() is 0-based, we need 1-based
    const normalised = [
      { month: today.getMonth() === 0 ? 11 : today.getMonth() - 1, year: today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() === 0 ? 12 : today.getMonth(),      year: today.getMonth() === 0 ? today.getFullYear() - 1 : today.getFullYear() },
      { month: today.getMonth() + 1,                                 year: today.getFullYear() },
    ].map(p => ({
      month: p.month === 0 ? 12 : p.month,
      year: p.month === 0 ? p.year - 1 : p.year,
    }));

    // Simple reliable approach: use today's actual month/year and offset
    const buildPeriod = (offsetMonths: number): { month: number; year: number } => {
      const d = new Date(today.getFullYear(), today.getMonth() + offsetMonths, 1);
      return { month: d.getMonth() + 1, year: d.getFullYear() };
    };
    const periods = [-2, -1, 0].map(buildPeriod);

    // Departments for item assignment
    const userDepartmentIdByUserId = new Map<string, string | null>(
      users.map((u) => [u.id, u.departmentId ?? null]),
    );
    const departmentIds = Array.from(
      new Set(users.map((u) => u.departmentId).filter((id): id is string => Boolean(id))),
    );

    let totalAuditsCreated = 0;
    let totalItemsCreated = 0;

    console.log('📅 Creating audit periods...');

    for (const { month, year } of periods) {
      const label = `${MONTH_NAMES[month - 1]} ${year}`;
      const mm = String(month).padStart(2, '0');
      const auditDate = new Date(year, month - 1, 1); // 1st of the period month
      const status = autoDetermineStatus(auditDate);

      // Create the period
      const period = await client.auditPeriod.create({
        data: {
          month,
          year,
          notes: `Seeded audit period for ${label}`,
          createdBy: adminUser.id,
        },
      });
      console.log(`   📆 Period: ${label}`);

      const auditsInPeriod: Array<{
        id: string;
        code: string;
        auditDate: Date;
        auditElementId: string;
        status: GeneralStatusEnum;
        auditorIds: string[];
      }> = [];

      // One audit per active element
      for (const element of auditElements) {
        const code = `AUD-${year}-${mm}-${element.code}`;
        const selectedAuditors = pickRandom(users, Math.min(2, users.length));

        const audit = await client.audit.create({
          data: {
            code,
            auditDate,
            auditElementId: element.id,
            periodId: period.id,
            status,
            isActive: true,
            createdBy: adminUser.id,
            auditors: {
              create: selectedAuditors.map((u) => ({ userId: u.id })),
            },
          },
        });

        auditsInPeriod.push({
          id: audit.id,
          code: audit.code,
          auditDate: audit.auditDate,
          auditElementId: audit.auditElementId,
          status: audit.status,
          auditorIds: selectedAuditors.map((u) => u.id),
        });
        totalAuditsCreated += 1;
        console.log(`      ✓ Audit: ${code} (${status})`);
      }

      // ── Seed audit items only for past periods (DONE status) ──────────────
      if (status === GeneralStatusEnum.DONE) {
        console.log(`   🧾 Seeding audit items for ${label}...`);

        for (const audit of auditsInPeriod) {
          const criteria = await client.auditCriteria.findMany({
            where: {
              isActive: true,
              auditClause: { auditElementId: audit.auditElementId },
            },
            orderBy: [{ auditClause: { order: 'asc' } }, { order: 'asc' }],
          });

          if (criteria.length === 0) continue;

          const itemCount = Math.min(criteria.length, getRandomInt(8, 12));
          const selectedCriteria = criteria.slice(0, itemCount);

          for (let i = 0; i < selectedCriteria.length; i++) {
            const criterion = selectedCriteria[i];

            const roll = Math.random();
            const compliantStatus =
              roll < 0.72
                ? CompliantStatusEnum.COMPLY
                : roll < 0.92
                  ? CompliantStatusEnum.NOT_COMPLY_MINOR
                  : CompliantStatusEnum.NOT_COMPLY_MAJOR;

            const isNonComply =
              compliantStatus !== CompliantStatusEnum.COMPLY;

            const itemStatus = compliantStatus === CompliantStatusEnum.COMPLY
              ? GeneralStatusEnum.CLOSE
              : Math.random() < 0.6
                ? GeneralStatusEnum.CLOSE
                : GeneralStatusEnum.WAITING_APPROVAL;

            const dueDate = addDays(audit.auditDate, getRandomInt(3, 21));

            const evidence = compliantStatus === CompliantStatusEnum.COMPLY
              ? `Evidence recorded for ${criterion.code} — compliant. SOP/records verified.`
              : `Finding for ${criterion.code}: non-compliance observed. Evidence documented.`;

            const recommendation = isNonComply
              ? compliantStatus === CompliantStatusEnum.NOT_COMPLY_MAJOR
                ? 'Immediate corrective action required. Implement controls within 14 days.'
                : 'Corrective action required. Implement improvement within 30 days.'
              : null;

            const actionRealization =
              itemStatus === GeneralStatusEnum.CLOSE
                ? isNonComply
                  ? 'Corrective action implemented and verified.'
                  : 'Verified compliant. No action required.'
                : null;

            const candidateUserIds = audit.auditorIds.length > 0 ? audit.auditorIds : users.map(u => u.id);
            const selectedUserIds = pickRandom(candidateUserIds, getRandomInt(1, Math.min(2, candidateUserIds.length)));

            const deptIdsFromUsers = Array.from(new Set(
              selectedUserIds.map(uid => userDepartmentIdByUserId.get(uid)).filter((id): id is string => Boolean(id)),
            ));
            const deptPool = deptIdsFromUsers.length > 0 ? deptIdsFromUsers : departmentIds;
            const selectedDeptIds = pickRandom(
              deptPool,
              deptPool.length === 0 ? 0 : isNonComply ? getRandomInt(1, Math.min(2, deptPool.length)) : getRandomInt(0, 1),
            );

            const imageCount = isNonComply ? getRandomInt(0, 2) : 0;
            const images = Array.from({ length: imageCount }).map((_, idx) => ({
              imageUrl: `https://picsum.photos/seed/audit-${audit.code}-${criterion.code}-${idx}/800/600`,
              caption: 'Finding evidence',
              order: idx + 1,
            }));

            await client.auditItem.create({
              data: {
                auditId: audit.id,
                auditCriteriaId: criterion.id,
                status: itemStatus,
                compliantStatus,
                evidence,
                recommendation,
                actionRealization,
                order: i + 1,
                dueDate,
                ...(selectedDeptIds.length > 0 ? { departments: { create: selectedDeptIds.map(departmentId => ({ departmentId })) } } : {}),
                ...(selectedUserIds.length > 0 ? { users: { create: selectedUserIds.map(userId => ({ userId })) } } : {}),
                ...(images.length > 0 ? { images: { create: images } } : {}),
              },
            });

            totalItemsCreated += 1;
          }
        }
      }
    }

    console.log(`✅ Audit seed complete`);
    console.log(`   - Created ${periods.length} audit periods`);
    console.log(`   - Created ${totalAuditsCreated} audit schedules`);
    console.log(`   - Created ${totalItemsCreated} audit items`);
  } catch (error) {
    console.error('❌ Error seeding audit schedules:', error);
    throw error;
  }
};

export default seedAuditSchedules;
