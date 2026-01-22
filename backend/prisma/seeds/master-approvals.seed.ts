import { PrismaClient } from '@prisma/client';
import { APPROVAL_ENTITIES } from '../../src/shared/constants/approval-entities';
import { APPROVAL_FIELD_MARKERS } from '../../src/modules/approvals/constants/approval-field-markers';

export async function seedMasterApprovals(prisma: PrismaClient) {
  console.log('🌱 Seeding Master Approvals...');

  // Get required master data
  const departments = await prisma.department.findMany();
  const jobPositions = await prisma.jobPosition.findMany();
  const users = await prisma.user.findMany({ take: 1 });

  if (departments.length === 0 || jobPositions.length === 0 || users.length === 0) {
    console.log('⚠️  Missing required master data. Please seed departments, job positions, and users first.');
    return;
  }

  // Find specific departments and job positions for approval workflows
  const hseDepartment = departments.find((d) => d.code === 'HEALTH' || d.name.toLowerCase().includes('health'));
  const securityDepartment = departments.find((d) => d.code === 'SEC' || d.name.toLowerCase().includes('security'));
  const adminDepartment = departments.find((d) => d.code === 'ADMIN' || d.name.toLowerCase().includes('admin'));
  const academicDepartment = departments.find((d) => d.code === 'ACAD' || d.name.toLowerCase().includes('academic'));

  const managerPosition = jobPositions.find((j) => j.code === 'MANAGER');
  const directorPosition = jobPositions.find((j) => j.code === 'DIRECTOR');
  const headPosition = jobPositions.find((j) => j.code === 'HEAD');
  const leadPosition = jobPositions.find((j) => j.code === 'LEAD');

  // Fallback to first available if specific ones not found
  const dept1 = hseDepartment || departments[0]!;
  const dept2 = securityDepartment || departments[1] || departments[0]!;
  const academicDept =
    academicDepartment ||
    departments.find((d) => d.code === 'ACAD') ||
    departments[0]!;

  const pos1 = managerPosition || jobPositions.find((j) => j.level <= 5) || jobPositions[0]!;
  const pos2 =
    directorPosition ||
    jobPositions.find((j) => j.level <= 3) ||
    jobPositions[1] ||
    jobPositions[0]!;
  const leadPos =
    leadPosition ||
    jobPositions.find((j) => j.code === 'LEAD') ||
    jobPositions[0]!;

  const creator = users[0]!;

  // Clear existing master approvals (items first due to foreign key)
  await prisma.masterApprovalItem.deleteMany();
  await prisma.masterApproval.deleteMany();

  // 1. Risk Assessment Approval Workflow
  const riskAssessmentApproval = await prisma.masterApproval.create({
    data: {
      entity: APPROVAL_ENTITIES.RISK_ASSESSMENT,
      isActive: true,
    },
  });

  // Risk Assessment: 2-step approval (Dynamic → Lead in Academic Department)
  await prisma.masterApprovalItem.createMany({
    data: [
      {
        mApprovalId: riskAssessmentApproval.id,
        order: 0,
        jobPositionId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION,
        departmentId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT,
        createdBy: creator.id,
      },
      {
        mApprovalId: riskAssessmentApproval.id,
        order: 1,
        jobPositionId: leadPos.id,
        departmentId: academicDept.id,
        createdBy: creator.id,
      },
    ],
  });

  console.log(
    `✅ Created Risk Assessment approval workflow (Dynamic → Lead in Academic Department)`,
  );

  // 2. Work Permit Approval Workflow
  const workPermitApproval = await prisma.masterApproval.create({
    data: {
      entity: APPROVAL_ENTITIES.WORK_PERMIT,
      isActive: true,
    },
  });

  // Work Permit: 2-step approval (HSE Manager → Security Head)
  await prisma.masterApprovalItem.createMany({
    data: [
      {
        mApprovalId: workPermitApproval.id,
        order: 0,
        jobPositionId: pos1.id,
        departmentId: dept1.id, // HSE/Health Department
        createdBy: creator.id,
      },
      {
        mApprovalId: workPermitApproval.id,
        order: 1,
        jobPositionId: pos2.id,
        departmentId: dept2.id, // Security Department
        createdBy: creator.id,
      },
    ],
  });

  console.log(`✅ Created Work Permit approval workflow (2 steps)`);

  // 3. Inspection Item Approval Workflow
  const inspectionItemApproval = await prisma.masterApproval.create({
    data: {
      entity: APPROVAL_ENTITIES.INSPECTION_ITEM,
      isActive: true,
    },
  });

  // Inspection Item: 2-step approval (Dynamic → Lead in Academic Department)
  await prisma.masterApprovalItem.createMany({
    data: [
      {
        mApprovalId: inspectionItemApproval.id,
        order: 0,
        jobPositionId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION,
        departmentId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT,
        createdBy: creator.id,
      },
      {
        mApprovalId: inspectionItemApproval.id,
        order: 1,
        jobPositionId: leadPos.id,
        departmentId: academicDept.id,
        createdBy: creator.id,
      },
    ],
  });

  console.log(
    `✅ Created Inspection Item approval workflow (Dynamic → Lead in Academic Department)`,
  );

  // 4. Audit Item Approval Workflow
  const auditItemApproval = await prisma.masterApproval.create({
    data: {
      entity: APPROVAL_ENTITIES.AUDIT_ITEM,
      isActive: true,
    },
  });

  // Audit Item: 2-step approval (Dynamic → Lead in Academic Department)
  await prisma.masterApprovalItem.createMany({
    data: [
      {
        mApprovalId: auditItemApproval.id,
        order: 0,
        jobPositionId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_JOB_POSITION,
        departmentId: APPROVAL_FIELD_MARKERS.FROM_ENTITY_DEPARTMENT,
        createdBy: creator.id,
      },
      {
        mApprovalId: auditItemApproval.id,
        order: 1,
        jobPositionId: leadPos.id,
        departmentId: academicDept.id,
        createdBy: creator.id,
      },
    ],
  });

  console.log(
    `✅ Created Audit Item approval workflow (Dynamic → Lead in Academic Department)`,
  );

  console.log('✅ Master Approvals seeding completed');
  return {
    riskAssessmentApproval,
    workPermitApproval,
    inspectionItemApproval,
    auditItemApproval,
  };
}

