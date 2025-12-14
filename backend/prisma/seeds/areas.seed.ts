/**
 * Area seed data
 * Following TRD.md patterns for seed data
 * Note: This seed doesn't delete existing areas to avoid FK constraint violations
 * since areas may already be created by work-permits seed
 */
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const seedAreas = async () => {
  console.log('🌱 Seeding areas...');

  try {
    // Check if areas already exist (may have been seeded by work-permits)
    const existingAreas = await prisma.area.findMany();
    
    if (existingAreas.length > 0) {
      console.log(`⚠️  ${existingAreas.length} areas already exist (seeded by work-permits). Skipping area creation.`);
      console.log(`   Existing areas: ${existingAreas.map(a => a.name).join(', ')}`);
      return existingAreas;
    }

    // Get existing offices for area assignment
    const offices = await prisma.office.findMany({
      where: { isActive: true },
    });

    const areasData = [
      {
        name: 'Main Building',
        code: 'AREA-MAIN',
        description: 'Main office building and reception area',
        officeId: offices[0]?.id,
      },
      {
        name: 'Production Floor',
        code: 'AREA-PROD',
        description: 'Manufacturing and production area',
        officeId: offices[0]?.id,
      },
      {
        name: 'IT Department',
        code: 'AREA-IT',
        description: 'Information technology and server rooms',
        officeId: offices[0]?.id,
      },
      {
        name: 'Warehouse Zone A',
        code: 'AREA-WH-A',
        description: 'Primary warehouse and storage area',
        officeId: offices[0]?.id,
      },
      {
        name: 'Laboratory Wing',
        code: 'AREA-LAB',
        description: 'Quality control and testing laboratory wing',
        officeId: offices[0]?.id,
      },
      {
        name: 'Administrative Block',
        code: 'AREA-ADMIN',
        description: 'Administrative offices and meeting rooms',
        officeId: offices[0]?.id,
      },
    ];

    const createdAreas: Awaited<ReturnType<typeof prisma.area.create>>[] = [];
    for (const areaData of areasData) {
      const area = await prisma.area.create({
        data: {
          name: areaData.name,
          code: areaData.code,
          description: areaData.description,
          officeId: areaData.officeId,
          isActive: true,
        },
      });
      createdAreas.push(area);
      console.log(`✅ Created area: ${area.name} (${area.code})`);
    }

    console.log(`✅ Areas seeded successfully`);
    console.log(`   - Created ${createdAreas.length} areas`);

    return createdAreas;
  } catch (error) {
    console.error('❌ Error seeding areas:', error);
    throw error;
  }
};

export default seedAreas;
