/**
 * Area seed data
 * Following TRD.md patterns for seed data
 * Note: This seed doesn't delete existing areas to avoid FK constraint violations
 * since areas may already be created by work-permits seed
 */
import { seedPrisma as prisma } from './prisma-seed-client';

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

    // Parse and generate area codes from names
    const generateCode = (name: string): string => {
      return `AREA-${name
        .toUpperCase()
        .replace(/[^A-Z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 20)}`;
    };

    const areasData = [
      // Early Years and Primary Areas
      { name: 'KG1', officeId: offices[0]?.id },
      { name: 'Kukangs', officeId: offices[0]?.id },
      { name: 'KG2', officeId: offices[0]?.id },
      { name: 'Infant Hall', officeId: offices[0]?.id },
      { name: 'Rainbow Cafe', officeId: offices[0]?.id },
      { name: 'Year 1 classroom and playground', officeId: offices[0]?.id },
      { name: 'Year 2 classroom and playground', officeId: offices[0]?.id },
      { name: 'Primary Office', officeId: offices[0]?.id },
      { name: 'Primary Library', officeId: offices[0]?.id },
      { name: 'Nursing Room', officeId: offices[0]?.id },
      { name: 'Primary Hall 1st floor', officeId: offices[0]?.id },
      { name: 'Primary Hall 2nd floor', officeId: offices[0]?.id },
      { name: 'Primary PE Office', officeId: offices[0]?.id },
      { name: 'Medical Centre', officeId: offices[0]?.id },
      { name: 'Year 3', officeId: offices[0]?.id },
      { name: 'Year 4', officeId: offices[0]?.id },
      { name: 'Year 5', officeId: offices[0]?.id },
      { name: 'Year 6', officeId: offices[0]?.id },
      { name: 'KS 2 Play area', officeId: offices[0]?.id },
      { name: 'Blue Court', officeId: offices[0]?.id },
      { name: 'KS 2 Eating area', officeId: offices[0]?.id },
      
      // Secondary and Specialist Buildings
      { name: 'Language Acquisition Building (Formerly MFL)', officeId: offices[0]?.id },
      { name: 'Technology Building', officeId: offices[0]?.id },
      { name: 'Science Building', officeId: offices[0]?.id },
      { name: 'Mathematic & English', officeId: offices[0]?.id },
      { name: 'Aquatic Centre', officeId: offices[0]?.id },
      { name: 'IB Building', officeId: offices[0]?.id },
      { name: 'Secondary Office', officeId: offices[0]?.id },
      { name: 'GAP Building', officeId: offices[0]?.id },
      { name: 'Filter/Pump Room', officeId: offices[0]?.id },
      
      // Administrative and Support Buildings
      { name: 'Central Admin Building', officeId: offices[0]?.id },
      { name: 'Dickens Building', officeId: offices[0]?.id },
      { name: 'Old Sports Hall', officeId: offices[0]?.id },
      { name: 'IT Building', officeId: offices[0]?.id },
      { name: 'Main Kitchen & Cafeteria Building', officeId: offices[0]?.id },
      { name: 'CMO Building', officeId: offices[0]?.id },
      { name: 'Theatre Building', officeId: offices[0]?.id },
      { name: 'Sports Centre Building', officeId: offices[0]?.id },
      { name: 'Central Store Building', officeId: offices[0]?.id },
      { name: 'New Musholla', officeId: offices[0]?.id },
      { name: 'Chief Security Office Building', officeId: offices[0]?.id },
      
      // Outdoor Areas and Parking
      { name: 'SC Parking', officeId: offices[0]?.id },
      { name: 'Astro Fields', officeId: offices[0]?.id },
      { name: 'Main Gate', officeId: offices[0]?.id },
      { name: 'Dewi Parking', officeId: offices[0]?.id },
      { name: 'Rugby Field', officeId: offices[0]?.id },
      { name: 'Tennis Court', officeId: offices[0]?.id },
      { name: 'Main Field', officeId: offices[0]?.id },
      { name: 'Staff parking', officeId: offices[0]?.id },
      { name: 'Jubilee Field', officeId: offices[0]?.id },
      { name: 'Jombang Gate', officeId: offices[0]?.id },
      { name: 'Bus Office', officeId: offices[0]?.id },
      { name: 'Driver Area', officeId: offices[0]?.id },
      { name: 'Mpok Nani', officeId: offices[0]?.id },
    ].map(area => ({
      name: area.name,
      code: generateCode(area.name),
      description: null,
      officeId: area.officeId,
    }));

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
