/**
 * Waste Management seed data
 * Seeds master data for waste management module
 */
import {
  PrismaClient,
  WasteTypeEnum,
  MonthEnum,
  ReportStatusEnum,
  WeightReportStatusEnum,
  WaterQualityLabReportStatusEnum,
  WaterQualityLabReportCategoryEnum,
  WaterQualityParameterCategoryEnum,
  GeneralStatusEnum,
} from '@prisma/client';

const prisma = new PrismaClient();

export const seedWasteManagement = async () => {
  console.log('🌱 Seeding waste management data...');

  try {
    // Get existing offices for treatment plant assignment
    const offices = await prisma.office.findMany({
      where: { isActive: true },
      take: 3,
    });

    if (offices.length === 0) {
      console.log('⚠️  No offices found. Please run office seeds first.');
      return;
    }

    // Get existing areas for storage location assignment
    const areas = await prisma.area.findMany({
      where: { isActive: true },
      take: 5,
    });

    // Get existing users for report assignment
    const users = await prisma.user.findMany({
      where: { isActive: true },
      take: 3,
    });

    // Clear existing waste management data
    await prisma.weightReportItem.deleteMany({});
    await prisma.dispatchOrder.deleteMany({});
    await prisma.weightReport.deleteMany({});
    await prisma.waterQualityLabReportResult.deleteMany({});
    await prisma.waterQualityLabReport.deleteMany({});
    await prisma.monthlyFlowReport.deleteMany({});
    await prisma.storageLocation.deleteMany({});
    await prisma.wasteSource.deleteMany({});
    await prisma.wasteType.deleteMany({});
    await prisma.waterQualityParameter.deleteMany({});
    await prisma.treatmentPlant.deleteMany({});

    // Seed Treatment Plants (requires users for createdBy)
    let treatmentPlants: Awaited<ReturnType<typeof prisma.treatmentPlant.create>>[] = [];
    if (users.length > 0) {
      console.log('  📍 Seeding treatment plants...');
      treatmentPlants = await Promise.all([
        prisma.treatmentPlant.create({
          data: {
            name: 'IPAL Utama',
            code: 'IPAL-001',
            description: 'Instalasi Pengolahan Air Limbah Utama',
            capacity: 500,
            location: 'Area Produksi Utama',
            officeId: offices[0]?.id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.treatmentPlant.create({
          data: {
            name: 'STP Kantor',
            code: 'STP-001',
            description: 'Sewage Treatment Plant untuk area perkantoran',
            capacity: 100,
            location: 'Gedung Kantor Pusat',
            officeId: offices[1]?.id || offices[0]?.id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.treatmentPlant.create({
          data: {
            name: 'WWTP Gudang',
            code: 'WWTP-001',
            description: 'Waste Water Treatment Plant area pergudangan',
            capacity: 200,
            location: 'Area Pergudangan',
            officeId: offices[2]?.id || offices[0]?.id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
      ]);
      console.log(`     ✅ Created ${treatmentPlants.length} treatment plants`);
    } else {
      console.log('  ⚠️  Skipping treatment plants (no users found)');
    }

    // Seed Water Quality Parameters
    console.log('  💧 Seeding water quality parameters...');
    const waterQualityParams = await Promise.all([
      prisma.waterQualityParameter.create({
        data: {
          name: 'pH',
          code: 'WQ-PH',
          category: WaterQualityParameterCategoryEnum.CHEMISTRY,
          unit: '-',
          standardLimit: 9.0,
          regulatoryLimit: 9.0,
          description: 'Tingkat keasaman air (6-9)',
          testMethod: 'pH Meter',
          displayOrder: 1,
          isActive: true,
          dateSampleTaken: new Date(),
        },
      }),
      prisma.waterQualityParameter.create({
        data: {
          name: 'BOD',
          code: 'WQ-BOD',
          category: WaterQualityParameterCategoryEnum.CHEMISTRY,
          unit: 'mg/L',
          standardLimit: 30,
          regulatoryLimit: 30,
          description: 'Biological Oxygen Demand (max 30 mg/L)',
          testMethod: 'Titrimetri',
          displayOrder: 2,
          isActive: true,
          dateSampleTaken: new Date(),
        },
      }),
      prisma.waterQualityParameter.create({
        data: {
          name: 'COD',
          code: 'WQ-COD',
          category: WaterQualityParameterCategoryEnum.CHEMISTRY,
          unit: 'mg/L',
          standardLimit: 100,
          regulatoryLimit: 100,
          description: 'Chemical Oxygen Demand (max 100 mg/L)',
          testMethod: 'Spektrofotometri',
          displayOrder: 3,
          isActive: true,
          dateSampleTaken: new Date(),
        },
      }),
      prisma.waterQualityParameter.create({
        data: {
          name: 'TSS',
          code: 'WQ-TSS',
          category: WaterQualityParameterCategoryEnum.PHYSICS,
          unit: 'mg/L',
          standardLimit: 50,
          regulatoryLimit: 50,
          description: 'Total Suspended Solid (max 50 mg/L)',
          testMethod: 'Gravimetri',
          displayOrder: 4,
          isActive: true,
          dateSampleTaken: new Date(),
        },
      }),
      prisma.waterQualityParameter.create({
        data: {
          name: 'Ammonia',
          code: 'WQ-NH3',
          category: WaterQualityParameterCategoryEnum.CHEMISTRY,
          unit: 'mg/L',
          standardLimit: 5,
          regulatoryLimit: 5,
          description: 'Kadar Ammonia (max 5 mg/L)',
          testMethod: 'Spektrofotometri',
          displayOrder: 5,
          isActive: true,
          dateSampleTaken: new Date(),
        },
      }),
    ]);
    console.log(`     ✅ Created ${waterQualityParams.length} water quality parameters`);

    // Seed Waste Types
    console.log('  🗑️ Seeding waste types...');
    const wasteTypes = await Promise.all([
      prisma.wasteType.create({
        data: {
          name: 'Limbah B3 - Oli Bekas',
          code: 'WT-B3-OLI',
          wasteType: WasteTypeEnum.HAZARDOUS,
          description: 'Oli bekas dari mesin dan kendaraan',
          requiresSpecialHandling: true,
          isActive: true,
        },
      }),
      prisma.wasteType.create({
        data: {
          name: 'Limbah B3 - Aki Bekas',
          code: 'WT-B3-AKI',
          wasteType: WasteTypeEnum.HAZARDOUS,
          description: 'Aki bekas kendaraan dan peralatan',
          requiresSpecialHandling: true,
          isActive: true,
        },
      }),
      prisma.wasteType.create({
        data: {
          name: 'Limbah Domestik - Kardus',
          code: 'WT-DOM-KRD',
          wasteType: WasteTypeEnum.DOMESTIC,
          description: 'Kardus bekas kemasan',
          requiresSpecialHandling: false,
          isActive: true,
        },
      }),
      prisma.wasteType.create({
        data: {
          name: 'Limbah Makanan',
          code: 'WT-FOOD-SM',
          wasteType: WasteTypeEnum.FOOD,
          description: 'Sisa makanan dari kantin',
          requiresSpecialHandling: false,
          isActive: true,
        },
      }),
      prisma.wasteType.create({
        data: {
          name: 'Limbah Hijau (Tanaman)',
          code: 'WT-GREEN-01',
          wasteType: WasteTypeEnum.GREEN,
          description: 'Daun dan ranting dari taman',
          requiresSpecialHandling: false,
          isActive: true,
        },
      }),
    ]);
    console.log(`     ✅ Created ${wasteTypes.length} waste types`);

    // Seed Waste Sources
    console.log('  🏭 Seeding waste sources...');
    const wasteSources = await Promise.all([
      prisma.wasteSource.create({
        data: {
          name: 'Area Produksi',
          code: 'WS-PROD',
          sourceType: 'Production',
          description: 'Limbah dari aktivitas produksi',
          isActive: true,
        },
      }),
      prisma.wasteSource.create({
        data: {
          name: 'Bengkel & Maintenance',
          code: 'WS-MAINT',
          sourceType: 'Maintenance',
          description: 'Limbah dari aktivitas pemeliharaan',
          contactPerson: 'Budi Hartono',
          phone: '08123456789',
          isActive: true,
        },
      }),
      prisma.wasteSource.create({
        data: {
          name: 'Kantin',
          code: 'WS-KNTN',
          sourceType: 'Canteen',
          description: 'Limbah dari kantin karyawan',
          contactPerson: 'Ibu Sari',
          phone: '08234567890',
          isActive: true,
        },
      }),
      prisma.wasteSource.create({
        data: {
          name: 'Perkantoran',
          code: 'WS-OFC',
          sourceType: 'Office',
          description: 'Limbah dari aktivitas perkantoran',
          isActive: true,
        },
      }),
    ]);
    console.log(`     ✅ Created ${wasteSources.length} waste sources`);

    // Seed Storage Locations (requires users for createdBy)
    let storageLocations: Awaited<ReturnType<typeof prisma.storageLocation.create>>[] = [];
    if (users.length > 0) {
      console.log('  📦 Seeding storage locations...');
      storageLocations = await Promise.all([
        prisma.storageLocation.create({
          data: {
            name: 'TPS B3 Utama',
            code: 'SL-B3-001',
            location: 'Belakang Gudang Utama',
            areaId: areas[0]?.id,
            description: 'Tempat Penyimpanan Sementara Limbah B3',
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.storageLocation.create({
          data: {
            name: 'TPS Non-B3',
            code: 'SL-NB3-001',
            location: 'Samping Area Parkir',
            areaId: areas[1]?.id || areas[0]?.id,
            description: 'Tempat penampungan limbah non-B3',
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.storageLocation.create({
          data: {
            name: 'Area Kompos',
            code: 'SL-KMP-001',
            location: 'Taman Belakang',
            areaId: areas[2]?.id || areas[0]?.id,
            description: 'Area pengolahan kompos',
            createdBy: users[0].id,
            isActive: true,
          },
        }),
      ]);
      console.log(`     ✅ Created ${storageLocations.length} storage locations`);
    } else {
      console.log('  ⚠️  Skipping storage locations (no users found)');
    }

    // Seed sample Monthly Flow Reports (if users exist)
    if (users.length > 0 && treatmentPlants.length > 0) {
      console.log('  📊 Seeding monthly flow reports...');
      const currentYear = new Date().getFullYear();
      const monthlyFlowReports = await Promise.all([
        prisma.monthlyFlowReport.create({
          data: {
            reportCode: `MFR-${currentYear}-JAN-001`,
            treatmentPlantId: treatmentPlants[0].id,
            reportDate: new Date(currentYear, 0, 31),
            reportMonth: MonthEnum.JAN,
            reportYear: currentYear,
            totalVolume: 12500.5,
            averageDailyFlow: 403.24,
            peakFlow: 550.0,
            minimumFlow: 280.0,
            status: ReportStatusEnum.SUBMITTED,
            submittedBy: users[0].id,
            submittedAt: new Date(),
            isActive: true,
          },
        }),
        prisma.monthlyFlowReport.create({
          data: {
            reportCode: `MFR-${currentYear}-FEB-001`,
            treatmentPlantId: treatmentPlants[0].id,
            reportDate: new Date(currentYear, 1, 28),
            reportMonth: MonthEnum.FEB,
            reportYear: currentYear,
            totalVolume: 11200.0,
            averageDailyFlow: 400.0,
            peakFlow: 520.0,
            minimumFlow: 300.0,
            status: ReportStatusEnum.SUBMITTED,
            submittedBy: users[0].id,
            submittedAt: new Date(),
            isActive: true,
          },
        }),
      ]);
      console.log(`     ✅ Created ${monthlyFlowReports.length} monthly flow reports`);

      // Seed Water Quality Lab Reports (min 20 rows, varied categories)
      const labReportCategories = [
        WaterQualityLabReportCategoryEnum.WASTEWATER,
        WaterQualityLabReportCategoryEnum.CLEAN_WATER,
        WaterQualityLabReportCategoryEnum.SWIMMING_POOL_WATER,
        WaterQualityLabReportCategoryEnum.DRINKING_WATER,
      ] as const;
      const labReportStatuses: WaterQualityLabReportStatusEnum[] = [
        WaterQualityLabReportStatusEnum.DRAFT,
        WaterQualityLabReportStatusEnum.OPEN,
        WaterQualityLabReportStatusEnum.WAITING_APPROVAL,
        WaterQualityLabReportStatusEnum.DONE,
        WaterQualityLabReportStatusEnum.SCHEDULED,
        WaterQualityLabReportStatusEnum.REJECTED,
      ];
      const summariesByCategory: Record<string, string> = {
        [WaterQualityLabReportCategoryEnum.WASTEWATER]: 'Hasil pengujian air limbah dalam batas baku mutu',
        [WaterQualityLabReportCategoryEnum.CLEAN_WATER]: 'Kualitas air bersih memenuhi standar operasional',
        [WaterQualityLabReportCategoryEnum.SWIMMING_POOL_WATER]: 'Parameter kolam renang dalam range aman',
        [WaterQualityLabReportCategoryEnum.DRINKING_WATER]: 'Air minum memenuhi persyaratan kesehatan',
      };
      const MIN_LAB_REPORTS = 20;
      console.log('  🧪 Seeding water quality lab reports...');
      const waterQualityLabReports: Awaited<ReturnType<typeof prisma.waterQualityLabReport.create>>[] = [];
      const baseSampleValues = [7.2, 25, 80, 35, 3]; // pH, BOD, COD, TSS, Ammonia

      for (let i = 0; i < MIN_LAB_REPORTS; i++) {
        const category = labReportCategories[i % labReportCategories.length];
        const plant = treatmentPlants[i % treatmentPlants.length];
        const reportDate = new Date(currentYear, 11 - (i % 12), 15 - (i % 10)); // spread over past months
        const report = await prisma.waterQualityLabReport.create({
          data: {
            reportCode: `WQLR-${currentYear}-${String(i + 1).padStart(3, '0')}`,
            treatmentPlantId: plant.id,
            category,
            reportDate,
            preparedBy: users[i % users.length].id,
            summary: summariesByCategory[category] ?? 'Hasil pengujian kualitas air dalam batas normal',
            recommendations: i % 3 === 0 ? 'Lanjutkan monitoring rutin' : i % 3 === 1 ? 'Perbaiki dosis koagulan' : 'Cek ulang sampling',
            status: labReportStatuses[i % labReportStatuses.length],
            submittedBy: users[i % users.length].id,
            submittedAt: reportDate,
            isActive: true,
          },
        });
        waterQualityLabReports.push(report);

        // One result row per parameter for this report (slight variance per report)
        const variance = (i % 5) * 0.2;
        const sampleValues = baseSampleValues.map((v, j) => (j === 0 ? v + (i % 3) * 0.1 : Math.max(0, v + (i % 4) - 2 + variance)));
        await prisma.waterQualityLabReportResult.createMany({
          data: waterQualityParams.slice(0, sampleValues.length).map((param, j) => ({
            labReportId: report.id,
            parameterId: param.id,
            resultValue: sampleValues[j] ?? 0,
            unit: param.unit,
          })),
        });
      }
      console.log(`     ✅ Created ${waterQualityLabReports.length} water quality lab reports (varied categories)`);
      console.log(`     ✅ Created ${waterQualityLabReports.length * Math.min(waterQualityParams.length, baseSampleValues.length)} lab report results`);

      // Seed sample Weight Reports
      console.log('  ⚖️ Seeding weight reports...');
      const weightReports = await Promise.all([
        prisma.weightReport.create({
          data: {
            reportCode: `WR-${currentYear}-JAN-001`,
            sourceId: wasteSources[0].id,
            storageLocationId: storageLocations[0].id,
            reportDate: new Date(),
            reportMonth: MonthEnum.JAN,
            reportYear: currentYear,
            status: WeightReportStatusEnum.DRAFT,
            submittedBy: users[0].id,
            submittedAt: new Date(),
            isActive: true,
            items: {
              create: [
                {
                  wasteTypeId: wasteTypes[0].id,
                  weight: 150.5,
                  unit: 'kg',
                  order: 1,
                  notes: 'Oli bekas dari bengkel',
                },
                {
                  wasteTypeId: wasteTypes[1].id,
                  weight: 25.0,
                  unit: 'kg',
                  order: 2,
                  notes: 'Aki bekas kendaraan operasional',
                },
              ],
            },
          },
        }),
      ]);
      console.log(`     ✅ Created ${weightReports.length} weight reports with items`);

      // Admin Overview dashboard: one report UNDER_REVIEW and one more weight report with higher total weight
      await prisma.monthlyFlowReport.create({
        data: {
          reportCode: `MFR-${currentYear}-MAR-001`,
          treatmentPlantId: treatmentPlants[1]?.id ?? treatmentPlants[0].id,
          reportDate: new Date(currentYear, 2, 31),
          reportMonth: MonthEnum.MAR,
          reportYear: currentYear,
          totalVolume: 9800.0,
          averageDailyFlow: 316.13,
          peakFlow: 480.0,
          minimumFlow: 250.0,
          status: ReportStatusEnum.UNDER_REVIEW,
          submittedBy: users[0].id,
          submittedAt: new Date(),
          isActive: true,
        },
      });
      await prisma.weightReport.create({
        data: {
          reportCode: `WR-${currentYear}-FEB-001`,
          sourceId: wasteSources[1]?.id ?? wasteSources[0].id,
          storageLocationId: storageLocations[1]?.id ?? storageLocations[0].id,
          reportDate: new Date(),
          reportMonth: MonthEnum.FEB,
          reportYear: currentYear,
          status: WeightReportStatusEnum.OPEN,
          submittedBy: users[0].id,
          submittedAt: new Date(),
          isActive: true,
          items: {
            create: [
              {
                wasteTypeId: wasteTypes[0].id,
                weight: 300.0,
                unit: 'kg',
                order: 1,
                notes: 'Admin Overview - bulk waste',
              },
              {
                wasteTypeId: wasteTypes[2]?.id ?? wasteTypes[0].id,
                weight: 150.0,
                unit: 'kg',
                order: 2,
                notes: 'Kardus bekas',
              },
              {
                wasteTypeId: wasteTypes[3]?.id ?? wasteTypes[1].id,
                weight: 75.0,
                unit: 'kg',
                order: 3,
                notes: 'Limbah lainnya',
              },
            ],
          },
        },
      });
      console.log('     ✅ Created 1 monthly flow report (UNDER_REVIEW) and 1 weight report (~525 kg) for Admin Overview');

      // Seed sample Dispatch Orders
      console.log('  🚛 Seeding dispatch orders...');
      const dispatchOrders = await Promise.all([
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-001`,
            dispatchDate: new Date(),
            quantity: 500,
            memo: 'Pengiriman limbah B3 ke PT. Pengolah Limbah Indonesia',
            status: GeneralStatusEnum.SCHEDULED,
            orderedBy: users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-002`,
            dispatchDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
            quantity: 300,
            memo: 'Pengiriman limbah non-B3 ke bank sampah',
            status: GeneralStatusEnum.SCHEDULED,
            orderedBy: users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-003`,
            dispatchDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
            quantity: 750,
            memo: 'Pengiriman limbah padat ke TPA regional',
            status: GeneralStatusEnum.DONE,
            orderedBy: users[1]?.id || users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-004`,
            dispatchDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            quantity: 200,
            memo: 'Pengiriman limbah organik ke komposter',
            status: GeneralStatusEnum.OPEN,
            orderedBy: users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-005`,
            dispatchDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 2 weeks from now
            quantity: 1000,
            memo: 'Pengiriman limbah berbahaya ke vendor terdaftar',
            status: GeneralStatusEnum.DRAFT,
            orderedBy: users[2]?.id || users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-006`,
            dispatchDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
            quantity: 150,
            memo: 'Pengiriman ditolak karena dokumen tidak lengkap',
            status: GeneralStatusEnum.REJECTED,
            orderedBy: users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
        prisma.dispatchOrder.create({
          data: {
            dispatchCode: `DO-${currentYear}-007`,
            dispatchDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
            quantity: 450,
            memo: 'Menunggu persetujuan manajer untuk pengiriman',
            status: GeneralStatusEnum.WAITING_APPROVAL,
            orderedBy: users[1]?.id || users[0].id,
            createdBy: users[0].id,
            isActive: true,
          },
        }),
      ]);
      console.log(`     ✅ Created ${dispatchOrders.length} dispatch orders`);
    }

    // Get dispatch orders count for summary
    const dispatchOrdersCount = await prisma.dispatchOrder.count();

    console.log('✅ Waste management data seeded successfully');
    console.log(`   - Treatment Plants: ${treatmentPlants.length}`);
    console.log(`   - Water Quality Parameters: ${waterQualityParams.length}`);
    console.log(`   - Waste Types: ${wasteTypes.length}`);
    console.log(`   - Waste Sources: ${wasteSources.length}`);
    console.log(`   - Storage Locations: ${storageLocations.length}`);
    if (users.length > 0) {
      console.log(`   - Dispatch Orders: ${dispatchOrdersCount}`);
    }
  } catch (error) {
    console.error('❌ Error seeding waste management data:', error);
    throw error;
  }
};

export default seedWasteManagement;
