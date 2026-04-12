/**
 * Safety Equipment Type seed data
 * Following TRD.md patterns for seed data
 */
import { seedPrisma as prisma } from './prisma-seed-client';

export const seedSafetyEquipmentTypes = async () => {
    console.log('🌱 Seeding safety equipment types...');

    try {
        const types = [
            {
                name: 'Boots',
                code: 'BOOTS',
                description: 'Safety boots for foot protection',
                isActive: true,
            },
            {
                name: 'Regular Safety Shoes',
                code: 'REG_SAFETY_SHOES',
                description: 'Regular safety shoes for general use',
                isActive: true,
            },
            {
                name: 'Anti-cutting Glove',
                code: 'ANTI_CUT_GLOVE',
                description: 'Gloves designed to resist cutting',
                isActive: true,
            },
            {
                name: 'Welding Glove',
                code: 'WELDING_GLOVE',
                description: 'Gloves for welding operations',
                isActive: true,
            },
            {
                name: 'Full Brim Helmet',
                code: 'FULL_BRIM_HELMET',
                description: 'Safety helmet with full brim protection',
                isActive: true,
            },
            {
                name: 'Cap Style Helmet',
                code: 'CAP_STYLE_HELMET',
                description: 'Cap style safety helmet',
                isActive: true,
            },
            {
                name: 'High Visibility Vest',
                code: 'HI_VIS_VEST',
                description: 'High visibility safety vest',
                isActive: true,
            },
            {
                name: 'Clear Lens Goggles',
                code: 'CLEAR_LENS_GOGGLES',
                description: 'Safety goggles with clear lens',
                isActive: true,
            },
            {
                name: 'Tinted Lens Goggles',
                code: 'TINTED_LENS_GOGGLES',
                description: 'Safety goggles with tinted lens',
                isActive: true,
            },
            {
                name: 'Ear Plug',
                code: 'EAR_PLUG',
                description: 'Hearing protection ear plugs',
                isActive: true,
            },
            {
                name: 'Ear Muff',
                code: 'EAR_MUFF',
                description: 'Hearing protection ear muffs',
                isActive: true,
            },
            {
                name: 'Full Body Harness',
                code: 'FULL_BODY_HARNESS',
                description: 'Full body safety harness for fall protection',
                isActive: true,
            },
            {
                name: 'Lanyard',
                code: 'LANYARD',
                description: 'Safety lanyard for fall protection',
                isActive: true,
            },
        ];

        for (const type of types) {
            await (prisma as any).safetyEquipmentType.upsert({
                where: { code: type.code },
                update: type,
                create: type,
            });
        }

        console.log('✅ Safety equipment types seeded successfully');
        console.log(`   - Created/Updated ${types.length} safety equipment types`);
    } catch (error) {
        console.error('❌ Error seeding safety equipment types:', error);
        throw error;
    }
};

export default seedSafetyEquipmentTypes;

