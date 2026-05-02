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
import { seedHealthQuizzes } from './seeds/health-quizzes.seed';
import { seedWorkPermitsData } from './seeds/work-permits.seed';
import { seedAreas } from './seeds/areas.seed';
import { seedRooms } from './seeds/rooms.seed';
import { seedEnvironmentalMeasurements } from './seeds/environmental-measurements.seed';
import { seedWasteManagement } from './seeds/waste-management.seed';
import { seedManHours } from './seeds/man-hours.seed';
import { seedMailTemplates } from './seeds/mail-templates.seed';
import { seedMasterApprovals } from './seeds/master-approvals.seed';
import { seedAuditPolicy } from './seeds/audit-policy.seed';
import { seedRiskAssessmentsAndInspections } from './seeds/risk-assessments-inspections.seed';
import { seedAuditSchedules } from './seeds/audit-schedules.seed';
import { seedWorkPermitApprovalTest } from './seeds/work-permit-approval-test.seed';
import { seedIncidents } from './seeds/incidents.seed';
import { seedKpiHseTargets } from './seeds/kpi-hse-targets.seed';
import {
  seedWorkClassifications,
  seedWorkClassificationRiskMitigations,
} from './seeds/work-classifications.seed';
import { seedWorkClassificationSafetyGuidelines } from './seeds/work-classification-safety-guidelines.seed';

const dbUrl = process.env.DATABASE_URL ?? '';
const dbUrlSep = dbUrl.includes('?') ? '&' : '?';
const prisma = new PrismaClient({
  datasources: {
    db: { url: `${dbUrl}${dbUrlSep}connection_limit=1&pool_timeout=30` },
  },
});

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
      await prisma.emailTemplate.deleteMany();
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
      await prisma.healthScreening.deleteMany();
      await prisma.quizAttempt.deleteMany();
      await prisma.quizAssignment.deleteMany();
      await prisma.quizQuestionOption.deleteMany();
      await prisma.quizQuestion.deleteMany();
      await prisma.quiz.deleteMany();
      // Clear Work Permit data (before User deletion)
      await prisma.workPermitAttachment.deleteMany();
      await prisma.workPermitHazard.deleteMany();
      await prisma.workPermitRequiredCourse.deleteMany();
      await prisma.workPermitMachine.deleteMany();
      await prisma.workPermitMaterial.deleteMany();
      await prisma.workPermitTool.deleteMany();
      await prisma.workPermitHeavyEquipment.deleteMany();
      await prisma.workPermitWorker.deleteMany();
      await prisma.worker.deleteMany();
      await prisma.workPermitEmployee.deleteMany();
      await prisma.workPermitClassification.deleteMany();
      await prisma.workPermitToSafetyEquipment.deleteMany();
      await prisma.workPermitToUser.deleteMany();
      await prisma.workPermitSupervisorToGuest.deleteMany();
      await prisma.workPermit.deleteMany();
      await prisma.guest.deleteMany();
      // Clear Incident data (before User deletion)
      await prisma.incidentAttachment.deleteMany();
      await prisma.incidentImage.deleteMany();
      await prisma.incidentAsset.deleteMany();
      await prisma.incidentWitness.deleteMany();
      await prisma.incidentInjuredPerson.deleteMany();
      await prisma.incident.deleteMany();
      // Clear Inspection data (before User deletion)
      await prisma.inspectionImage.deleteMany();
      await prisma.inspectionInspector.deleteMany();
      await prisma.inspectionItem.deleteMany();
      await prisma.inspection.deleteMany();
      // Clear Audit Schedule data (before User deletion)
      await prisma.auditImage.deleteMany();
      await prisma.auditItemToDepartment.deleteMany();
      await prisma.auditItemToUser.deleteMany();
      await prisma.auditItem.deleteMany();
      await prisma.auditToUser.deleteMany();
      await prisma.auditToArea.deleteMany();
      await prisma.audit.deleteMany();
      await prisma.auditPeriod.deleteMany();
      // Clear Environmental Measurements and Rooms
      await prisma.environmentalMeasurement.deleteMany();
      await prisma.room.deleteMany();
      // Clear Waste Management data
      await prisma.weightReportItem.deleteMany();
      await prisma.dispatchOrder.deleteMany();
      await prisma.weightReport.deleteMany();
      await prisma.waterQualityLabReportResult.deleteMany();
      await prisma.waterQualityLabReport.deleteMany();
      await prisma.monthlyFlowReport.deleteMany();
      await prisma.storageLocation.deleteMany();
      await prisma.wasteSource.deleteMany();
      await prisma.wasteType.deleteMany();
      await prisma.waterQualityParameter.deleteMany();
      await prisma.treatmentPlant.deleteMany();
      // Clear Man Hours data
      await prisma.manHour.deleteMany();
      // Clear KPI HSE Targets (before User deletion)
      await prisma.hseTarget.deleteMany();
      // Clear other data
      await prisma.masterApprovalItem.deleteMany();
      await prisma.approval.deleteMany();
      await prisma.masterApproval.deleteMany();
      await prisma.fileAccessLog.deleteMany();
      await prisma.fileUpload.deleteMany();
      // Clear RiskAssessment data (before User deletion)
      await prisma.riskAssessmentItem.deleteMany();
      await prisma.riskAssessment.deleteMany();
      // Clear Reminder data (before User deletion)
      await prisma.reminderLog.deleteMany();
      await prisma.reminder.deleteMany();
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
      // Clear audit policy data
      await prisma.auditCriteria.deleteMany();
      await prisma.auditClause.deleteMany();
      await prisma.auditElement.deleteMany();
      console.log('All existing data cleared successfully');
    } else {
      // Clear only the specified table
      switch (tableToSeed) {
        case 'users':
          // Delete records that reference users before deleting users (in dependency order)
          await prisma.notificationRecipient.deleteMany();
          await prisma.notification.deleteMany();
          await prisma.refreshToken.deleteMany();
          // Clear PPE data
          await (prisma as any).pPEWithdrawalItem.deleteMany();
          await (prisma as any).pPEWithdrawal.deleteMany();
          await (prisma as any).pPEStockAdjustment.deleteMany();
          await (prisma as any).pPEExpiryAlert.deleteMany();
          await (prisma as any).pPEStockItem.deleteMany();
          await (prisma as any).pPEStock.deleteMany();
          // Clear Certificate data
          await prisma.certificateReminder.deleteMany();
          await prisma.certificateRenewal.deleteMany();
          await prisma.certificate.deleteMany();
          // Clear Course data
          await prisma.progress.deleteMany();
          await prisma.enrollment.deleteMany();
          await prisma.chapter.deleteMany();
          await prisma.course.deleteMany();
          // Clear Quiz data
          await prisma.quizAnswer.deleteMany();
          await prisma.healthScreening.deleteMany();
          await prisma.quizAttempt.deleteMany();
          await prisma.quizAssignment.deleteMany();
          await prisma.quizQuestionOption.deleteMany();
          await prisma.quizQuestion.deleteMany();
          await prisma.quiz.deleteMany();
          // Clear Work Permit data
          await prisma.workPermitAttachment.deleteMany();
          await prisma.workPermitHazard.deleteMany();
          await prisma.workPermitRequiredCourse.deleteMany();
          await prisma.workPermitMachine.deleteMany();
          await prisma.workPermitMaterial.deleteMany();
          await prisma.workPermitTool.deleteMany();
          await prisma.workPermitHeavyEquipment.deleteMany();
          await prisma.workPermitWorker.deleteMany();
          await prisma.worker.deleteMany();
          await prisma.workPermitEmployee.deleteMany();
          await prisma.workPermitClassification.deleteMany();
          await prisma.workPermitToSafetyEquipment.deleteMany();
          await prisma.workPermitToUser.deleteMany();
          await prisma.workPermitSupervisorToGuest.deleteMany();
          await prisma.workPermit.deleteMany();
          // Clear Incident data
          await prisma.incidentAttachment.deleteMany();
          await prisma.incidentImage.deleteMany();
          await prisma.incidentAsset.deleteMany();
          await prisma.incidentWitness.deleteMany();
          await prisma.incidentInjuredPerson.deleteMany();
          await prisma.incident.deleteMany();
          // Clear Inspection data
          await prisma.inspectionImage.deleteMany();
          await prisma.inspectionInspector.deleteMany();
          await prisma.inspectionItem.deleteMany();
          await prisma.inspection.deleteMany();
          // Clear Environmental Measurements
          await prisma.environmentalMeasurement.deleteMany();
          // Clear Waste Management data
          await prisma.weightReportItem.deleteMany();
          await prisma.dispatchOrder.deleteMany();
          await prisma.weightReport.deleteMany();
          await prisma.waterQualityLabReportResult.deleteMany();
          await prisma.waterQualityLabReport.deleteMany();
          await prisma.monthlyFlowReport.deleteMany();
          await prisma.storageLocation.deleteMany();
          await prisma.treatmentPlant.deleteMany();
          // Clear Man Hours data
          await prisma.manHour.deleteMany();
          // Clear Approval data
          await prisma.masterApprovalItem.deleteMany();
          await prisma.approval.deleteMany();
          // Clear RiskAssessment data
          await prisma.riskAssessmentItem.deleteMany();
          await prisma.riskAssessment.deleteMany();
          // Clear Reminder data
          await prisma.reminderLog.deleteMany();
          await prisma.reminder.deleteMany();
          // Clear File data
          await prisma.fileAccessLog.deleteMany();
          await prisma.fileUpload.deleteMany();
          // Finally delete users
          await prisma.user.deleteMany();
          break;
        case 'roles':
          // Do not delete roles: users reference roles (t_users_roleId_fkey).
          // seedRoles uses upsert by name, so existing roles and their permissions are updated.
          break;
        case 'email_templates':
        case 'email-templates':
          await prisma.emailTemplate.deleteMany();
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
        case 'health_quizzes':
        case 'health-quizzes':
          // Idempotent seed (skip if template exists); do not delete all quizzes
          break;
        case 'work-permits':
        case 'work_permits':
          await prisma.healthScreening.deleteMany();
          await prisma.workPermitAttachment.deleteMany();
          await prisma.workPermitHazard.deleteMany();
          await prisma.workPermitRequiredCourse.deleteMany();
          await prisma.workPermitMachine.deleteMany();
          await prisma.workPermitMaterial.deleteMany();
          await prisma.workPermitTool.deleteMany();
          await prisma.workPermitHeavyEquipment.deleteMany();
          await prisma.workPermitWorker.deleteMany();
          await prisma.worker.deleteMany();
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
        case 'hse_targets':
        case 'kpi-hse-targets':
          await prisma.hseTarget.deleteMany();
          break;
        case 'audit_policy':
        case 'audit-policy':
          await prisma.auditCriteria.deleteMany();
          await prisma.auditClause.deleteMany();
          await prisma.auditElement.deleteMany();
          break;
        case 'audit_schedules':
        case 'audit-schedules':
          // Clear audit schedule data first (foreign key dependencies)
          await prisma.auditImage.deleteMany();
          await prisma.auditItemToDepartment.deleteMany();
          await prisma.auditItemToUser.deleteMany();
          await prisma.auditItem.deleteMany();
          await prisma.auditToUser.deleteMany();
          await prisma.auditToArea.deleteMany();
          await prisma.audit.deleteMany();
          await prisma.auditPeriod.deleteMany();
          break;
        case 'work_permit_approvals':
        case 'work-permit-approvals':
          // Data clearing is handled inside the seeder itself
          break;
        case 'master_approvals':
        case 'master-approvals':
        case 'approvals':
          await prisma.masterApprovalItem.deleteMany();
          await prisma.approval.deleteMany();
          await prisma.masterApproval.deleteMany();
          break;
        case 'risk_assessments':
        case 'risk-assessments':
        case 'inspections':
        case 'risk_assessments_inspections':
        case 'risk-assessments-inspections':
          // Clear inspection data first (foreign key dependencies)
          await prisma.inspectionImage.deleteMany();
          await prisma.inspectionInspector.deleteMany();
          await prisma.inspectionItem.deleteMany();
          await prisma.inspection.deleteMany();
          // Clear risk assessment data
          await prisma.riskAssessmentItem.deleteMany();
          await prisma.riskAssessment.deleteMany();
          break;
        case 'incidents':
          // Clear incident data (foreign key dependencies)
          await prisma.incidentAttachment.deleteMany();
          await prisma.incidentImage.deleteMany();
          await prisma.incidentAsset.deleteMany();
          await prisma.incidentWitness.deleteMany();
          await prisma.incidentInjuredPerson.deleteMany();
          await prisma.incident.deleteMany();
          break;
        case 'waste_management':
        case 'waste-management':
        case 'waste-managements':
          await prisma.weightReportItem.deleteMany();
          await prisma.dispatchOrder.deleteMany();
          await prisma.weightReport.deleteMany();
          await prisma.waterQualityLabReportResult.deleteMany();
          await prisma.waterQualityLabReport.deleteMany();
          await prisma.monthlyFlowReport.deleteMany();
          await prisma.storageLocation.deleteMany();
          await prisma.wasteSource.deleteMany();
          await prisma.wasteType.deleteMany();
          await prisma.waterQualityParameter.deleteMany();
          await prisma.treatmentPlant.deleteMany();
          break;
        case 'work-classification-safety-guidelines':
        case 'work_classification_safety_guidelines':
          // No rows to clear — seeder only updates existing classifications
          break;
        case 'work-classifications':
        case 'work_classifications':
          // Upsert-only; clearing would require removing work permits that reference classifications
          break;
        default:
          console.error(`Unknown table: ${tableToSeed}`);
          console.log(
            'Available tables: users, roles, permissions, offices, departments, job_positions, email-templates (or email_templates), settings, menus, notifications, categories, product_types, courses, chapters, quizzes, health-quizzes (or health_quizzes), file_categories, file_storage_providers, file_uploads, safety_equipment_types, safety_equipments, ppe, work-permits, man_hours, waste-management, audit-policy, audit-schedules, approvals, master-approvals, risk-assessments, inspections, risk-assessments-inspections, incidents, work-classifications, work-classification-safety-guidelines',
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

      // Seed Master Approvals (requires users, departments, job positions)
      await seedMasterApprovals(prisma);

      await seedSettings(prisma);
      await seedMenus();
      await seedNotifications();
      await seedMailTemplates(prisma);
      await seedFileStorageProviders();
      await seedFileCategories();
      await seedSafetyEquipmentTypes();
      await seedSafetyEquipments();
      await seedPPE();
      await seedCertificateCategories(prisma);
      await seedCertificates(prisma);
      await seedCourses();
      await seedQuizzes();
      await seedHealthQuizzes();
      await seedWorkClassifications(prisma);
      await seedWorkClassificationSafetyGuidelines(prisma);
      await seedWorkPermitsData(prisma);
      await seedAreas();
      await seedRooms();
      await seedEnvironmentalMeasurements();
      await seedWasteManagement();
      await seedManHours();
      await seedAuditPolicy(prisma);
      await seedAuditSchedules(prisma);
      await seedRiskAssessmentsAndInspections(prisma);
      await seedIncidents();
      await seedKpiHseTargets();
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
        case 'email_templates':
        case 'email-templates':
          await seedMailTemplates(prisma);
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
          // Find existing types of hazard or create new ones if they don't exist
          let categories;
          try {
            categories = await (prisma as any).riskCategory.findMany();
            if (categories.length === 0) {
              categories = await seedRiskCategories(prisma);
            } else {
              console.log('Using existing types of hazard...');
            }
          } catch (error) {
            console.log('Error finding types of hazard, creating new ones...');
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
              console.log('Using existing types of hazard...');
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
              'Error finding types of hazard or risks, creating new ones...',
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
        case 'health_quizzes':
        case 'health-quizzes':
          await seedHealthQuizzes();
          break;
        case 'work_permits':
          // Clear work permit related data
          await prisma.healthScreening.deleteMany();
          await prisma.workPermitAttachment.deleteMany();
          await prisma.workPermitHazard.deleteMany();
          await prisma.workPermitRequiredCourse.deleteMany();
          await prisma.workPermitMachine.deleteMany();
          await prisma.workPermitMaterial.deleteMany();
          await prisma.workPermitTool.deleteMany();
          await prisma.workPermitHeavyEquipment.deleteMany();
          await prisma.workPermitWorker.deleteMany();
          await prisma.worker.deleteMany();
          await prisma.workPermitEmployee.deleteMany();
          await prisma.workPermitClassification.deleteMany();
          await prisma.workPermitToSafetyEquipment.deleteMany();
          await prisma.workPermitToUser.deleteMany();
          await prisma.workPermitSupervisorToGuest.deleteMany();
          await prisma.workPermit.deleteMany();
          await prisma.guest.deleteMany();
          // Note: Master data (work classifications, equipment, etc.) are not cleared
          await seedWorkClassifications(prisma);
          await seedWorkClassificationSafetyGuidelines(prisma);
          await seedWorkPermitsData(prisma);
          break;
        case 'work-classifications':
        case 'work_classifications':
          await seedWorkClassifications(prisma);
          break;
        case 'work-classification-safety-guidelines':
        case 'work_classification_safety_guidelines':
          await seedWorkClassificationSafetyGuidelines(prisma);
          break;
        case 'work-classification-risk-mitigations':
        case 'work_classification_risk_mitigations':
          await seedWorkClassificationRiskMitigations(prisma);
          break;
        case 'man_hours':
        case 'man-hours':
          await seedManHours();
          break;
        case 'hse_targets':
        case 'kpi-hse-targets':
          await seedKpiHseTargets();
          break;
        case 'master_approvals':
        case 'master-approvals':
        case 'approvals':
          // Ensure required dependencies exist
          const existingUsers = await prisma.user.findMany();
          const existingDepts = await prisma.department.findMany();
          const existingJobs = await prisma.jobPosition.findMany();
          if (existingUsers.length === 0 || existingDepts.length === 0 || existingJobs.length === 0) {
            console.log('⚠️  Missing required data. Please seed users, departments, and job positions first.');
            break;
          }
          await seedMasterApprovals(prisma);
          break;
        case 'audit_policy':
        case 'audit-policy':
          await prisma.auditCriteria.deleteMany();
          await prisma.auditClause.deleteMany();
          await prisma.auditElement.deleteMany();
          await seedAuditPolicy(prisma);
          break;
        case 'audit_schedules':
        case 'audit-schedules':
          // Clear audit schedule data first (foreign key dependencies)
          await prisma.auditImage.deleteMany();
          await prisma.auditItemToDepartment.deleteMany();
          await prisma.auditItemToUser.deleteMany();
          await prisma.auditItem.deleteMany();
          await prisma.auditToUser.deleteMany();
          await prisma.auditToArea.deleteMany();
          await prisma.audit.deleteMany();
          await seedAuditSchedules(prisma);
          break;
        case 'work_permit_approvals':
        case 'work-permit-approvals':
          await seedWorkPermitApprovalTest(prisma);
          break;
        case 'risk_assessments':
        case 'risk-assessments':
        case 'inspections':
        case 'risk_assessments_inspections':
        case 'risk-assessments-inspections':
          // Clear inspection data first (foreign key dependencies)
          await prisma.inspectionImage.deleteMany();
          await prisma.inspectionInspector.deleteMany();
          await prisma.inspectionItem.deleteMany();
          await prisma.inspection.deleteMany();
          // Clear risk assessment data
          await prisma.riskAssessmentItem.deleteMany();
          await prisma.riskAssessment.deleteMany();
          await seedRiskAssessmentsAndInspections(prisma);
          break;
        case 'incidents':
          // Clear incident data (foreign key dependencies)
          await prisma.incidentAttachment.deleteMany();
          await prisma.incidentImage.deleteMany();
          await prisma.incidentAsset.deleteMany();
          await prisma.incidentWitness.deleteMany();
          await prisma.incidentInjuredPerson.deleteMany();
          await prisma.incident.deleteMany();
          await seedIncidents();
          break;
        case 'waste_management':
        case 'waste-management':
        case 'waste-managements':
          await seedWasteManagement();
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
