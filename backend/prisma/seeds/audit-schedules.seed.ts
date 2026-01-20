/**
 * Audit Schedules seed data
 * Following seed.ts patterns for seed data
 */
import { PrismaClient, GeneralStatusEnum } from '@prisma/client';

const prisma = new PrismaClient();

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
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
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
      GeneralStatusEnum.DONE,
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

      audits.push(audit);
      console.log(`   ✓ Created audit: ${code} (${status})`);
    }

    console.log(`✅ Audit schedules seeded successfully`);
    console.log(`   - Created ${audits.length} audit schedules`);
    console.log(`   - Statuses: ${statuses.join(', ')}`);
  } catch (error) {
    console.error('❌ Error seeding audit schedules:', error);
    throw error;
  }
};

export default seedAuditSchedules;
