import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { copySafetyGuidanceFromTemplatesForSeed } from './work-permits.seed';

/** Ensure each approval-test permit has at least one classification and Section G snapshot/rows (Hot Work template). */
async function ensureWorkPermitApprovalTestSafetyGuidance(prisma: PrismaClient, code: string) {
  const wc = await prisma.workClassification.findFirst({ where: { code: 'HW' } });
  if (!wc) {
    console.log(`   ⚠️  Work classification HW not found; skip Section G seed for ${code}`);
    return;
  }
  const wp = await prisma.workPermit.findUnique({
    where: { code },
    include: { classifications: true },
  });
  if (!wp) return;
  if (wp.classifications.length === 0) {
    await prisma.workPermitClassification.create({
      data: {
        workPermitId: wp.id,
        workClassificationId: wc.id,
        order: 0,
      },
    });
  }
  await copySafetyGuidanceFromTemplatesForSeed(prisma, wp.id);
}

/**
 * Seeds test users and work permits for testing the complete approval flow
 * from DRAFT → IN_REVIEW_HSE → IN_REVIEW_SECURITY → APPROVED → CLOSED
 */
export async function seedWorkPermitApprovalTest(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Permit Approval Test Data...');

  // 1. Get or create required master data
  const departments = await prisma.department.findMany();
  const jobPositions = await prisma.jobPosition.findMany();
  const roles = await prisma.role.findMany();
  const offices = await prisma.office.findMany();

  if (departments.length === 0 || jobPositions.length === 0 || roles.length === 0 || offices.length === 0) {
    console.log('⚠️  Missing required master data. Please run base seeds first.');
    return;
  }

  // Find specific departments
  const hseDepartment = departments.find((d) => d.code === 'HEALTH') || departments[0];
  const securityDepartment = departments.find((d) => d.code === 'SEC') || departments[1] || departments[0];
  const adminDepartment = departments.find((d) => d.code === 'ADMIN') || departments[0];

  // Find specific job positions
  const managerPosition = jobPositions.find((j) => j.code === 'MANAGER');
  const headPosition = jobPositions.find((j) => j.code === 'HEAD');
  const staffPosition = jobPositions.find((j) => j.code === 'STAFF') || jobPositions[jobPositions.length - 1];

  // Find roles
  const userRole = roles.find((r) => r.name === 'User') || roles[0];
  const office = offices[0];

  const hashedPassword = await bcrypt.hash('password123', 10);

  // 2. Create Test Users for Approval Flow
  console.log('👥 Creating test users for approval flow...');

  // Requester User (Staff in Administration)
  const requester = await prisma.user.upsert({
    where: { email: 'wp.requester@test.com' },
    update: {},
    create: {
      email: 'wp.requester@test.com',
      password: hashedPassword,
      firstName: 'Work Permit',
      lastName: 'Requester',
      isActive: true,
      roleId: userRole.id,
      officeId: office.id,
      departmentId: adminDepartment.id,
      jobPositionId: staffPosition?.id,
    },
  });
  console.log(`   ✅ Created Requester: ${requester.email}`);

  // HSE Approver (Manager in Health Services - Step 1)
  const hseApprover = await prisma.user.upsert({
    where: { email: 'wp.hse.approver@test.com' },
    update: {
      departmentId: hseDepartment.id,
      jobPositionId: managerPosition?.id,
    },
    create: {
      email: 'wp.hse.approver@test.com',
      password: hashedPassword,
      firstName: 'HSE',
      lastName: 'Approver',
      isActive: true,
      roleId: userRole.id,
      officeId: office.id,
      departmentId: hseDepartment.id,
      jobPositionId: managerPosition?.id,
    },
  });
  console.log(`   ✅ Created HSE Approver: ${hseApprover.email} (Dept: ${hseDepartment.name}, Job: ${managerPosition?.name})`);

  // Security Approver (Head in Security - Step 2)
  const securityApprover = await prisma.user.upsert({
    where: { email: 'wp.security.approver@test.com' },
    update: {
      departmentId: securityDepartment.id,
      jobPositionId: headPosition?.id,
    },
    create: {
      email: 'wp.security.approver@test.com',
      password: hashedPassword,
      firstName: 'Security',
      lastName: 'Approver',
      isActive: true,
      roleId: userRole.id,
      officeId: office.id,
      departmentId: securityDepartment.id,
      jobPositionId: headPosition?.id,
    },
  });
  console.log(`   ✅ Created Security Approver: ${securityApprover.email} (Dept: ${securityDepartment.name}, Job: ${headPosition?.name})`);

  // Random User (should NOT have approval rights)
  const randomUser = await prisma.user.upsert({
    where: { email: 'wp.random.user@test.com' },
    update: {},
    create: {
      email: 'wp.random.user@test.com',
      password: hashedPassword,
      firstName: 'Random',
      lastName: 'User',
      isActive: true,
      roleId: userRole.id,
      officeId: office.id,
      departmentId: adminDepartment.id,
      jobPositionId: staffPosition?.id,
    },
  });
  console.log(`   ✅ Created Random User: ${randomUser.email} (No approval rights)`);

  // 3. Update Master Approval Configuration
  console.log('\n⚙️  Updating Master Approval for WORK_PERMIT...');

  let masterApproval = await prisma.masterApproval.findFirst({
    where: { entity: 'WORK_PERMIT' },
  });

  if (!masterApproval) {
    masterApproval = await prisma.masterApproval.create({
      data: {
        entity: 'WORK_PERMIT',
        isActive: true,
      },
    });
  }

  // Clear existing items and recreate
  await prisma.masterApprovalItem.deleteMany({
    where: { mApprovalId: masterApproval.id },
  });

  // Step 1: HSE Manager approval
  await prisma.masterApprovalItem.create({
    data: {
      mApprovalId: masterApproval.id,
      order: 1,
      departmentId: hseDepartment.id,
      jobPositionId: managerPosition!.id,
      createdBy: requester.id,
    },
  });

  // Step 2: Security Head approval
  await prisma.masterApprovalItem.create({
    data: {
      mApprovalId: masterApproval.id,
      order: 2,
      departmentId: securityDepartment.id,
      jobPositionId: headPosition!.id,
      createdBy: requester.id,
    },
  });

  console.log('   ✅ Master Approval configured:');
  console.log(`      Step 1: ${hseDepartment.name} - ${managerPosition?.name}`);
  console.log(`      Step 2: ${securityDepartment.name} - ${headPosition?.name}`);

  // 4. Get Work Permit Master Data and a User with role Guest (for workers)
  const area = await prisma.area.findFirst();
  const company = await prisma.company.findFirst();
  const guestRole = roles.find((r) => r.code === 'GUEST');
  let workerUser = guestRole
    ? await prisma.user.findFirst({ where: { roleId: guestRole.id } })
    : null;
  if (!workerUser && guestRole) {
    workerUser = await prisma.user.create({
      data: {
        email: 'wp.worker@test.com',
        password: hashedPassword,
        firstName: 'Work Permit',
        lastName: 'Worker',
        isActive: true,
        roleId: guestRole.id,
        officeId: office.id,
        departmentId: adminDepartment.id,
        jobPositionId: staffPosition?.id,
      },
    });
    console.log(`   ✅ Created worker user (Guest role): ${workerUser.email}`);
  }

  if (!area || !company || !workerUser) {
    console.log('⚠️  Missing work permit master data (Area/Company) or no user with Guest role. Please run work-permits.seed and ensure Guest role exists.');
    return;
  }

  const profession = await prisma.profession.findFirst();
  if (!profession) {
    console.log('⚠️  No profession in m_professions. Seed professions (e.g. work permit master seed) first.');
    return;
  }

  // 5. Create Test Work Permits in Various States
  console.log('\n📋 Creating test Work Permits...');

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  // WP-TEST-001: DRAFT (Ready to submit)
  const wpDraft = await prisma.workPermit.upsert({
    where: { code: 'WP-TEST-001' },
    update: { status: 'DRAFT' },
    create: {
      code: 'WP-TEST-001',
      projectName: 'Test Approval Flow - DRAFT',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: 'Test work stages for approval flow testing',
      jobSafetyAnalysis: 'Standard safety analysis for testing',
      status: 'DRAFT',
      createdBy: requester.id,
      workers: {
        create: [{
          userId: workerUser.id,
          professionId: profession.id,
          healthDeclarationUrl: 'https://test.com/health.pdf',
          order: 1,
        }],
      },
    },
  });
  console.log(`   ✅ Created ${wpDraft.code} (DRAFT) - Ready to submit`);

  // WP-TEST-002: IN_REVIEW_HSE (Waiting for HSE approval)
  const wpHseReview = await prisma.workPermit.upsert({
    where: { code: 'WP-TEST-002' },
    update: { status: 'IN_REVIEW_HSE' },
    create: {
      code: 'WP-TEST-002',
      projectName: 'Test Approval Flow - IN_REVIEW_HSE',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: 'Test work stages for HSE review',
      jobSafetyAnalysis: 'Standard safety analysis',
      status: 'IN_REVIEW_HSE',
      createdBy: requester.id,
      workers: {
        create: [{
          userId: workerUser.id,
          professionId: profession.id,
          healthDeclarationUrl: 'https://test.com/health.pdf',
          order: 1,
        }],
      },
    },
  });
  console.log(`   ✅ Created ${wpHseReview.code} (IN_REVIEW_HSE) - Waiting for HSE Approver`);

  // WP-TEST-003: IN_REVIEW_SECURITY (HSE approved, waiting for Security)
  const wpSecurityReview = await prisma.workPermit.upsert({
    where: { code: 'WP-TEST-003' },
    update: { status: 'IN_REVIEW_SECURITY' },
    create: {
      code: 'WP-TEST-003',
      projectName: 'Test Approval Flow - IN_REVIEW_SECURITY',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: 'Test work stages for Security review',
      jobSafetyAnalysis: 'Standard safety analysis',
      status: 'IN_REVIEW_SECURITY',
      createdBy: requester.id,
      workers: {
        create: [{
          userId: workerUser.id,
          professionId: profession.id,
          healthDeclarationUrl: 'https://test.com/health.pdf',
          order: 1,
        }],
      },
    },
  });

  // Add approval record from HSE (only if creating new)
  const existingApproval = await prisma.approval.findFirst({ where: { entityId: wpSecurityReview.id } });
  if (!existingApproval) {
    await prisma.approval.create({
      data: {
        mApprovalId: masterApproval.id,
        entityId: wpSecurityReview.id,
        departmentId: hseDepartment.id,
        jobPositionId: managerPosition!.id,
        status: 'APPROVED',
        notes: 'Approved by HSE for testing',
        createdBy: hseApprover.id,
      },
    });
  }
  console.log(`   ✅ Created ${wpSecurityReview.code} (IN_REVIEW_SECURITY) - Waiting for Security Approver`);

  // WP-TEST-004: APPROVED (Fully approved, can be closed)
  const wpApproved = await prisma.workPermit.upsert({
    where: { code: 'WP-TEST-004' },
    update: { status: 'APPROVED' },
    create: {
      code: 'WP-TEST-004',
      projectName: 'Test Approval Flow - APPROVED',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      proposedEndDate: nextWeek,
      workStagesDescription: 'Test work stages - approved',
      jobSafetyAnalysis: 'Standard safety analysis',
      status: 'APPROVED',
      createdBy: requester.id,
      workers: {
        create: [{
          userId: workerUser.id,
          professionId: profession.id,
          healthDeclarationUrl: 'https://test.com/health.pdf',
          order: 1,
        }],
      },
    },
  });

  // Add both approval records (only if not existing)
  const approvedRecords = await prisma.approval.count({ where: { entityId: wpApproved.id } });
  if (approvedRecords === 0) {
    await prisma.approval.createMany({
      data: [
        {
          mApprovalId: masterApproval.id,
          entityId: wpApproved.id,
          departmentId: hseDepartment.id,
          jobPositionId: managerPosition!.id,
          status: 'APPROVED',
          notes: 'HSE Approved',
          createdBy: hseApprover.id,
        },
        {
          mApprovalId: masterApproval.id,
          entityId: wpApproved.id,
          departmentId: securityDepartment.id,
          jobPositionId: headPosition!.id,
          status: 'APPROVED',
          notes: 'Security Approved',
          createdBy: securityApprover.id,
        },
      ],
    });
  }
  console.log(`   ✅ Created ${wpApproved.code} (APPROVED) - Ready to close`);

  // WP-TEST-005: CLOSED (Completed)
  const wpClosed = await prisma.workPermit.upsert({
    where: { code: 'WP-TEST-005' },
    update: { status: 'CLOSED' },
    create: {
      code: 'WP-TEST-005',
      projectName: 'Test Approval Flow - CLOSED',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      proposedEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      workStagesDescription: 'Test work stages - completed',
      jobSafetyAnalysis: 'Standard safety analysis',
      status: 'CLOSED',
      createdBy: requester.id,
      workers: {
        create: [{
          userId: workerUser.id,
          professionId: profession.id,
          healthDeclarationUrl: 'https://test.com/health.pdf',
          order: 1,
        }],
      },
    },
  });
  console.log(`   ✅ Created ${wpClosed.code} (CLOSED) - Completed`);

  for (const code of ['WP-TEST-001', 'WP-TEST-002', 'WP-TEST-003', 'WP-TEST-004', 'WP-TEST-005']) {
    await ensureWorkPermitApprovalTestSafetyGuidance(prisma, code);
  }
  console.log('   ✅ Section G (safety guideline) snapshots/rows applied for WP-TEST-* permits');

  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 SUMMARY - Test Data for Work Permit Approval Flow');
  console.log('='.repeat(60));
  console.log('\n👥 TEST USERS:');
  console.log('┌─────────────────────────────────┬──────────────────┬─────────────────┐');
  console.log('│ Email                           │ Role             │ Password        │');
  console.log('├─────────────────────────────────┼──────────────────┼─────────────────┤');
  console.log('│ wp.requester@test.com           │ Requester        │ password123     │');
  console.log('│ wp.hse.approver@test.com        │ HSE Approver     │ password123     │');
  console.log('│ wp.security.approver@test.com   │ Security Approver│ password123     │');
  console.log('│ wp.random.user@test.com         │ Random (No Right)│ password123     │');
  console.log('└─────────────────────────────────┴──────────────────┴─────────────────┘');

  console.log('\n📋 TEST WORK PERMITS:');
  console.log('┌──────────────┬─────────────────────┬──────────────────────────────────┐');
  console.log('│ Code         │ Status              │ Action to Test                   │');
  console.log('├──────────────┼─────────────────────┼──────────────────────────────────┤');
  console.log('│ WP-TEST-001  │ DRAFT               │ Submit → IN_REVIEW_HSE           │');
  console.log('│ WP-TEST-002  │ IN_REVIEW_HSE       │ HSE Approve → IN_REVIEW_SECURITY │');
  console.log('│ WP-TEST-003  │ IN_REVIEW_SECURITY  │ Security Approve → APPROVED      │');
  console.log('│ WP-TEST-004  │ APPROVED            │ Close → CLOSED                   │');
  console.log('│ WP-TEST-005  │ CLOSED              │ (View only - completed)          │');
  console.log('└──────────────┴─────────────────────┴──────────────────────────────────┘');

  console.log('\n✅ Work Permit Approval Test Data seeding completed!');

  return {
    users: { requester, hseApprover, securityApprover, randomUser },
    workPermits: { wpDraft, wpHseReview, wpSecurityReview, wpApproved, wpClosed },
    masterApproval,
  };
}
