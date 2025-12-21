import { PrismaClient } from '@prisma/client';
import { seedPermissions } from './seeds/permissions.seed';
import { seedRoles } from './seeds/roles.seed';
import { seedOffices } from './seeds/offices.seed';
import { seedUsers } from './seeds/users.seed';
import { seedDepartments } from './seeds/departments.seed';
import { seedJobPositions } from './seeds/jobpositions.seed';
import { seedRiskCategories } from './seeds/risk-categories.seed';
import { seedRisks } from './seeds/risks.seed';
import { seedRiskMitigations } from './seeds/risk-mitigations.seed';
import { seedRiskMatrix } from './seeds/risk-matrix.seed';
import { seedSettings } from './seeds/settings.seed';
import { seedMenus } from './seeds/menus.seed';
import { seedNotifications } from './seeds/notification-types.seed';
import { seedFileCategories } from './seeds/file-categories.seed';
import { seedFileStorageProviders } from './seeds/file-storage-providers.seed';
import { seedPPE } from './seeds/ppe.seed';
import { seedSafetyEquipmentTypes } from './seeds/safety-equipment-types.seed';
import { seedSafetyEquipments } from './seeds/safety-equipments.seed';
import { seedCertificateCategories } from './seeds/certificate-categories.seed';
import { seedCertificates } from './seeds/certificates.seed';
import { seedCourses } from './seeds/courses.seed';
import { seedQuizzes } from './seeds/quizzes.seed';
import { seedWorkPermitsData } from './seeds/work-permits.seed';
import { seedAreas } from './seeds/areas.seed';
import { seedRooms } from './seeds/rooms.seed';
import { seedEnvironmentalMeasurements } from './seeds/environmental-measurements.seed';
import { seedWasteManagement } from './seeds/waste-management.seed';
import { seedManHours } from './seeds/man-hours.seed';

const prisma = new PrismaClient();

// Get the table name from command line arguments
const tableToSeed = process.argv[2]?.toLowerCase();

async function main() {
  try {
    console.log('Starting seed process...');

    // Clear existing data
    console.log('Clearing existing data...');

    // If no specific table is provided, clear all tables
    if (!tableToSeed) {
      // Delete in order to respect foreign key constraints
      await prisma.notificationRecipient.deleteMany();
      await prisma.notification.deleteMany();
      await prisma.notificationType.deleteMany();
      await prisma.refreshToken.deleteMany();
      // Clear PPE data first (before User deletion due to foreign keys)
      await (prisma as any).pPEWithdrawalItem.deleteMany();
      await (prisma as any).pPEWithdrawal.deleteMany();
      await (prisma as any).pPEStockAdjustment.deleteMany();
      await (prisma as any).pPEExpiryAlert.deleteMany();
      await (prisma as any).pPEStockItem.deleteMany();
      await (prisma as any).pPEStock.deleteMany();
      // Clear Safety Equipment data
      await (prisma as any).safetyEquipment.deleteMany();
      await (prisma as any).safetyEquipmentType.deleteMany();
      // Clear Certificate data (before User deletion)
      await prisma.certificateReminder.deleteMany();
      await prisma.certificateRenewal.deleteMany();
      await prisma.certificate.deleteMany();
      await prisma.certificateCategory.deleteMany();
      // Clear Course data (before User deletion)
      await prisma.progress.deleteMany();
      await prisma.enrollment.deleteMany();
      await prisma.chapter.deleteMany();
      await prisma.course.deleteMany();
      await prisma.courseCategory.deleteMany();
      // Clear Quiz data (before User deletion)
      await prisma.quizAnswer.deleteMany();
      await prisma.quizAttempt.deleteMany();
      await prisma.quizAssignment.deleteMany();
      await prisma.quizQuestionOption.deleteMany();
      await prisma.quizQuestion.deleteMany();
      await prisma.quiz.deleteMany();
      // Clear Work Permit data (before User deletion)
      await prisma.workPermitAttachment.deleteMany();
      await prisma.workPermitHazard.deleteMany();
      await prisma.workPermitRequiredCourse.deleteMany();
      await prisma.workPermitProfession.deleteMany();
      await prisma.workPermitMachine.deleteMany();
      await prisma.workPermitMaterial.deleteMany();
      await prisma.workPermitTool.deleteMany();
      await prisma.workPermitHeavyEquipment.deleteMany();
      await prisma.workPermitWorker.deleteMany();
      await prisma.workPermitEmployee.deleteMany();
      await prisma.workPermitClassification.deleteMany();
      await prisma.workPermitToSafetyEquipment.deleteMany();
      await prisma.workPermitToUser.deleteMany();
      await prisma.workPermitSupervisorToGuest.deleteMany();
      await prisma.workPermit.deleteMany();
      await prisma.guest.deleteMany();
      // Clear Environmental Measurements and Rooms
      await prisma.environmentalMeasurement.deleteMany();
      await prisma.room.deleteMany();
      // Clear Waste Management data
      await prisma.weightReportItem.deleteMany();
      await prisma.dispatchOrder.deleteMany();
      await prisma.weightReport.deleteMany();
      await prisma.waterQualityLabReport.deleteMany();
      await prisma.monthlyFlowReport.deleteMany();
      await prisma.storageLocation.deleteMany();
      await prisma.wasteSource.deleteMany();
      await prisma.wasteType.deleteMany();
      await prisma.waterQualityParameter.deleteMany();
      await prisma.treatmentPlant.deleteMany();
      // Clear Man Hours data
      await prisma.manHour.deleteMany();
      // Clear other data
      await prisma.masterApprovalItem.deleteMany();
      await prisma.approval.deleteMany();
      await prisma.masterApproval.deleteMany();
      await prisma.fileAccessLog.deleteMany();
      await prisma.fileUpload.deleteMany();
      await prisma.user.deleteMany();
      await prisma.menu.deleteMany();
      await prisma.role.deleteMany();
      await prisma.permission.deleteMany();
      await prisma.office.deleteMany();
      await prisma.department.deleteMany();
      await prisma.jobPosition.deleteMany();
      // Delete from riskMitigation table
      try {
        await (prisma as any).riskMitigation.deleteMany();
      } catch (error: any) {
        // If table doesn't exist (P2021), ignore it
        if (error.code !== 'P2021') {
          throw error;
        }
      }
      // Try to delete from m_risk table (new name after migration)
      try {
        await (prisma as any).risk.deleteMany();
      } catch (error: any) {
        // If table doesn't exist yet (P2021), it means migration hasn't run - that's OK, nothing to clear
        if (error.code !== 'P2021') {
          throw error;
        }
      }
      await (prisma as any).riskCategory.deleteMany();
      await prisma.riskMatrix.deleteMany();
      await prisma.setting.deleteMany();
      await prisma.fileCategory.deleteMany();
      await prisma.fileStorageProvider.deleteMany();
      console.log('All existing data cleared successfully');
    } else {
      // Clear only the specified table
      switch (tableToSeed) {
        case 'users':
          await prisma.user.deleteMany();
          break;
        case 'roles':
          await prisma.role.deleteMany();
          break;
        case 'permissions':
          await prisma.permission.deleteMany();
          break;
        case 'offices':
          await prisma.office.deleteMany();
          break;
        case 'departments':
          await prisma.department.deleteMany();
          break;
        case 'job_positions':
          await prisma.jobPosition.deleteMany();
          break;
        case 'hse_categories':
          // Delete from riskMitigation table
          try {
            await (prisma as any).riskMitigation.deleteMany();
          } catch (error: any) {
            // If table doesn't exist (P2021), ignore it
            if (error.code !== 'P2021') {
              throw error;
            }
          }
          // Try to delete from m_risk table (new name after migration)
          try {
            await (prisma as any).risk.deleteMany();
          } catch (error: any) {
            // If table doesn't exist yet (P2021), it means migration hasn't run - that's OK, nothing to clear
            if (error.code !== 'P2021') {
              throw error;
            }
          }
          await (prisma as any).riskCategory.deleteMany();
          break;
        case 'risks':
          // Delete from riskMitigation table
          try {
            await (prisma as any).riskMitigation.deleteMany();
          } catch (error: any) {
            // If table doesn't exist (P2021), ignore it
            if (error.code !== 'P2021') {
              throw error;
            }
          }
          // Try to delete from m_risk table (new name after migration)
          try {
            await (prisma as any).risk.deleteMany();
          } catch (error: any) {
            // If table doesn't exist yet (P2021), it means migration hasn't run - that's OK, nothing to clear
            if (error.code !== 'P2021') {
              throw error;
            }
          }
          break;
        case 'risk_mitigations':
          // Delete from riskMitigation table
          try {
            await (prisma as any).riskMitigation.deleteMany();
          } catch (error: any) {
            // If table doesn't exist (P2021), ignore it
            if (error.code !== 'P2021') {
              throw error;
            }
          }
          break;
        case 'risk_matrix':
          await prisma.riskMatrix.deleteMany();
          break;
        case 'settings':
          await prisma.setting.deleteMany();
          break;
        case 'menus':
          await prisma.menu.deleteMany();
          break;
        case 'notifications':
          await prisma.notificationRecipient.deleteMany();
          await prisma.notification.deleteMany();
          await prisma.notificationType.deleteMany();
          break;

        case 'file_categories':
          await prisma.fileCategory.deleteMany();
          break;
        case 'file_storage_providers':
          await prisma.fileStorageProvider.deleteMany();
          break;
        case 'file_uploads':
          await prisma.fileAccessLog.deleteMany();
          await prisma.fileUpload.deleteMany();
          break;
        case 'safety_equipment_types':
          await (prisma as any).safetyEquipmentType.deleteMany();
          break;
        case 'safety_equipments':
          await (prisma as any).safetyEquipment.deleteMany();
          break;
        case 'ppe':
          await (prisma as any).pPEWithdrawalItem.deleteMany();
          await (prisma as any).pPEWithdrawal.deleteMany();
          await (prisma as any).pPEStockAdjustment.deleteMany();
          await (prisma as any).pPEExpiryAlert.deleteMany();
          await (prisma as any).pPEStockItem.deleteMany();
          await (prisma as any).pPEStock.deleteMany();
          break;
        case 'certificate_categories':
          await prisma.certificateRenewal.deleteMany();
          await prisma.certificate.deleteMany();
          await prisma.certificateCategory.deleteMany();
          break;
        case 'certificates':
          await prisma.certificateRenewal.deleteMany();
          await prisma.certificate.deleteMany();
        case 'courses':
          await prisma.progress.deleteMany();
          await prisma.enrollment.deleteMany();
          await prisma.chapter.deleteMany();
          await prisma.course.deleteMany();
          await prisma.courseCategory.deleteMany();
          break;
        case 'quizzes':
          await prisma.quizAnswer.deleteMany();
          await prisma.quizAttempt.deleteMany();
          await prisma.quizAssignment.deleteMany();
          await prisma.quizQuestionOption.deleteMany();
          await prisma.quizQuestion.deleteMany();
          await prisma.quiz.deleteMany();
          break;
        case 'work-permits':
        case 'work_permits':
          await prisma.workPermitAttachment.deleteMany();
          await prisma.workPermitHazard.deleteMany();
          await prisma.workPermitRequiredCourse.deleteMany();
          await prisma.workPermitProfession.deleteMany();
          await prisma.workPermitMachine.deleteMany();
          await prisma.workPermitMaterial.deleteMany();
          await prisma.workPermitTool.deleteMany();
          await prisma.workPermitHeavyEquipment.deleteMany();
          await prisma.workPermitWorker.deleteMany();
          await prisma.workPermitEmployee.deleteMany();
          await prisma.workPermitClassification.deleteMany();
          await prisma.workPermitToSafetyEquipment.deleteMany();
          await prisma.workPermitToUser.deleteMany();
          await prisma.workPermitSupervisorToGuest.deleteMany();
          await prisma.workPermit.deleteMany();
          await prisma.guest.deleteMany();
          break;
        case 'man_hours':
        case 'man-hours':
          await prisma.manHour.deleteMany();
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log(
            'Available tables: users, roles, permissions, offices, departments, job_positions, settings, menus, notifications, categories, product_types, courses, chapters, quizzes, file_categories, file_storage_providers, file_uploads, safety_equipment_types, safety_equipments, ppe, work-permits, man_hours',
          );
          process.exit(1);
      }
      console.log(`Cleared existing data for table: ${tableToSeed}`);
    }

    // Seed data based on the specified table or all tables
    if (!tableToSeed) {
      // Seed all tables in order of dependencies
      const permissions = await seedPermissions(prisma);
      const roles = await seedRoles(prisma, permissions);
      const offices = await seedOffices(prisma);
      const departments = await seedDepartments(prisma);
      const jobPositions = await seedJobPositions(prisma);
      await seedUsers(prisma, roles, offices);

      // Seed risk-related data
      const riskCategories = await seedRiskCategories(prisma);
      const risks = await seedRisks(
        prisma,
        riskCategories.map((c) => c.id),
      );
      await seedRiskMitigations(
        prisma,
        risks.map((r) => r.id),
      );

      // Seed Risk Matrix
      await seedRiskMatrix(prisma);

      await seedSettings(prisma);
      await seedMenus();
      await seedNotifications();
      await seedFileStorageProviders();
      await seedFileCategories();
      await seedSafetyEquipmentTypes();
      await seedSafetyEquipments();
      await seedPPE();
      await seedCertificateCategories(prisma);
      await seedCertificates(prisma);
      await seedCourses();
      await seedQuizzes();
      await seedWorkPermitsData(prisma);
      await seedAreas();
      await seedRooms();
      await seedEnvironmentalMeasurements();
      await seedWasteManagement();
      await seedManHours();
      console.log('All tables seeded successfully');
    } else {
      // Seed only the specified table
      switch (tableToSeed) {
        case 'permissions':
          await seedPermissions(prisma);
          break;
        case 'roles':
          const permissions = await seedPermissions(prisma);
          await seedRoles(prisma, permissions);
          break;
        case 'offices':
          await seedOffices(prisma);
          break;
        case 'departments':
          await seedDepartments(prisma);
          break;
        case 'job_positions':
          await seedJobPositions(prisma);
          break;
        case 'users':
          const perms = await seedPermissions(prisma);
          const roles = await seedRoles(prisma, perms);
          const offices = await seedOffices(prisma);
          await seedUsers(prisma, roles, offices);
          break;
        case 'risk_categories':
          await seedRiskCategories(prisma);
          break;
        case 'risks':
          // Find existing categories or create new ones if they don't exist
          let categories;
          try {
            categories = await (prisma as any).riskCategory.findMany();
            if (categories.length === 0) {
              categories = await seedRiskCategories(prisma);
            } else {
              console.log('Using existing risk categories...');
            }
          } catch (error) {
            console.log('Error finding categories, creating new ones...');
            categories = await seedRiskCategories(prisma);
          }
          await seedRisks(
            prisma,
            categories.map((c) => c.id),
          );
          break;
        case 'risk_mitigations':
          // Find existing risks or create new ones if they don't exist
          let cats, risks;
          try {
            cats = await (prisma as any).riskCategory.findMany();
            if (cats.length === 0) {
              cats = await seedRiskCategories(prisma);
            } else {
              console.log('Using existing risk categories...');
            }

            // Try to find risks from m_risk table
            try {
              risks = await (prisma as any).risk.findMany();
            } catch (error: any) {
              // If table doesn't exist yet (P2021), it means migration hasn't run - just set to empty array
              if (error.code === 'P2021') {
                risks = [];
              } else {
                throw error;
              }
            }
            if (risks.length === 0) {
              risks = await seedRisks(
                prisma,
                cats.map((c) => c.id),
              );
            } else {
              console.log('Using existing risks...');
            }
          } catch (error) {
            console.log(
              'Error finding categories or risks, creating new ones...',
            );
            cats = await seedRiskCategories(prisma);
            risks = await seedRisks(
              prisma,
              cats.map((c) => c.id),
            );
          }
          await seedRiskMitigations(
            prisma,
            risks.map((r) => r.id),
          );
          break;
        case 'risk_matrix':
          await seedRiskMatrix(prisma);
        case 'settings':
          await seedSettings(prisma);
          break;
        case 'menus':
          const permsForMenus = await seedPermissions(prisma);
          const rolesForMenus = await seedRoles(prisma, permsForMenus);
          await seedMenus();
          break;
        case 'notifications':
          await seedNotifications();
          break;
        case 'file_categories':
          await seedFileCategories();
          break;
        case 'file_storage_providers':
          await seedFileStorageProviders();
          break;
        case 'file_uploads':
          // Note: file uploads are created through the API, not seeded
          console.log('File uploads are created through the API, not seeded');
          break;
        case 'safety_equipment_types':
          await seedSafetyEquipmentTypes();
          break;
        case 'safety_equipments':
          await seedSafetyEquipments();
          break;
        case 'ppe':
          await seedPPE();
          break;
        case 'certificate_categories':
          await seedCertificateCategories(prisma);
          break;
        case 'certificates':
          await seedCertificates(prisma);
        case 'courses':
          await seedCourses();
          break;
        case 'quizzes':
          // Quizzes depend on courses, so ensure courses exist first
          const existingCourses = await prisma.course.findMany();
          if (existingCourses.length === 0) {
            console.log('⚠️  No courses found. Seeding courses first...');
            await seedCourses();
          }
          await seedQuizzes();
          break;
        case 'work_permits':
          // Clear work permit related data
          await prisma.workPermitAttachment.deleteMany();
          await prisma.workPermitHazard.deleteMany();
          await prisma.workPermitRequiredCourse.deleteMany();
          await prisma.workPermitProfession.deleteMany();
          await prisma.workPermitMachine.deleteMany();
          await prisma.workPermitMaterial.deleteMany();
          await prisma.workPermitTool.deleteMany();
          await prisma.workPermitHeavyEquipment.deleteMany();
          await prisma.workPermitWorker.deleteMany();
          await prisma.workPermitEmployee.deleteMany();
          await prisma.workPermitClassification.deleteMany();
          await prisma.workPermitToSafetyEquipment.deleteMany();
          await prisma.workPermitToUser.deleteMany();
          await prisma.workPermitSupervisorToGuest.deleteMany();
          await prisma.workPermit.deleteMany();
          await prisma.guest.deleteMany();
          // Note: Master data (work classifications, equipment, etc.) are not cleared
          await seedWorkPermitsData(prisma);
          break;
        case 'man_hours':
        case 'man-hours':
          await seedManHours();
          break;
      }
      console.log(`Table ${tableToSeed} seeded successfully`);
    }

    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
