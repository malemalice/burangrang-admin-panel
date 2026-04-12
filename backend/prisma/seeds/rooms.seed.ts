/**
 * Room seed data
 * Following TRD.md patterns for seed data
 */
import { seedPrisma as prisma } from './prisma-seed-client';

export const seedRooms = async () => {
  console.log('🌱 Seeding rooms...');

  try {
    // Get existing areas for room assignment
    const areas = await prisma.area.findMany({
      where: { isActive: true },
    });

    if (areas.length === 0) {
      console.log('⚠️  No areas found. Please run work-permits seed first to create areas.');
      return [];
    }

    // Clear existing rooms
    await prisma.room.deleteMany({});

    const roomsData = [
      {
        name: 'Main Lobby',
        code: 'ROOM-LOBBY-001',
        description: 'Main entrance lobby area with reception desk',
        areaId: areas[0]?.id,
      },
      {
        name: 'Conference Room A',
        code: 'ROOM-CONF-A',
        description: 'Large conference room with video conferencing facilities',
        areaId: areas[1]?.id || areas[0]?.id,
      },
      {
        name: 'Server Room',
        code: 'ROOM-SERVER-001',
        description: 'Data center and server infrastructure room',
        areaId: areas[2]?.id || areas[0]?.id,
      },
      {
        name: 'Warehouse Section A',
        code: 'ROOM-WH-A',
        description: 'Primary warehouse storage area with pallet racks',
        areaId: areas[3]?.id || areas[0]?.id,
      },
      {
        name: 'Laboratory',
        code: 'ROOM-LAB-001',
        description: 'Quality control and testing laboratory',
        areaId: areas[4]?.id || areas[0]?.id,
      },
    ];

    // Filter rooms to only include those with valid and unique areaIds
    const usedAreaIds = new Set<string>();
    const validRoomsData = roomsData.filter(room => {
      if (room.areaId && !usedAreaIds.has(room.areaId)) {
        usedAreaIds.add(room.areaId);
        return true;
      }
      return false;
    });

    const createdRooms: Awaited<ReturnType<typeof prisma.room.create>>[] = [];
    for (const roomData of validRoomsData) {
      const room = await prisma.room.create({
        data: {
          name: roomData.name,
          code: roomData.code,
          description: roomData.description,
          areaId: roomData.areaId,
          isActive: true,
        },
      });
      createdRooms.push(room);
      console.log(`✅ Created room: ${room.name} (${room.code})`);
    }

    console.log(`✅ Rooms seeded successfully`);
    console.log(`   - Created ${createdRooms.length} rooms`);

    return createdRooms;
  } catch (error) {
    console.error('❌ Error seeding rooms:', error);
    throw error;
  }
};

export default seedRooms;
