/**
 * Risk Assessment and Inspection seed data
 * Following seed.ts patterns for seed data
 */
import { PrismaClient, GeneralStatusEnum, RiskRatingEnum } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Generate risk assessment code: RA{YY}{MM}{DD}{HH}{MM}{SS}
 */
const generateRiskAssessmentCode = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return `RA${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Generate inspection code: INS{YY}{MM}{DD}{HH}{MM}{SS}
 */
const generateInspectionCode = (date: Date): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  return `INS${year}${month}${day}${hour}${minute}${second}`;
};

/**
 * Calculate risk matrix rating from likelihood and consequence
 */
const calculateRiskRating = (
  likelihood: string,
  consequence: number,
): { rating: string; interpretation: RiskRatingEnum } => {
  const likelihoodMap: Record<string, number> = {
    'Very Low': 1,
    'Low': 2,
    'Medium': 3,
    'High': 4,
    'Very High': 5,
  };

  const likelihoodValue = likelihoodMap[likelihood] || 3;
  const score = likelihoodValue * consequence;

  if (score <= 5) {
    return { rating: 'LOW', interpretation: RiskRatingEnum.LOW };
  } else if (score <= 10) {
    return { rating: 'MEDIUM', interpretation: RiskRatingEnum.MEDIUM };
  } else if (score <= 15) {
    return { rating: 'HIGH', interpretation: RiskRatingEnum.HIGH };
  } else {
    return { rating: 'EXTREME', interpretation: RiskRatingEnum.EXTREME };
  }
};

export const seedRiskAssessmentsAndInspections = async (
  prismaClient?: PrismaClient,
): Promise<void> => {
  const client = prismaClient || prisma;
  console.log('🌱 Seeding risk assessments and inspections...');

  try {
    // Get dependencies
    const adminUser = await client.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('⚠️  Admin user not found. Please run users seed first.');
      return;
    }

    const departments = await client.department.findMany({
      where: { isActive: true },
      take: 5,
    });

    if (departments.length === 0) {
      console.log('⚠️  No departments found. Please run departments seed first.');
      return;
    }

    const users = await client.user.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (users.length === 0) {
      console.log('⚠️  No users found. Please run users seed first.');
      return;
    }

    const riskCategories = await (client as any).riskCategory.findMany({
      where: { isActive: true },
    });

    if (riskCategories.length === 0) {
      console.log('⚠️  No risk categories found. Please run risk-categories seed first.');
      return;
    }

    const risks = await (client as any).risk.findMany({
      where: { isActive: true },
      include: {
        riskCategory: true,
      },
    });

    if (risks.length === 0) {
      console.log('⚠️  No risks found. Please run risks seed first.');
      return;
    }

    const areas = await client.area.findMany({
      where: { isActive: true },
      take: 10,
    });

    if (areas.length === 0) {
      console.log('⚠️  No areas found. Please run areas seed first.');
      return;
    }

    // Clear existing data
    console.log('Clearing existing risk assessments and inspections...');
    await client.inspectionImage.deleteMany();
    await client.inspectionInspector.deleteMany();
    await client.inspectionItem.deleteMany();
    await client.inspection.deleteMany();
    await client.riskAssessmentItem.deleteMany();
    await client.riskAssessment.deleteMany();

    const today = new Date();
    const riskAssessments: Array<{
      id: string;
      code: string;
      description: string | null;
      departmentId: string;
      assessmentDate: Date;
      status: GeneralStatusEnum;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
      assigneeId: string | null;
      actionPlan: string | null;
      items: Array<any>;
    }> = [];
    const inspections: Array<{
      id: string;
      code: string;
      inspectionDate: Date;
      status: GeneralStatusEnum;
      isActive: boolean;
      createdAt: Date;
      updatedAt: Date;
      createdBy: string;
      doneAt: Date | null;
      items: Array<any>;
    }> = [];

    // ========================================================================
    // SEED RISK ASSESSMENTS (with at least 20 items)
    // Note: Risk assessments have status (OPEN or DONE), items don't have status
    // ========================================================================
    console.log('📊 Creating risk assessments...');

    // Create 3 risk assessments with multiple items each (only OPEN or DONE status)
    for (let i = 0; i < 3; i++) {
      const assessmentDate = new Date(today);
      assessmentDate.setDate(today.getDate() - (i * 7)); // Spread over 3 weeks
      assessmentDate.setHours(9, 0, 0, 0);

      const department = departments[i % departments.length];
      // Only OPEN or DONE status for risk assessments
      const statuses: GeneralStatusEnum[] = [
        GeneralStatusEnum.OPEN,
        GeneralStatusEnum.OPEN,
        GeneralStatusEnum.DONE,
      ];
      const status = statuses[i];

      const code = generateRiskAssessmentCode(assessmentDate);
      const assessment = await client.riskAssessment.create({
        data: {
          code,
          description: `Risk Assessment for ${department.name} - Assessment ${i + 1}`,
          departmentId: department.id,
          assessmentDate,
          status,
          isActive: true,
          createdBy: adminUser.id,
          assigneeId: i === 2 ? users[0].id : null, // Assign last one
          actionPlan:
            i === 2
              ? 'Implement safety measures and monitor progress weekly.'
              : null,
        },
      });

      // Create 7-8 items per assessment (total will be at least 20 items)
      const itemsPerAssessment = i < 2 ? 7 : 8; // First two get 7, last gets 8
      const assessmentItems: Array<any> = [];

      for (let j = 0; j < itemsPerAssessment; j++) {
        const risk = risks[j % risks.length];
        const riskCategory = risk.riskCategory || riskCategories[j % riskCategories.length];

        const likelihoodLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
        const consequenceLevels = [1, 2, 3, 4, 5];

        const likelihoodLevel =
          likelihoodLevels[Math.floor(Math.random() * likelihoodLevels.length)];
        const consequenceLevel =
          consequenceLevels[Math.floor(Math.random() * consequenceLevels.length)];

        const { rating: riskMatrixRating, interpretation } = calculateRiskRating(
          likelihoodLevel,
          consequenceLevel,
        );

        // Post-mitigation values (improved)
        const postLikelihoodLevel =
          likelihoodLevels[
            Math.max(0, likelihoodLevels.indexOf(likelihoodLevel) - 1)
          ];
        const postConsequenceLevel = Math.max(1, consequenceLevel - 1);
        const {
          rating: postRiskMatrixRating,
          interpretation: postInterpretation,
        } = calculateRiskRating(postLikelihoodLevel, postConsequenceLevel);

        const item = await client.riskAssessmentItem.create({
          data: {
            riskAssessmentId: assessment.id,
            mRiskId: risk.id,
            mRiskCategoryId: riskCategory.id,
            likelihoodLevel,
            consequenceLevel,
            riskMatrixRating,
            interpretation,
            postLikelihoodLevel,
            postConsequenceLevel,
            postRiskMatrixRating,
            postInterpretation,
          },
        });

        assessmentItems.push(item);
      }

      riskAssessments.push({ ...assessment, items: assessmentItems });
    }

    console.log(
      `✅ Created ${riskAssessments.length} risk assessments with ${riskAssessments.reduce((sum, ra) => sum + ra.items.length, 0)} items`,
    );

    // ========================================================================
    // SEED INSPECTIONS (with at least 20 items)
    // Note: Both inspections and inspection items have status (only OPEN or DONE)
    // ========================================================================
    console.log('🔍 Creating inspections...');

    // Create 4 inspections with multiple items each (only OPEN or DONE status)
    for (let i = 0; i < 4; i++) {
      const inspectionDate = new Date(today);
      inspectionDate.setDate(today.getDate() - (i * 3)); // Spread over 2 weeks
      inspectionDate.setHours(10, 0, 0, 0);

      // Only OPEN or DONE status for inspections
      const statuses: GeneralStatusEnum[] = [
        GeneralStatusEnum.OPEN,
        GeneralStatusEnum.OPEN,
        GeneralStatusEnum.DONE,
        GeneralStatusEnum.DONE,
      ];
      const status = statuses[i];

      const code = generateInspectionCode(inspectionDate);
      const inspectionAreas = [
        areas[i % areas.length],
        areas[(i + 1) % areas.length],
      ].filter(Boolean);

      const inspection = await client.inspection.create({
        data: {
          code,
          inspectionDate,
          status,
          isActive: true,
          createdBy: adminUser.id,
          doneAt: status === GeneralStatusEnum.DONE ? inspectionDate : null,
          areas: {
            create: inspectionAreas.map((area, idx) => ({
              areaId: area.id,
            })),
          },
          inspectors: {
            create: [
              {
                inspectorId: users[i % users.length].id,
                order: 1,
              },
              {
                inspectorId: users[(i + 1) % users.length].id,
                order: 2,
              },
            ],
          },
        },
      });

      // Create 5-6 items per inspection (total will be at least 20 items)
      const itemsPerInspection = 5 + (i % 2); // Alternates between 5 and 6
      const inspectionItems: Array<any> = [];

      for (let j = 0; j < itemsPerInspection; j++) {
        const risk = risks[j % risks.length];
        const riskCategory = risk.riskCategory || riskCategories[j % riskCategories.length];
        const area = areas[j % areas.length];
        const department = departments[j % departments.length];
        const assignee = j % 3 === 0 ? users[j % users.length] : null; // Assign every 3rd item

        // Only OPEN or DONE status for inspection items
        const itemStatuses: GeneralStatusEnum[] = [
          GeneralStatusEnum.OPEN,
          GeneralStatusEnum.DONE,
        ];
        // If inspection is DONE, make most items DONE; if OPEN, mix OPEN and DONE
        const itemStatus =
          status === GeneralStatusEnum.DONE
            ? GeneralStatusEnum.DONE // All items DONE when inspection is DONE
            : itemStatuses[j % itemStatuses.length]; // Mix OPEN and DONE when inspection is OPEN

        const findings =
          j % 3 === 0
            ? `Finding ${j + 1}: Identified potential safety hazard that requires immediate attention.`
            : null;

        const description =
          j % 2 === 0
            ? `Inspection item ${j + 1} for ${area.name} - ${risk.name}`
            : null;

        const followUpNotes =
          itemStatus === GeneralStatusEnum.DONE
            ? `Follow-up completed on ${new Date().toLocaleDateString()}. All issues resolved.`
            : null;

        const dueDate = new Date(inspectionDate);
        dueDate.setDate(dueDate.getDate() + (7 + j * 2)); // Different due dates

        // Note: Prisma client types expect 'order' field but schema doesn't have it
        // Using type assertion to bypass this type mismatch
        const item = await client.inspectionItem.create({
          data: {
            inspectionId: inspection.id,
            areaId: area.id,
            riskCategoryId: riskCategory.id,
            riskId: risk.id,
            assignedDepartmentId: department.id,
            assigneeId: assignee?.id || null,
            status: itemStatus,
            findings,
            description,
            followUpNotes,
            dueDateAt: dueDate,
            order: j + 1, // Prisma client expects this, but schema may not have it
          } as any, // Type assertion to bypass Prisma client type mismatch
        });

        inspectionItems.push(item);
      }

      inspections.push({ ...inspection, items: inspectionItems });
    }

    console.log(
      `✅ Created ${inspections.length} inspections with ${inspections.reduce((sum, ins) => sum + ins.items.length, 0)} items`,
    );

    // Summary
    const totalRiskItems = riskAssessments.reduce(
      (sum, ra) => sum + ra.items.length,
      0,
    );
    const totalInspectionItems = inspections.reduce(
      (sum, ins) => sum + ins.items.length,
      0,
    );

    console.log('\n📋 Summary:');
    console.log(`   - Risk Assessments: ${riskAssessments.length}`);
    console.log(`   - Risk Assessment Items: ${totalRiskItems}`);
    console.log(`   - Inspections: ${inspections.length}`);
    console.log(`   - Inspection Items: ${totalInspectionItems}`);
    console.log(`   - Total Items: ${totalRiskItems + totalInspectionItems}`);

    if (totalRiskItems >= 20 && totalInspectionItems >= 20) {
      console.log('✅ Minimum requirements met (20+ items each)');
    } else {
      console.warn(
        '⚠️  Minimum requirements not fully met. Please check item counts.',
      );
    }
  } catch (error) {
    console.error('❌ Error seeding risk assessments and inspections:', error);
    throw error;
  }
};

export default seedRiskAssessmentsAndInspections;