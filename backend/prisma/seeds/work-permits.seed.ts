import type { User } from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { notDeleted } from './not-deleted';
import { seedWorkClassifications } from './work-classifications.seed';
import { seedPreProfessions } from './seed-pre.seed';

/** Mirrors WorkPermitsService.copySafetyGuidanceFromTemplates for seed data */
export async function copySafetyGuidanceFromTemplatesForSeed(prisma: PrismaClient, workPermitId: string) {
  const links = await prisma.workPermitClassification.findMany({
    where: { workPermitId },
    include: {
      workClassification: {
        include: {
          riskEquipmentRows: {
            orderBy: { order: 'asc' },
            include: { risk: true, safetyEquipment: true },
          },
        },
      },
    },
    orderBy: { order: 'asc' },
  });
  for (const link of links) {
    const snapshot = link.workClassification.safetyGuideline ?? null;
    await prisma.workPermitClassification.update({
      where: { id: link.id },
      data: { safetyGuidelineSnapshot: snapshot },
    });
    await prisma.workPermitClassificationSafetyGuidanceRow.deleteMany({
      where: { workPermitClassificationId: link.id },
    });
    for (const r of link.workClassification.riskEquipmentRows) {
      await prisma.workPermitClassificationSafetyGuidanceRow.create({
        data: {
          workPermitClassificationId: link.id,
          riskId: r.riskId,
          safetyEquipmentId: r.safetyEquipmentId,
          notes: r.notes ?? null,
          order: r.order,
          riskNameSnapshot: r.risk.name,
          safetyEquipmentNameSnapshot: r.safetyEquipment.name,
        },
      });
    }
  }
}

async function seedApprovalRecordsForPermit(
  prisma: PrismaClient,
  workPermitId: string,
  stepsToApprove: number[],
  createdBy: string,
) {
  const masterApproval = await prisma.masterApproval.findFirst({
    where: { entity: 'WORK_PERMIT', isActive: true },
    include: { items: { orderBy: { order: 'asc' } } },
  });
  if (!masterApproval) return;

  for (const stepOrder of stepsToApprove) {
    const item = masterApproval.items.find((i) => i.order === stepOrder);
    if (!item) continue;

    const existing = await prisma.approval.findFirst({
      where: {
        mApprovalId: masterApproval.id,
        entityId: workPermitId,
        departmentId: item.departmentId,
        jobPositionId: item.jobPositionId,
        status: 'APPROVED',
      },
    });
    if (existing) continue;

    await prisma.approval.create({
      data: {
        mApprovalId: masterApproval.id,
        entityId: workPermitId,
        departmentId: item.departmentId,
        jobPositionId: item.jobPositionId,
        status: 'APPROVED',
        notes: 'Seeded approval',
        createdBy,
      },
    });
  }
}

export async function seedWorkPermitMasters(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Permit master data...');

  await seedWorkClassifications(prisma);

  // Seed Heavy Equipment
  const heavyEquipment = [
    { name: 'Excavator', code: 'EXC-001', description: 'Heavy digging equipment' },
    { name: 'Crane', code: 'CRANE-001', description: 'Lifting equipment' },
    { name: 'Forklift', code: 'FL-001', description: 'Material handling equipment' },
    { name: 'Bulldozer', code: 'BD-001', description: 'Earth moving equipment' },
    { name: 'Concrete Mixer', code: 'CM-001', description: 'Concrete mixing equipment' },
  ];

  const heavyEquipmentCreatedBy = await prisma.user.findFirst();
  if (!heavyEquipmentCreatedBy) {
    console.log('⚠️ No users found. Skipping Heavy Equipment seed (createdBy required).');
  } else {
    for (const equipment of heavyEquipment) {
      const existing = await prisma.heavyEquipment.findFirst({
        where: { code: equipment.code, ...notDeleted },
      });
      if (existing) {
        await prisma.heavyEquipment.update({
          where: { id: existing.id },
          data: {
            name: equipment.name,
            description: equipment.description,
          },
        });
      } else {
        await prisma.heavyEquipment.create({
          data: {
            name: equipment.name,
            code: equipment.code,
            description: equipment.description,
            createdBy: heavyEquipmentCreatedBy.id,
          },
        });
      }
    }
    console.log(`✅ Created ${heavyEquipment.length} heavy equipment`);
  }

  // Seed Tools
  const tools = [
    { name: 'Drill Machine', code: 'DRILL-001', description: 'Electric drill' },
    { name: 'Welding Machine', code: 'WELD-001', description: 'Arc welding equipment' },
    { name: 'Grinder', code: 'GRIND-001', description: 'Angle grinder' },
    { name: 'Hammer', code: 'HAMMER-001', description: 'Hand hammer' },
    { name: 'Screwdriver Set', code: 'SCREW-001', description: 'Various screwdrivers' },
  ];

  for (const tool of tools) {
    const existing = await prisma.tool.findFirst({
      where: { code: tool.code, ...notDeleted },
    });
    if (existing) {
      await prisma.tool.update({ where: { id: existing.id }, data: tool });
    } else {
      await prisma.tool.create({ data: tool });
    }
  }
  console.log(`✅ Created ${tools.length} tools`);

  // Seed Materials
  const materials = [
    { name: 'Steel Plate', code: 'STEEL-001', description: 'Steel construction material' },
    { name: 'Concrete', code: 'CONC-001', description: 'Ready mix concrete' },
    { name: 'Cement', code: 'CEMENT-001', description: 'Portland cement' },
    { name: 'Paint', code: 'PAINT-001', description: 'Industrial paint' },
    { name: 'Electrical Wire', code: 'WIRE-001', description: 'Electrical wiring' },
  ];

  for (const material of materials) {
    const existing = await prisma.material.findFirst({
      where: { code: material.code, ...notDeleted },
    });
    if (existing) {
      await prisma.material.update({ where: { id: existing.id }, data: material });
    } else {
      await prisma.material.create({ data: material });
    }
  }
  console.log(`✅ Created ${materials.length} materials`);

  // Seed Machines
  const machines = [
    { name: 'Generator', code: 'GEN-001', description: 'Portable generator' },
    { name: 'Compressor', code: 'COMP-001', description: 'Air compressor' },
    { name: 'Water Pump', code: 'PUMP-001', description: 'Water pumping machine' },
    { name: 'Cutting Machine', code: 'CUT-001', description: 'Metal cutting machine' },
  ];

  for (const machine of machines) {
    const existing = await prisma.machine.findFirst({
      where: { code: machine.code, ...notDeleted },
    });
    if (existing) {
      await prisma.machine.update({ where: { id: existing.id }, data: machine });
    } else {
      await prisma.machine.create({ data: machine });
    }
  }
  console.log(`✅ Created ${machines.length} machines`);

  // Seed Companies
  const companies = [
    {
      name: 'PT Konstruksi Jaya',
      code: 'KJ-001',
      address: 'Jl. Raya Industri No. 123, Jakarta',
      contactPerson: 'Budi Santoso',
      phone: '+62-21-12345678',
      email: 'contact@konstruksijaya.com',
    },
    {
      name: 'CV Teknik Mandiri',
      code: 'TM-001',
      address: 'Jl. Teknik No. 456, Bandung',
      contactPerson: 'Siti Nurhaliza',
      phone: '+62-22-87654321',
      email: 'info@teknikmandiri.com',
    },
    {
      name: 'PT Bangun Sejahtera',
      code: 'BS-001',
      address: 'Jl. Pembangunan No. 789, Surabaya',
      contactPerson: 'Ahmad Fauzi',
      phone: '+62-31-11223344',
      email: 'admin@bangunsejahtera.com',
    },
    {
      name: 'PT Mitra Perkasa',
      code: 'MP-001',
      address: 'Jl. Industri Raya No. 200, Bekasi',
      contactPerson: 'Rina Wijaya',
      phone: '+62-21-99887766',
      email: 'hq@mitraperksa.com',
    },
    {
      name: 'UD Sentosa Jaya',
      code: 'SJ-001',
      address: 'Jl. Niaga No. 45, Tangerang',
      contactPerson: 'Eko Prasetyo',
      phone: '+62-21-55443322',
      email: 'office@sentosajaya.com',
    },
  ];

  for (const company of companies) {
    const existing = await prisma.company.findFirst({
      where: { code: company.code, ...notDeleted },
    });
    if (existing) {
      await prisma.company.update({ where: { id: existing.id }, data: company });
    } else {
      await prisma.company.create({ data: company });
    }
  }
  console.log(`✅ Created ${companies.length} companies`);

  await seedPreProfessions(prisma);

  // Seed Areas (need to get office first)
  const offices = await prisma.office.findMany({ take: 1 });
  const officeId = offices.length > 0 ? offices[0].id : null;

  const areas = [
    { name: 'Building A', code: 'BLD-A', description: 'Main building A', officeId },
    { name: 'Building B', code: 'BLD-B', description: 'Main building B', officeId },
    { name: 'Warehouse', code: 'WH-001', description: 'Storage warehouse', officeId },
    { name: 'Parking Area', code: 'PARK-001', description: 'Parking lot area', officeId },
    { name: 'Outdoor Area', code: 'OUT-001', description: 'Outdoor construction area', officeId },
  ];

  for (const area of areas) {
    const existing = await prisma.area.findFirst({
      where: { code: area.code, ...notDeleted },
    });
    if (existing) {
      await prisma.area.update({ where: { id: existing.id }, data: area });
    } else {
      await prisma.area.create({ data: area });
    }
  }
  console.log(`✅ Created ${areas.length} areas`);

  return {
    workClassifications: await prisma.workClassification.findMany(),
    heavyEquipment: await prisma.heavyEquipment.findMany(),
    tools: await prisma.tool.findMany(),
    materials: await prisma.material.findMany(),
    machines: await prisma.machine.findMany(),
    companies: await prisma.company.findMany(),
    professions: await prisma.profession.findMany(),
    areas: await prisma.area.findMany(),
  };
}

export async function seedGuests(prisma: PrismaClient) {
  console.log('🌱 Seeding Guests (workers and supervisors)...');

  const guests = [
    {
      name: 'John Doe',
      email: 'john.doe@contractor.com',
      phone: '+62-812-3456-7890',
      photoUrl: null,
    },
    {
      name: 'Jane Smith',
      email: 'jane.smith@contractor.com',
      phone: '+62-812-3456-7891',
      photoUrl: null,
    },
    {
      name: 'Ahmad Rahman',
      email: 'ahmad.rahman@contractor.com',
      phone: '+62-812-3456-7892',
      photoUrl: null,
    },
    {
      name: 'Siti Nurhaliza',
      email: 'siti.nurhaliza@contractor.com',
      phone: '+62-812-3456-7893',
      photoUrl: null,
    },
    {
      name: 'Budi Santoso',
      email: 'budi.santoso@contractor.com',
      phone: '+62-812-3456-7894',
      photoUrl: null,
    },
    {
      name: 'Supervisor A',
      email: 'supervisor.a@contractor.com',
      phone: '+62-812-3456-7895',
      photoUrl: null,
    },
    {
      name: 'Supervisor B',
      email: 'supervisor.b@contractor.com',
      phone: '+62-812-3456-7896',
      photoUrl: null,
    },
  ];

  const createdGuests: Array<{
    id: string;
    name: string;
    email: string | null;
    phone: string | null;
    photoUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
  }> = [];
  for (const guest of guests) {
    let created = await prisma.guest.findFirst({
      where: { email: guest.email },
    });
    if (!created) {
      created = await prisma.guest.create({
        data: guest,
      });
    }
    createdGuests.push(created);
  }

  console.log(`✅ Created ${createdGuests.length} guests`);
  return createdGuests;
}

export async function seedWorkPermits(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Permits...');

  // Get master data
  const masters = await seedWorkPermitMasters(prisma);
  const guests = await seedGuests(prisma);

  // Get users for creator and HSE officers
  const users = await prisma.user.findMany({ take: 3 });
  if (users.length === 0) {
    console.log('⚠️ No users found. Please seed users first.');
    return;
  }

  const creator = users[0];
  const hseOfficer = users[1] || users[0];
  const projectUser = users[2] || users[0];

  // Get first company and area
  if (
    masters.companies.length === 0 ||
    masters.areas.length === 0 ||
    masters.workClassifications.length === 0 ||
    masters.heavyEquipment.length === 0 ||
    masters.tools.length === 0 ||
    masters.materials.length === 0 ||
    masters.machines.length === 0 ||
    masters.professions.length === 0
  ) {
    console.log('⚠️ Master data incomplete. Please ensure all master data is seeded.');
    return;
  }

  const company = masters.companies[0]!;
  const area = masters.areas[0]!;
  const workClassification = masters.workClassifications[0]!;
  const heavyEquip = masters.heavyEquipment[0]!;
  const tool = masters.tools[0]!;
  const material = masters.materials[0]!;
  const machine = masters.machines[0]!;
  const profession = masters.professions[0]!;
  const professionAlt = masters.professions.length > 1 ? masters.professions[1]! : profession;
  if (guests.length < 6) {
    console.log('⚠️ Not enough guests. Please ensure at least 6 guests are seeded.');
    return;
  }

  const supervisor = guests[5];
  if (!supervisor) {
    console.log('⚠️ Failed to get required guests for supervisor.');
    return;
  }

  // Work-permit demo workers: CONTRACTOR role, each tied to a company (spread across seeded companies)
  const contractorRole = await prisma.role.findFirst({ where: { code: 'CONTRACTOR' } });
  if (!contractorRole) {
    console.log('⚠️ CONTRACTOR role not found. Please run roles seed first.');
    return;
  }
  const officeId = creator.officeId;
  const companiesForWorkers = masters.companies;
  const workerUsers: User[] = [];
  for (let i = 1; i <= 5; i++) {
    const companyForWorker = companiesForWorkers[(i - 1) % companiesForWorkers.length]!;
    const email = `wp.worker${i}@seed.test`;
    const existingU = await prisma.user.findFirst({
      where: { email, ...notDeleted },
    });
    const u = existingU
      ? await prisma.user.update({
          where: { id: existingU.id },
          data: {
            roleId: contractorRole.id,
            companyId: companyForWorker.id,
            officeId,
          },
        })
      : await prisma.user.create({
          data: {
            email,
            firstName: `Worker`,
            lastName: `${i}`,
            isActive: true,
            roleId: contractorRole.id,
            officeId,
            companyId: companyForWorker.id,
          },
        });
    workerUsers.push(u);
  }
  const worker1 = workerUsers[0]!;
  const worker2 = workerUsers[1]!;
  const worker3 = workerUsers[2]!;
  const worker4 = workerUsers[3]!;
  const worker5 = workerUsers[4]!;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: worker1.id },
      data: { professionId: profession.id, idNumber: 'ID123456789' },
    }),
    prisma.user.update({
      where: { id: worker2.id },
      data: { professionId: professionAlt.id, idNumber: 'ID987654321' },
    }),
    prisma.user.update({
      where: { id: worker3.id },
      data: { professionId: profession.id, idNumber: 'ID111222333' },
    }),
    prisma.user.update({
      where: { id: worker4.id },
      data: { professionId: profession.id, idNumber: 'ID444555666' },
    }),
    prisma.user.update({
      where: { id: worker5.id },
      data: { professionId: profession.id, idNumber: 'ID777888999' },
    }),
  ]);

  const wk1 = await prisma.worker.upsert({
    where: { userId: worker1.id },
    create: {
      userId: worker1.id,
      healthDeclarationUrl: 'https://example.com/health-declaration-1.pdf',
    },
    update: {},
  });
  const wk2 = await prisma.worker.upsert({
    where: { userId: worker2.id },
    create: {
      userId: worker2.id,
      healthDeclarationUrl: 'https://example.com/health-declaration-2.pdf',
    },
    update: {},
  });
  const wk3 = await prisma.worker.upsert({
    where: { userId: worker3.id },
    create: {
      userId: worker3.id,
      healthDeclarationUrl: 'https://example.com/health-declaration-3.pdf',
    },
    update: {},
  });
  const wk4 = await prisma.worker.upsert({
    where: { userId: worker4.id },
    create: {
      userId: worker4.id,
      healthDeclarationUrl: 'https://example.com/health-declaration-4.pdf',
    },
    update: {},
  });
  const wk5 = await prisma.worker.upsert({
    where: { userId: worker5.id },
    create: {
      userId: worker5.id,
      healthDeclarationUrl: 'https://example.com/health-declaration-5.pdf',
    },
    update: {},
  });

  // Helper function to generate work permit code
  const generateCode = (year: number, sequence: number) => {
    return `WP-${year}-${String(sequence).padStart(4, '0')}`;
  };

  const currentYear = new Date().getFullYear();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(now);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  const requiredCourse = await prisma.course.findFirst({
    where: { isActive: true },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, slug: true },
  });
  if (!requiredCourse) {
    console.log('⚠️ No active courses found. Course-required work permit will be created without requiredCourses.');
  }

  const applicant = worker1;
  const baseData = {
    areaId: area.id,
    companyId: company.id,
    proposedStartDate: tomorrow,
    proposedEndDate: nextWeek,
    workStagesDescription:
      '1. Site preparation\n2. Execution\n3. Inspection\n4. Cleanup',
    jobSafetyAnalysis:
      'Risk: Injury, equipment hazards\nControl: PPE, toolbox meeting, supervisor monitoring',
    workRequirements:
      'All workers must follow site induction and safety rules',
    createdBy: creator.id,
    applicantUserId: applicant.id,
    classifications: {
      create: [
        {
          workClassificationId: workClassification.id,
          order: 0,
        },
      ],
    },
    employees: {
      create: [
        {
          userId: projectUser.id,
          order: 0,
        },
      ],
    },
    workers: {
      create: [
        { workerId: wk1.id, order: 0 },
        { workerId: wk2.id, order: 1 },
      ],
    },
    heavyEquipment: {
      create: [{ heavyEquipmentId: heavyEquip.id, quantity: 1, order: 0 }],
    },
    tools: {
      create: [{ toolId: tool.id, quantity: 2, order: 0 }],
    },
    materials: {
      create: [{ materialId: material.id, quantity: 10, order: 0 }],
    },
    machines: {
      create: [{ machineId: machine.id, quantity: 1, order: 0 }],
    },
    hazards: {
      create: [
        {
          hazardName: 'Slip/Trip',
          activity: 'Walking/working around tools and cables',
          mitigation: 'Housekeeping, cord management, signage',
          order: 0,
        },
      ],
    },
    supervisors: { create: [{ guestId: supervisor.id }] },
    hseOfficers: { create: [{ userId: hseOfficer.id }] },
  } satisfies Record<string, any>;

  async function createPermit(
    sequence: number,
    status: string,
    overrides: Record<string, any> = {},
    copyGuidance: boolean = true,
  ) {
    const wp = await prisma.workPermit.create({
      data: {
        ...baseData,
        code: generateCode(currentYear, sequence),
        projectName: `Seed Work Permit (${status})`,
        requireCourseVerification: false,
        status,
        ...overrides,
      },
    });
    if (copyGuidance) {
      await copySafetyGuidanceFromTemplatesForSeed(prisma, wp.id);
    }
    console.log(`✅ Created work permit: ${wp.code} (${status})`);
    return wp;
  }

  const permits: any[] = [];

  // One-per-status matrix
  permits.push(
    await createPermit(1, 'DRAFT', {
      projectName: 'Applicant fill (editable) — DRAFT',
      requireCourseVerification: true,
    }),
  );

  permits.push(
    await createPermit(2, 'OPEN', {
      projectName: 'OPEN (generic in-review fallback)',
      proposedStartDate: nextWeek,
      proposedEndDate: nextMonth,
    }),
  );

  permits.push(
    await createPermit(3, 'WAITING_APPROVAL', {
      projectName: 'WAITING_APPROVAL (approval queue)',
      proposedStartDate: nextWeek,
      proposedEndDate: nextMonth,
      workStagesDescription: 'Waiting for approval chain to proceed.',
    }),
  );

  permits.push(
    await createPermit(4, 'IN_REVIEW_PROJECT_OWNER', {
      projectName: 'IN_REVIEW_PROJECT_OWNER (approval step)',
      proposedStartDate: nextWeek,
      proposedEndDate: nextMonth,
    }),
  );

  const permit5 = await createPermit(5, 'IN_REVIEW_HSE', {
    projectName: 'IN_REVIEW_HSE (HSE review step)',
    requireCourseVerification: false,
    classifications: {
      create: [
        {
          workClassificationId:
            masters.workClassifications.length > 1
              ? masters.workClassifications[1]!.id
              : workClassification.id,
          order: 0,
        },
      ],
    },
    workers: { create: [{ workerId: wk3.id, order: 0 }] },
  });
  await seedApprovalRecordsForPermit(prisma, permit5.id, [0], creator.id);
  permits.push(permit5);

  // Applicant sign phase (with course requirement)
  const permit6 = await createPermit(6, 'WAITING_APPLICANT_SIGN', {
    projectName: 'Applicant sign SK — WITH course requirement',
    requireCourseVerification: true,
    requiredCourses: requiredCourse
      ? {
        create: [
          {
            courseId: requiredCourse.id,
            isRequired: true,
            order: 0,
          },
        ],
      }
      : undefined,
  });
  await seedApprovalRecordsForPermit(prisma, permit6.id, [0, 1], creator.id);
  permits.push(permit6);

  // Applicant sign phase (without course requirement)
  const permit7 = await createPermit(7, 'WAITING_APPLICANT_SIGN', {
    projectName: 'Applicant sign SK — WITHOUT course requirement',
    requireCourseVerification: false,
  });
  await seedApprovalRecordsForPermit(prisma, permit7.id, [0, 1], creator.id);
  permits.push(permit7);

  // After signing SK, permit moves to IN_REVIEW_SECURITY and has applicantSignedAt/signature.
  const permit8 = await createPermit(8, 'IN_REVIEW_SECURITY', {
    projectName: 'IN_REVIEW_SECURITY (post applicant-sign)',
    applicantSignedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
    applicantSignature: 'seed-signature-token',
    requireCourseVerification: true,
    requiredCourses: requiredCourse
      ? {
        create: [
          {
            courseId: requiredCourse.id,
            isRequired: true,
            order: 0,
          },
        ],
      }
      : undefined,
  });
  await seedApprovalRecordsForPermit(prisma, permit8.id, [0, 1], creator.id);
  permits.push(permit8);

  const permit9 = await createPermit(9, 'APPROVED', {
    projectName: 'APPROVED (ready for work / can extend)',
    proposedStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
    proposedEndDate: nextWeek,
    requireCourseVerification: true,
    requiredCourses: requiredCourse
      ? {
        create: [
          {
            courseId: requiredCourse.id,
            isRequired: true,
            order: 0,
          },
        ],
      }
      : undefined,
  });
  await seedApprovalRecordsForPermit(prisma, permit9.id, [0, 1, 2], creator.id);
  permits.push(permit9);

  permits.push(
    await createPermit(10, 'REJECTED', {
      projectName: 'REJECTED (approval denied)',
      jobSafetyAnalysis:
        'Rejected example: missing required attachments and incomplete hazard controls.',
      requireCourseVerification: false,
    }),
  );

  const permit11 = await createPermit(
    11,
    'CLOSED',
    {
      projectName: 'CLOSED (completed work)',
      proposedStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000),
      proposedEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      requireCourseVerification: false,
    },
    false,
  );
  await seedApprovalRecordsForPermit(prisma, permit11.id, [0, 1, 2], creator.id);
  permits.push(permit11);

  const permit12 = await createPermit(12, 'EXTENDED', {
    projectName: 'EXTENDED (end date extended)',
    proposedStartDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
    proposedEndDate: new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000),
    requireCourseVerification: false,
  });
  await seedApprovalRecordsForPermit(prisma, permit12.id, [0, 1, 2], creator.id);
  permits.push(permit12);

  console.log('✅ Work permit seeding completed');
  return {
    workPermits: permits,
    masters,
    guests,
  };
}

export async function seedWorkPermitsData(prisma: PrismaClient) {
  await seedWorkPermits(prisma);
}
