/**
 * Environmental Measurement seed data
 * Following TRD.md patterns for seed data
 */
import { seedPrisma as prisma } from './prisma-seed-client';

export const seedEnvironmentalMeasurements = async () => {
  console.log('🌱 Seeding environmental measurements...');

  try {
    // Get existing rooms for measurement assignment
    const rooms = await prisma.room.findMany({
      where: { isActive: true },
    });

    if (rooms.length === 0) {
      console.log('⚠️  No rooms found. Please run rooms seed first.');
      return [];
    }

    // Get admin user as creator
    const adminUser = await prisma.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('⚠️  Admin user not found. Please run users seed first.');
      return [];
    }

    // Clear existing environmental measurements
    await prisma.environmentalMeasurement.deleteMany({});

    // Generate sample measurements for different dates
    const today = new Date();
    const measurements: Awaited<ReturnType<typeof prisma.environmentalMeasurement.create>>[] = [];

    // Only measure a subset of rooms so Admin Overview dashboard shows "Rooms Not Measured" and coverage % < 100
    const roomsToMeasure = rooms.slice(0, Math.max(1, rooms.length - 2));
    const roomsSkipped = rooms.length - roomsToMeasure.length;

    // Create measurements for each room (subset) over the past 7 days
    for (const room of roomsToMeasure) {
      for (let daysAgo = 0; daysAgo < 7; daysAgo++) {
        const measurementDate = new Date(today);
        measurementDate.setDate(today.getDate() - daysAgo);
        measurementDate.setHours(9, 0, 0, 0); // Set to 9 AM

        // Generate realistic random values with some variation
        const baseTemp = 22 + Math.random() * 6; // 22-28°C
        const baseHumidity = 45 + Math.random() * 25; // 45-70%
        const baseLighting = 300 + Math.random() * 400; // 300-700 lux
        const baseNoise = 35 + Math.random() * 30; // 35-65 dB

        const measurement = await prisma.environmentalMeasurement.create({
          data: {
            roomId: room.id,
            temperature: parseFloat(baseTemp.toFixed(2)),
            humidity: parseFloat(baseHumidity.toFixed(2)),
            lighting: parseFloat(baseLighting.toFixed(2)),
            noise: parseFloat(baseNoise.toFixed(2)),
            date: measurementDate,
            remarks: daysAgo === 0 ? 'Daily routine measurement' : null,
            isActive: true,
            createdBy: adminUser.id,
          },
        });
        measurements.push(measurement);
      }
    }

    console.log(`✅ Environmental measurements seeded successfully`);
    console.log(`   - Created ${measurements.length} measurements`);
    console.log(`   - Rooms covered: ${roomsToMeasure.length} of ${rooms.length}`);
    if (roomsSkipped > 0) {
      console.log(`   - Rooms not measured (Admin Overview): ${roomsSkipped}`);
    }
    console.log(`   - Days of data: 7`);

    // Log some sample data
    const sampleMeasurement = measurements[0];
    if (sampleMeasurement) {
      console.log(`\n📊 Sample measurement:`);
      console.log(`   - Temperature: ${sampleMeasurement.temperature}°C`);
      console.log(`   - Humidity: ${sampleMeasurement.humidity}%`);
      console.log(`   - Lighting: ${sampleMeasurement.lighting} lux`);
      console.log(`   - Noise: ${sampleMeasurement.noise} dB`);
    }

    return measurements;
  } catch (error) {
    console.error('❌ Error seeding environmental measurements:', error);
    throw error;
  }
};

export default seedEnvironmentalMeasurements;
