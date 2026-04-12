/**
 * Safety Equipment seed data
 * Following TRD.md patterns for seed data
 */
import { seedPrisma as prisma } from './prisma-seed-client';

export const seedSafetyEquipments = async () => {
    console.log('🌱 Seeding safety equipments...');

    try {
        // Get safety equipment types
        const types = await (prisma as any).safetyEquipmentType.findMany({
            where: { isActive: true },
        });

        if (types.length === 0) {
            console.log('⚠️  No safety equipment types found. Please run safety-equipment-types seed first.');
            return;
        }

        const typeMap: Record<string, string> = {};
        types.forEach((type: any) => {
            typeMap[type.code] = type.id;
        });

        const equipments = [
            {
                name: 'Safety Helmet - Full Brim',
                code: 'HELMET_FULL_BRIM_M',
                safetyEquipmentTypeId: typeMap['FULL_BRIM_HELMET'],
                size: 'M',
                description: 'Full brim safety helmet size M',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Helmet - Full Brim',
                code: 'HELMET_FULL_BRIM_L',
                safetyEquipmentTypeId: typeMap['FULL_BRIM_HELMET'],
                size: 'L',
                description: 'Full brim safety helmet size L',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Shoes - Steel Toe',
                code: 'SHOES_STEEL_TOE_42',
                safetyEquipmentTypeId: typeMap['REG_SAFETY_SHOES'],
                size: '42',
                description: 'Steel toe safety shoes size 42',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Shoes - Steel Toe',
                code: 'SHOES_STEEL_TOE_43',
                safetyEquipmentTypeId: typeMap['REG_SAFETY_SHOES'],
                size: '43',
                description: 'Steel toe safety shoes size 43',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Boots - Steel Toe',
                code: 'BOOTS_STEEL_TOE_42',
                safetyEquipmentTypeId: typeMap['BOOTS'],
                size: '42',
                description: 'Steel toe safety boots size 42',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Vest - High Visibility',
                code: 'VEST_HI_VIS_L',
                safetyEquipmentTypeId: typeMap['HI_VIS_VEST'],
                size: 'L',
                description: 'High visibility safety vest size L',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Gloves - Anti-cutting',
                code: 'GLOVES_ANTI_CUT_M',
                safetyEquipmentTypeId: typeMap['ANTI_CUT_GLOVE'],
                size: 'M',
                description: 'Anti-cutting safety gloves size M',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Gloves - Welding',
                code: 'GLOVES_WELDING_L',
                safetyEquipmentTypeId: typeMap['WELDING_GLOVE'],
                size: 'L',
                description: 'Welding safety gloves size L',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Goggles - Clear Lens',
                code: 'GOGGLES_CLEAR_ONESIZE',
                safetyEquipmentTypeId: typeMap['CLEAR_LENS_GOGGLES'],
                size: 'One Size',
                description: 'Clear lens safety goggles',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Safety Goggles - Tinted Lens',
                code: 'GOGGLES_TINTED_ONESIZE',
                safetyEquipmentTypeId: typeMap['TINTED_LENS_GOGGLES'],
                size: 'One Size',
                description: 'Tinted lens safety goggles',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Ear Plug - Disposable',
                code: 'EAR_PLUG_DISPOSABLE',
                safetyEquipmentTypeId: typeMap['EAR_PLUG'],
                size: 'One Size',
                description: 'Disposable ear plugs',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Ear Muff - Adjustable',
                code: 'EAR_MUFF_ADJUSTABLE',
                safetyEquipmentTypeId: typeMap['EAR_MUFF'],
                size: 'One Size',
                description: 'Adjustable ear muffs',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Full Body Harness - Standard',
                code: 'HARNESS_FULL_BODY_STD',
                safetyEquipmentTypeId: typeMap['FULL_BODY_HARNESS'],
                size: 'M-L',
                description: 'Standard full body harness',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
            {
                name: 'Lanyard - Shock Absorbing',
                code: 'LANYARD_SHOCK_ABS',
                safetyEquipmentTypeId: typeMap['LANYARD'],
                size: '2m',
                description: 'Shock absorbing safety lanyard 2 meters',
                category: 'PERSONAL_PROTECTIVE_EQUIPMENT',
                isActive: true,
            },
        ];

        for (const equipment of equipments) {
            await (prisma as any).safetyEquipment.upsert({
                where: { code: equipment.code },
                update: equipment,
                create: equipment,
            });
        }

        console.log('✅ Safety equipments seeded successfully');
        console.log(`   - Created/Updated ${equipments.length} safety equipments`);
    } catch (error) {
        console.error('❌ Error seeding safety equipments:', error);
        throw error;
    }
};

export default seedSafetyEquipments;

