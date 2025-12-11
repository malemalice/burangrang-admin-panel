import { PrismaClient, CertificateTypeEnum } from '@prisma/client';

export const certificateCategories = [
    // PERSONNEL_LICENSE
    {
        name: 'Safety Officer License',
        code: 'SO-LICENSE',
        certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
        description: 'License for Safety Officers',
        isActive: true,
    },
    {
        name: 'Forklift Operator License',
        code: 'FL-OP-LICENSE',
        certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
        description: 'License for Forklift Operators',
        isActive: true,
    },
    // PERSONNEL_CERTIFICATE
    {
        name: 'First Aid Certificate',
        code: 'FA-CERT',
        certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
        description: 'First Aid Training Certificate',
        isActive: true,
    },
    {
        name: 'Fire Safety Certificate',
        code: 'FS-CERT',
        certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
        description: 'Fire Safety Training Certificate',
        isActive: true,
    },
    // EQUIPMENT_CALIBRATION
    {
        name: 'Pressure Vessel Calibration',
        code: 'PV-CAL',
        certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
        description: 'Calibration certificate for pressure vessels',
        isActive: true,
    },
    {
        name: 'Fire Extinguisher Calibration',
        code: 'FE-CAL',
        certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
        description: 'Calibration certificate for fire extinguishers',
        isActive: true,
    },
    // EQUIPMENT_INSTALLATION
    {
        name: 'Electrical Installation Permit',
        code: 'EI-PERMIT',
        certificateType: CertificateTypeEnum.EQUIPMENT_INSTALLATION,
        description: 'Permit for electrical equipment installation',
        isActive: true,
    },
    // EQUIPMENT_OPERATIONAL_PERMIT
    {
        name: 'Boiler Operational Permit',
        code: 'BO-PERMIT',
        certificateType: CertificateTypeEnum.EQUIPMENT_OPERATIONAL_PERMIT,
        description: 'Operational permit for boilers',
        isActive: true,
    },
];

export async function seedCertificateCategories(prisma: PrismaClient) {
    console.log('🌱 Seeding certificate categories...');

    try {
        // Clear existing certificate categories
        await prisma.certificateCategory.deleteMany({});

        const createdCategories = await Promise.all(
            certificateCategories.map((category) =>
                prisma.certificateCategory.create({
                    data: category,
                })
            )
        );

        console.log('✅ Certificate categories seeded successfully');
        console.log(`   - Created ${createdCategories.length} categories`);
        createdCategories.forEach((cat) => {
            console.log(`   - ${cat.name} (${cat.code})`);
        });

        return createdCategories;
    } catch (error) {
        console.error('❌ Error seeding certificate categories:', error);
        throw error;
    }
}

export default seedCertificateCategories;

