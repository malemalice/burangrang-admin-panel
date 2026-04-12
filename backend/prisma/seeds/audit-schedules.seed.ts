/**
 * Audit Schedules seed data
 * Following seed.ts patterns for seed data
 */
import { CompliantStatusEnum, GeneralStatusEnum, PrismaClient } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

/**
 * Generate audit code: AUD{YY}{MM}{DD}{HH}{MM}{SS}
 */
const generateAuditCode = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return `AUD${year}${month}${day}${hour}${minute}${second}`;
};

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

export const seedAuditSchedules = async (
  prismaClient?: PrismaClient,
): Promise<void> => {
  const client = prismaClient || prisma;
  console.log('🌱 Seeding audit schedules...');

  try {
    // Get dependencies
    const adminUser = await client.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('⚠️  Admin user not found. Please run users seed first.');
      return;
    }

    const auditElements = await client.auditElement.findMany({
      where: { isActive: true },
      take: 5,
    });

    if (auditElements.length === 0) {
      console.log('⚠️  No audit elements found. Please run audit-policy seed first.');
      return;
    }

    const areas = await client.area.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (areas.length === 0) {
      console.log('⚠️  No areas found. Please run areas seed first.');
      return;
    }

    const users = await client.user.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (users.length === 0) {
      console.log('⚠️  No users found. Please run users seed first.');
      return;
    }

    // Clear existing audit schedules
    console.log('Clearing existing audit schedules...');
    await client.auditImage.deleteMany();
    await client.auditItemToDepartment.deleteMany();
    await client.auditItemToUser.deleteMany();
    await client.auditItem.deleteMany();
    await client.auditToUser.deleteMany();
    await client.auditToArea.deleteMany();
    await client.audit.deleteMany();

    const today = new Date();
    const audits: Array<{
      id: string;
      code: string;
      auditDate: Date;
      auditElementId: string;
      status: GeneralStatusEnum;
      auditorIds: string[];
      areaIds: string[];
    }> = [];

    // ========================================================================
    // SEED AUDIT SCHEDULES
    // ========================================================================
    console.log('📊 Creating audit schedules...');

    // Create 5 audit schedules with various statuses
    const statuses: GeneralStatusEnum[] = [
      GeneralStatusEnum.SCHEDULED,
      GeneralStatusEnum.DRAFT,
      GeneralStatusEnum.OPEN,
      GeneralStatusEnum.CLOSE,
      GeneralStatusEnum.SCHEDULED,
    ];

    for (let i = 0; i < 5; i++) {
      const auditDate = new Date(today);
      auditDate.setDate(today.getDate() + (i * 7)); // Spread over 5 weeks
      auditDate.setHours(9, 0, 0, 0);

      const auditElement = auditElements[i % auditElements.length];
      const status = statuses[i];

      // Select 1-3 random areas
      const selectedAreas = areas
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      // Select 1-3 random auditors
      const selectedAuditors = users
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 3) + 1);

      const code = generateAuditCode(auditDate);
      const audit = await client.audit.create({
        data: {
          code,
          auditDate,
          auditElementId: auditElement.id,
          status,
          isActive: true,
          createdBy: adminUser.id,
          areas: {
            create: selectedAreas.map((area) => ({
              areaId: area.id,
            })),
          },
          auditors: {
            create: selectedAuditors.map((auditor) => ({
              userId: auditor.id,
            })),
          },
        },
      });

      audits.push({
        id: audit.id,
        code: audit.code,
        auditDate: audit.auditDate,
        auditElementId: audit.auditElementId,
        status: audit.status,
        auditorIds: selectedAuditors.map((u) => u.id),
        areaIds: selectedAreas.map((a) => a.id),
      });
      console.log(`   ✓ Created audit: ${code} (${status})`);
    }

    // ========================================================================
    // SEED AUDIT ITEMS (AUDIT RESULTS)
    // ========================================================================
    console.log('🧾 Creating audit items (results)...');

    // Prefer departments that are actually used by seeded users (see `users.seed.ts`)
    const userDepartmentIds = Array.from(
      new Set(
        users
          .map((u) => u.departmentId)
          .filter((id): id is string => Boolean(id)),
      ),
    );

    if (userDepartmentIds.length === 0) {
      console.log(
        '⚠️  No departmentId found on seeded users. Falling back to any active departments.',
      );
    }

    const departments =
      userDepartmentIds.length > 0
        ? await client.department.findMany({
            where: { id: { in: userDepartmentIds } },
          })
        : await client.department.findMany({
            where: { isActive: true },
            take: 10,
          });

    const departmentIds = departments.map((d) => d.id);
    const userDepartmentIdByUserId = new Map<string, string | null>(
      users.map((u) => [u.id, u.departmentId ?? null]),
    );

    let totalItemsCreated = 0;

    for (const audit of audits) {
      const criteria = await client.auditCriteria.findMany({
        where: {
          isActive: true,
          auditClause: {
            auditElementId: audit.auditElementId,
          },
        },
        include: {
          auditClause: true,
        },
        orderBy: [
          { auditClause: { order: 'asc' } },
          { order: 'asc' },
        ],
      });

      if (criteria.length === 0) {
        console.log(
          `⚠️  No audit criteria found for audit element ${audit.auditElementId}. Skipping items for audit ${audit.code}.`,
        );
        continue;
      }

      // Keep it reasonably sized for UI while still realistic
      const itemCount = Math.min(criteria.length, getRandomInt(10, 12));
      const selectedCriteria = criteria.slice(0, itemCount);

      for (let i = 0; i < selectedCriteria.length; i++) {
        const criterion = selectedCriteria[i];

        // Weighted compliant statuses
        const roll = Math.random();
        const compliantStatus =
          roll < 0.72
            ? CompliantStatusEnum.COMPLY
            : roll < 0.92
              ? CompliantStatusEnum.NOT_COMPLY_MINOR
              : CompliantStatusEnum.NOT_COMPLY_MAJOR;

        const isNonComply =
          compliantStatus === CompliantStatusEnum.NOT_COMPLY_MINOR ||
          compliantStatus === CompliantStatusEnum.NOT_COMPLY_MAJOR;

        // Item status:
        // - If COMPLY → must be CLOSE (per request)
        // - If NOT COMPLY → aligned to audit lifecycle, with some in approval flow
        const itemStatus =
          compliantStatus === CompliantStatusEnum.COMPLY
            ? GeneralStatusEnum.CLOSE
            : audit.status === GeneralStatusEnum.DRAFT
              ? GeneralStatusEnum.DRAFT
              : audit.status === GeneralStatusEnum.CLOSE
                ? GeneralStatusEnum.CLOSE
                : Math.random() < 0.18
                  ? GeneralStatusEnum.WAITING_APPROVAL
                  : GeneralStatusEnum.OPEN;

        // Due date: some overdue, some upcoming
        const dueDate =
          itemStatus === GeneralStatusEnum.CLOSE
            ? addDays(audit.auditDate, getRandomInt(3, 10))
            : addDays(today, getRandomInt(-7, 30));

        const evidence =
          compliantStatus === CompliantStatusEnum.COMPLY
            ? `Evidence recorded for ${criterion.code} (compliant). SOP/records available and verified during audit.`
            : `Finding for ${criterion.code}: non-compliance observed. Evidence attached and documented.`;

        const recommendation = isNonComply
          ? compliantStatus === CompliantStatusEnum.NOT_COMPLY_MAJOR
            ? 'Immediate corrective action required. Review procedure, assign PIC, and implement controls within 14 days.'
            : 'Corrective action required. Assign PIC and implement improvement within 30 days.'
          : null;

        const actionRealization =
          itemStatus === GeneralStatusEnum.CLOSE
            ? isNonComply
              ? 'Corrective action implemented and verified. Documentation updated and communicated.'
              : 'Verified compliant during audit. No action required.'
            : null;

        const candidateUserIds =
          audit.auditorIds.length > 0 ? audit.auditorIds : users.map((u) => u.id);
        const candidateUserIdsWithDept = candidateUserIds.filter((userId) =>
          Boolean(userDepartmentIdByUserId.get(userId)),
        );
        const userPickPool =
          isNonComply && candidateUserIdsWithDept.length > 0
            ? candidateUserIdsWithDept
            : candidateUserIds;

        const selectedUserIds = pickRandom<string>(
          userPickPool,
          userPickPool.length === 0
            ? 0
            : getRandomInt(1, Math.min(2, userPickPool.length)),
        );

        // Assign departments (must exist in `users.seed.ts`-linked departments when possible):
        // - Non-comply items MUST have at least 1 department
        // - Prefer the departments of assigned users; fallback to known seeded departments
        const deptIdsFromUsers = Array.from(
          new Set(
            selectedUserIds
              .map((userId) => userDepartmentIdByUserId.get(userId))
              .filter((id): id is string => Boolean(id)),
          ),
        );

        const deptPool = deptIdsFromUsers.length > 0 ? deptIdsFromUsers : departmentIds;
        const deptCount =
          deptPool.length === 0
            ? 0
            : isNonComply
              ? getRandomInt(1, Math.min(2, deptPool.length))
              : getRandomInt(0, Math.min(2, deptPool.length));

        const selectedDepartmentIds = pickRandom(deptPool, deptCount);

        const imageCount = isNonComply ? getRandomInt(0, 2) : getRandomInt(0, 1);
        const images = Array.from({ length: imageCount }).map((_, idx) => ({
          imageUrl: `https://picsum.photos/seed/audit-${audit.code}-${criterion.code}-${idx + 1}/800/600`,
          caption: isNonComply ? 'Finding evidence' : 'Supporting evidence',
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
            ...(selectedDepartmentIds.length > 0
              ? {
                  departments: {
                    create: selectedDepartmentIds.map((departmentId) => ({
                      departmentId,
                    })),
                  },
                }
              : {}),
            ...(selectedUserIds.length > 0
              ? {
                  users: {
                    create: selectedUserIds.map((userId) => ({
                      userId,
                    })),
                  },
                }
              : {}),
            ...(images.length > 0
              ? {
                  images: {
                    create: images,
                  },
                }
              : {}),
          },
        });

        totalItemsCreated += 1;
      }
    }

    console.log(`✅ Audit schedules seeded successfully`);
    console.log(`   - Created ${audits.length} audit schedules`);
    console.log(`   - Created ${totalItemsCreated} audit items (results)`);
    console.log(`   - Statuses: ${statuses.join(', ')}`);
  } catch (error) {
    console.error('❌ Error seeding audit schedules:', error);
    throw error;
  }
};

export default seedAuditSchedules;
