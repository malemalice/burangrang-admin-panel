import { PrismaClient, CertificateTypeEnum, CertificateRenewalStatusEnum } from '@prisma/client';
import { subDays, addDays, addMonths, subMonths } from 'date-fns';

export async function seedCertificates(prisma: PrismaClient) {
    console.log('🌱 Seeding certificates...');

    try {
        // Get required data
        const adminUser = await prisma.user.findFirst({
            where: { email: 'admin@example.com' },
        });

        if (!adminUser) {
            console.log('⚠️  Admin user not found. Please run user seeds first.');
            return;
        }

        const categories = await prisma.certificateCategory.findMany({
            where: { isActive: true },
        });

        if (categories.length === 0) {
            console.log('⚠️  No certificate categories found. Please run certificate categories seeds first.');
            return;
        }

        const departments = await prisma.department.findMany({
            where: { isActive: true },
            take: 5,
        });

        if (departments.length === 0) {
            console.log('⚠️  No departments found. Please run department seeds first.');
            return;
        }

        const users = await prisma.user.findMany({
            where: { isActive: true },
            take: 10,
        });

        // Get equipment if available (optional)
        const equipments = await (prisma as any).heavyEquipment?.findMany({
            where: { isActive: true },
            take: 5,
        }) || [];

        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');

        // Helper function to get category by code
        const getCategory = (code: string) => {
            return categories.find((cat) => cat.code === code);
        };

        // Helper function to generate certificate number
        let certSequence = 0;
        const getCertNumber = (prefix: string) => {
            certSequence++;
            return `${prefix}-${dateStr}-${certSequence.toString().padStart(4, '0')}`;
        };

        const certificates = [
            // ========================================================================
            // ACTIVE CERTIFICATES (Valid, not expiring soon)
            // ========================================================================
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Safety Officer License - John Doe',
                categoryId: getCategory('SO-LICENSE')?.id || categories[0].id,
                certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
                issuedDate: subMonths(today, 6),
                validityDate: addMonths(today, 6),
                issuerName: 'Ministry of Manpower',
                documentUrl: 'https://example.com/certs/so-license-001.pdf',
                personnelId: users[0]?.id,
                personnelName: users[0] ? `${users[0].firstName} ${users[0].lastName}` : 'John Doe',
                departmentId: departments[0].id,
                reminderDays: 30,
                notes: 'Valid safety officer license',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Forklift Operator License - Jane Smith',
                categoryId: getCategory('FL-OP-LICENSE')?.id || categories[1].id,
                certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
                issuedDate: subMonths(today, 3),
                validityDate: addMonths(today, 9),
                issuerName: 'Occupational Safety Authority',
                documentUrl: 'https://example.com/certs/fl-license-002.pdf',
                personnelId: users[1]?.id,
                personnelName: users[1] ? `${users[1].firstName} ${users[1].lastName}` : 'Jane Smith',
                departmentId: departments[1]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Forklift operation certified',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'First Aid Certificate - Bob Johnson',
                categoryId: getCategory('FA-CERT')?.id || categories[2].id,
                certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
                issuedDate: subMonths(today, 2),
                validityDate: addMonths(today, 10),
                issuerName: 'Red Cross Society',
                documentUrl: 'https://example.com/certs/fa-cert-003.pdf',
                personnelId: users[2]?.id,
                personnelName: users[2] ? `${users[2].firstName} ${users[2].lastName}` : 'Bob Johnson',
                departmentId: departments[2]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'First aid training completed',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Fire Safety Certificate - Alice Brown',
                categoryId: getCategory('FS-CERT')?.id || categories[3].id,
                certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
                issuedDate: subMonths(today, 4),
                validityDate: addMonths(today, 8),
                issuerName: 'Fire Safety Training Institute',
                documentUrl: 'https://example.com/certs/fs-cert-004.pdf',
                personnelId: users[3]?.id,
                personnelName: users[3] ? `${users[3].firstName} ${users[3].lastName}` : 'Alice Brown',
                departmentId: departments[3]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Fire safety training completed',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Pressure Vessel Calibration - PV-001',
                categoryId: getCategory('PV-CAL')?.id || categories[4].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
                issuedDate: subMonths(today, 1),
                validityDate: addMonths(today, 11),
                issuerName: 'Calibration Lab Services',
                documentUrl: 'https://example.com/certs/pv-cal-005.pdf',
                equipmentId: equipments[0]?.id,
                equipmentName: equipments[0]?.name || 'Pressure Vessel PV-001',
                departmentId: departments[0].id,
                reminderDays: 30,
                notes: 'Annual calibration completed',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Fire Extinguisher Calibration - FE-001',
                categoryId: getCategory('FE-CAL')?.id || categories[5].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
                issuedDate: subMonths(today, 2),
                validityDate: addMonths(today, 10),
                issuerName: 'Fire Safety Equipment Services',
                documentUrl: 'https://example.com/certs/fe-cal-006.pdf',
                equipmentId: equipments[1]?.id,
                equipmentName: equipments[1]?.name || 'Fire Extinguisher FE-001',
                departmentId: departments[1]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Fire extinguisher calibration',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Boiler Operational Permit - BO-001',
                categoryId: getCategory('BO-PERMIT')?.id || categories[7].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_OPERATIONAL_PERMIT,
                issuedDate: subMonths(today, 5),
                validityDate: addMonths(today, 7),
                issuerName: 'Boiler Safety Authority',
                documentUrl: 'https://example.com/certs/bo-permit-007.pdf',
                equipmentId: equipments[2]?.id,
                equipmentName: equipments[2]?.name || 'Boiler BO-001',
                departmentId: departments[2]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Boiler operational permit',
                isActive: true,
                createdBy: adminUser.id,
            },

            // ========================================================================
            // EXPIRING SOON CERTIFICATES (Within reminder days)
            // ========================================================================
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Safety Officer License - Expiring Soon',
                categoryId: getCategory('SO-LICENSE')?.id || categories[0].id,
                certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
                issuedDate: subMonths(today, 11),
                validityDate: addDays(today, 25), // Expiring in 25 days
                issuerName: 'Ministry of Manpower',
                documentUrl: 'https://example.com/certs/so-license-expiring.pdf',
                personnelId: users[4]?.id,
                personnelName: users[4] ? `${users[4].firstName} ${users[4].lastName}` : 'Mike Wilson',
                departmentId: departments[0].id,
                reminderDays: 30,
                notes: 'Expiring soon - renewal needed',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'First Aid Certificate - Expiring Soon',
                categoryId: getCategory('FA-CERT')?.id || categories[2].id,
                certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
                issuedDate: subMonths(today, 11),
                validityDate: addDays(today, 20), // Expiring in 20 days
                issuerName: 'Red Cross Society',
                documentUrl: 'https://example.com/certs/fa-cert-expiring.pdf',
                personnelId: users[5]?.id,
                personnelName: users[5] ? `${users[5].firstName} ${users[5].lastName}` : 'Sarah Davis',
                departmentId: departments[1]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Expiring soon - renewal needed',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Pressure Vessel Calibration - Expiring Soon',
                categoryId: getCategory('PV-CAL')?.id || categories[4].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
                issuedDate: subMonths(today, 11),
                validityDate: addDays(today, 15), // Expiring in 15 days
                issuerName: 'Calibration Lab Services',
                documentUrl: 'https://example.com/certs/pv-cal-expiring.pdf',
                equipmentId: equipments[3]?.id,
                equipmentName: equipments[3]?.name || 'Pressure Vessel PV-002',
                departmentId: departments[2]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Expiring soon - recalibration needed',
                isActive: true,
                createdBy: adminUser.id,
            },

            // ========================================================================
            // EXPIRED CERTIFICATES
            // ========================================================================
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Forklift Operator License - Expired',
                categoryId: getCategory('FL-OP-LICENSE')?.id || categories[1].id,
                certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
                issuedDate: subMonths(today, 13),
                validityDate: subDays(today, 30), // Expired 30 days ago
                issuerName: 'Occupational Safety Authority',
                documentUrl: 'https://example.com/certs/fl-license-expired.pdf',
                personnelId: users[6]?.id,
                personnelName: users[6] ? `${users[6].firstName} ${users[6].lastName}` : 'Tom Anderson',
                departmentId: departments[3]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Expired - renewal required',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Fire Safety Certificate - Expired',
                categoryId: getCategory('FS-CERT')?.id || categories[3].id,
                certificateType: CertificateTypeEnum.PERSONNEL_CERTIFICATE,
                issuedDate: subMonths(today, 13),
                validityDate: subDays(today, 15), // Expired 15 days ago
                issuerName: 'Fire Safety Training Institute',
                documentUrl: 'https://example.com/certs/fs-cert-expired.pdf',
                personnelId: users[7]?.id,
                personnelName: users[7] ? `${users[7].firstName} ${users[7].lastName}` : 'Lisa Martinez',
                departmentId: departments[4]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Expired - renewal required',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Fire Extinguisher Calibration - Expired',
                categoryId: getCategory('FE-CAL')?.id || categories[5].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_CALIBRATION,
                issuedDate: subMonths(today, 13),
                validityDate: subDays(today, 60), // Expired 60 days ago
                issuerName: 'Fire Safety Equipment Services',
                documentUrl: 'https://example.com/certs/fe-cal-expired.pdf',
                equipmentId: equipments[4]?.id,
                equipmentName: equipments[4]?.name || 'Fire Extinguisher FE-002',
                departmentId: departments[0].id,
                reminderDays: 30,
                notes: 'Expired - recalibration required',
                isActive: true,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Boiler Operational Permit - Expired',
                categoryId: getCategory('BO-PERMIT')?.id || categories[7].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_OPERATIONAL_PERMIT,
                issuedDate: subMonths(today, 13),
                validityDate: subDays(today, 90), // Expired 90 days ago
                issuerName: 'Boiler Safety Authority',
                documentUrl: 'https://example.com/certs/bo-permit-expired.pdf',
                equipmentId: equipments[0]?.id,
                equipmentName: equipments[0]?.name || 'Boiler BO-002',
                departmentId: departments[1]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Expired - permit renewal required',
                isActive: true,
                createdBy: adminUser.id,
            },

            // ========================================================================
            // INACTIVE CERTIFICATES
            // ========================================================================
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Safety Officer License - Inactive',
                categoryId: getCategory('SO-LICENSE')?.id || categories[0].id,
                certificateType: CertificateTypeEnum.PERSONNEL_LICENSE,
                issuedDate: subMonths(today, 8),
                validityDate: addMonths(today, 4),
                issuerName: 'Ministry of Manpower',
                documentUrl: 'https://example.com/certs/so-license-inactive.pdf',
                personnelId: users[8]?.id,
                personnelName: users[8] ? `${users[8].firstName} ${users[8].lastName}` : 'David Lee',
                departmentId: departments[2]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Inactive - employee on leave',
                isActive: false,
                createdBy: adminUser.id,
            },
            {
                certificateNumber: getCertNumber('CERT'),
                certificateName: 'Electrical Installation Permit - Inactive',
                categoryId: getCategory('EI-PERMIT')?.id || categories[6].id,
                certificateType: CertificateTypeEnum.EQUIPMENT_INSTALLATION,
                issuedDate: subMonths(today, 6),
                validityDate: addMonths(today, 6),
                issuerName: 'Electrical Safety Authority',
                documentUrl: 'https://example.com/certs/ei-permit-inactive.pdf',
                equipmentId: equipments[1]?.id,
                equipmentName: equipments[1]?.name || 'Electrical Panel EP-001',
                departmentId: departments[3]?.id || departments[0].id,
                reminderDays: 30,
                notes: 'Inactive - equipment decommissioned',
                isActive: false,
                createdBy: adminUser.id,
            },
        ];

        // Create certificates
        const createdCertificates = await Promise.all(
            certificates.map((cert) =>
                prisma.certificate.create({
                    data: cert,
                })
            )
        );

        console.log('✅ Certificates seeded successfully');
        console.log(`   - Created ${createdCertificates.length} certificates`);
        console.log(`   - Active: ${createdCertificates.filter((c) => c.isActive).length}`);
        console.log(`   - Inactive: ${createdCertificates.filter((c) => !c.isActive).length}`);
        console.log(`   - Expired: ${createdCertificates.filter((c) => new Date(c.validityDate) < today).length}`);
        console.log(`   - Expiring Soon: ${createdCertificates.filter((c) => {
            const validityDate = new Date(c.validityDate);
            const daysUntilExpiry = Math.ceil((validityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return daysUntilExpiry > 0 && daysUntilExpiry <= c.reminderDays;
        }).length}`);

        // Seed certificate renewals for Admin Overview dashboard (renewal backlog)
        const expiringSoonCerts = createdCertificates.filter((c) => {
            const validityDate = new Date(c.validityDate);
            const daysUntilExpiry = Math.ceil((validityDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
            return c.isActive && daysUntilExpiry > 0 && daysUntilExpiry <= 30;
        });
        const existingRenewalCount = await prisma.certificateRenewal.count();
        if (expiringSoonCerts.length >= 2 && existingRenewalCount < 10) {
            const statuses: CertificateRenewalStatusEnum[] = [
                CertificateRenewalStatusEnum.PENDING,
                CertificateRenewalStatusEnum.REQUESTED,
                CertificateRenewalStatusEnum.IN_PROGRESS,
            ];
            for (let i = 0; i < Math.min(3, expiringSoonCerts.length); i++) {
                await prisma.certificateRenewal.create({
                    data: {
                        certificateId: expiringSoonCerts[i].id,
                        requestedBy: adminUser.id,
                        status: statuses[i],
                    },
                });
            }
            console.log(`✅ Created ${Math.min(3, expiringSoonCerts.length)} certificate renewals for Admin Overview`);
        }

        return createdCertificates;
    } catch (error) {
        console.error('❌ Error seeding certificates:', error);
        throw error;
    }
}

export default seedCertificates;

