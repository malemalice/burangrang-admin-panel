/**
 * Risk Assessment and Inspection seed data
 * Following seed.ts patterns for seed data
 */
import { GeneralStatusEnum, PrismaClient, RiskRatingEnum } from '@prisma/client';
import { seedPrisma as prisma } from './prisma-seed-client';

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
 * Generate risk mitigation record code: RSK{YY}{MM}{DD}{HH}{MM}{SS}{sequence}
 * Sequence is optional and ensures uniqueness when creating multiple records in quick succession
 */
const generateMitigationCode = (date: Date, sequence?: number): string => {
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  const hour = date.getHours().toString().padStart(2, '0');
  const minute = date.getMinutes().toString().padStart(2, '0');
  const second = date.getSeconds().toString().padStart(2, '0');
  const ms = date.getMilliseconds().toString().padStart(3, '0');
  const seq = sequence !== undefined ? sequence.toString().padStart(3, '0') : ms;
  return `RSK${year}${month}${day}${hour}${minute}${second}${seq}`;
};

// Likelihood levels: A (Unlikely), B (Less likely), C (Probably), D (Likely), E (Most likely) - same as risk-matrix.seed.ts
const LIKELIHOOD_LEVELS = ['A', 'B', 'C', 'D', 'E'] as const;
type LikelihoodLevel = (typeof LIKELIHOOD_LEVELS)[number];

// Consequence levels: 1-5 - same as risk-matrix.seed.ts
const CONSEQUENCE_LEVELS = [1, 2, 3, 4, 5] as const;

/** Letter to numeric value for score: A=1, B=2, C=3, D=4, E=5 */
const likelihoodLetterToValue = (letter: string): number => {
  const v = letter.charCodeAt(0) - 64; // A=1, B=2, ...
  return v >= 1 && v <= 5 ? v : 3;
};

/**
 * Calculate risk matrix rating (e.g. A1, B2) and interpretation from likelihood letter and consequence level.
 * Matches risk-matrix.seed.ts types: likelihoodLevel 'A'|'B'|'C'|'D'|'E', consequenceLevel 1-5.
 */
const calculateRiskRating = (
  likelihoodLevel: LikelihoodLevel,
  consequenceLevel: number,
): { rating: string; interpretation: RiskRatingEnum } => {
  const likelihoodValue = likelihoodLetterToValue(likelihoodLevel);
  const score = likelihoodValue * consequenceLevel;
  const rating = `${likelihoodLevel}${consequenceLevel}`;

  if (score <= 5) {
    return { rating, interpretation: RiskRatingEnum.LOW };
  } else if (score <= 10) {
    return { rating, interpretation: RiskRatingEnum.MEDIUM };
  } else if (score <= 15) {
    return { rating, interpretation: RiskRatingEnum.HIGH };
  } else {
    return { rating, interpretation: RiskRatingEnum.EXTREME };
  }
};

export const seedRiskAssessmentsAndInspections = async (
  prismaClient?: PrismaClient,
): Promise<void> => {
  const client = prismaClient || prisma;
  console.log('🌱 Seeding risk assessments and inspections...');

  // Global counter for unique mitigation codes across all records
  let mitigationCodeCounter = 0;

  try {
    // Get dependencies
    const adminUser = await client.user.findFirst({
      where: { email: 'admin@example.com' },
    });

    if (!adminUser) {
      console.log('⚠️  Admin user not found. Please run users seed first.');
      return;
    }

    // Only assign departments that are Academics or Administration
    const departments = await client.department.findMany({
      where: {
        isActive: true,
        name: { in: ['Academics', 'Administration'] },
      },
    });

    if (departments.length === 0) {
      console.log(
        '⚠️  No Academic or Administration departments found. Please run departments seed first.',
      );
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
      console.log('⚠️  No types of hazard found. Please run risk-categories seed first.');
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
    // Clear mitigation records before items (foreign key dependency)
    await client.riskMitigationRecord.deleteMany({
      where: {
        entity: { in: ['RISK_ASSESSMENT_ITEM', 'INSPECTION_ITEM'] },
      },
    });
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

        const likelihoodLevel: LikelihoodLevel =
          LIKELIHOOD_LEVELS[Math.floor(Math.random() * LIKELIHOOD_LEVELS.length)];
        const consequenceLevel =
          CONSEQUENCE_LEVELS[Math.floor(Math.random() * CONSEQUENCE_LEVELS.length)];

        const { rating: riskMatrixRating, interpretation } = calculateRiskRating(
          likelihoodLevel,
          consequenceLevel,
        );

        // Post-mitigation values (improved): one step down for likelihood letter and consequence level
        const likelihoodIndex = LIKELIHOOD_LEVELS.indexOf(likelihoodLevel);
        const postLikelihoodLevel: LikelihoodLevel =
          LIKELIHOOD_LEVELS[Math.max(0, likelihoodIndex - 1)];
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

        // Create risk mitigation record for this item (at least one field filled)
        const mitigationOptions = [
          {
            eliminate: `Eliminate risk by removing the hazard source: ${risk.name}`,
            transfer: null,
            reduce: null,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: `Transfer risk through insurance or outsourcing: ${risk.name}`,
            reduce: null,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: null,
            reduce: `Reduce risk through engineering controls and safety measures for ${risk.name}`,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: null,
            reduce: null,
            accept: `Accept residual risk after implementing controls for ${risk.name}`,
            legalAspect: null,
          },
          {
            eliminate: `Implement engineering controls to eliminate ${risk.name}`,
            transfer: null,
            reduce: `Apply administrative controls to reduce exposure`,
            accept: null,
            legalAspect: `Comply with local safety regulations and standards`,
          },
        ];
        const mitigation = mitigationOptions[j % mitigationOptions.length];

        await client.riskMitigationRecord.create({
          data: {
            code: generateMitigationCode(new Date(), mitigationCodeCounter++),
            entity: 'RISK_ASSESSMENT_ITEM',
            entityId: item.id,
            ...mitigation,
            isActive: true,
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
    // Note: Both inspections and inspection items use GeneralStatusEnum
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

        // Only OPEN or CLOSE status for inspection items
        const itemStatuses: GeneralStatusEnum[] = [
          GeneralStatusEnum.OPEN,
          GeneralStatusEnum.CLOSE,
        ];
        // If inspection is DONE, make most items CLOSE; if OPEN, mix OPEN and CLOSE
        const itemStatus =
          status === GeneralStatusEnum.DONE
            ? GeneralStatusEnum.CLOSE // All items CLOSE when inspection is DONE
            : itemStatuses[j % itemStatuses.length]; // Mix OPEN and CLOSE when inspection is OPEN

        const findings =
          j % 3 === 0
            ? `Finding ${j + 1}: Identified potential safety hazard that requires immediate attention.`
            : null;

        const description =
          j % 2 === 0
            ? `Inspection item ${j + 1} for ${area.name} - ${risk.name}`
            : null;

        const followUpNotes =
          itemStatus === GeneralStatusEnum.CLOSE
            ? `Follow-up completed on ${new Date().toLocaleDateString()}. All issues resolved.`
            : null;

        const dueDate = new Date(inspectionDate);
        dueDate.setDate(dueDate.getDate() + (7 + j * 2)); // Different due dates

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
          },
        });

        // Create risk mitigation record for this inspection item (at least one field filled)
        const mitigationOptions = [
          {
            eliminate: `Eliminate the identified hazard: ${findings || risk.name}`,
            transfer: null,
            reduce: null,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: `Transfer risk responsibility to external contractor for ${risk.name}`,
            reduce: null,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: null,
            reduce: `Reduce risk through immediate corrective actions: ${findings || 'Hazard mitigation'}`,
            accept: null,
            legalAspect: null,
          },
          {
            eliminate: null,
            transfer: null,
            reduce: null,
            accept: `Accept residual risk level after implementing safety controls for ${risk.name}`,
            legalAspect: null,
          },
          {
            eliminate: `Remove hazard source: ${risk.name}`,
            transfer: null,
            reduce: `Implement safety protocols to minimize exposure`,
            accept: null,
            legalAspect: `Ensure compliance with workplace safety regulations`,
          },
          {
            eliminate: null,
            transfer: `Outsource high-risk activities to specialized contractor`,
            reduce: `Apply PPE and training requirements`,
            accept: null,
            legalAspect: `Meet OSH standards and regulatory requirements`,
          },
        ];
        const mitigation = mitigationOptions[j % mitigationOptions.length];

        await client.riskMitigationRecord.create({
          data: {
            code: generateMitigationCode(new Date(), mitigationCodeCounter++),
            entity: 'INSPECTION_ITEM',
            entityId: item.id,
            ...mitigation,
            isActive: true,
          },
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

    // Count mitigation records
    const mitigationRecords = await client.riskMitigationRecord.findMany({
      where: {
        entity: { in: ['RISK_ASSESSMENT_ITEM', 'INSPECTION_ITEM'] },
      },
    });

    console.log('\n📋 Summary:');
    console.log(`   - Risk Assessments: ${riskAssessments.length}`);
    console.log(`   - Risk Assessment Items: ${totalRiskItems}`);
    console.log(`   - Inspections: ${inspections.length}`);
    console.log(`   - Inspection Items: ${totalInspectionItems}`);
    console.log(`   - Total Items: ${totalRiskItems + totalInspectionItems}`);
    console.log(`   - Risk Mitigation Records: ${mitigationRecords.length} (one per item)`);

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