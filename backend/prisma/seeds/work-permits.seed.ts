import { PrismaClient } from '@prisma/client';

export async function seedWorkPermitMasters(prisma: PrismaClient) {
  console.log('🌱 Seeding Work Permit master data...');

  // Seed Work Classifications
  const workClassifications = [
    { name: 'Hot Work', code: 'HW', description: 'Welding, cutting, grinding operations' },
    { name: 'Electrical Work', code: 'ELEC', description: 'Electrical installation and maintenance' },
    { name: 'Confined Space', code: 'CS', description: 'Work in confined spaces' },
    { name: 'Height Work', code: 'HEIGHT', description: 'Work at height above 1.5 meters' },
    { name: 'Excavation', code: 'EXC', description: 'Digging and excavation work' },
    { name: 'Plumbing', code: 'PLUMB', description: 'Plumbing installation and repair' },
    { name: 'Painting', code: 'PAINT', description: 'Painting and coating work' },
    { name: 'General Maintenance', code: 'MAINT', description: 'General maintenance work' },
  ];

  for (const classification of workClassifications) {
    await prisma.workClassification.upsert({
      where: { code: classification.code },
      update: classification,
      create: classification,
    });
  }
  console.log(`✅ Created ${workClassifications.length} work classifications`);

  // Seed Heavy Equipment
  const heavyEquipment = [
    { name: 'Excavator', code: 'EXC-001', description: 'Heavy digging equipment' },
    { name: 'Crane', code: 'CRANE-001', description: 'Lifting equipment' },
    { name: 'Forklift', code: 'FL-001', description: 'Material handling equipment' },
    { name: 'Bulldozer', code: 'BD-001', description: 'Earth moving equipment' },
    { name: 'Concrete Mixer', code: 'CM-001', description: 'Concrete mixing equipment' },
  ];

  for (const equipment of heavyEquipment) {
    await prisma.heavyEquipment.upsert({
      where: { code: equipment.code },
      update: equipment,
      create: equipment,
    });
  }
  console.log(`✅ Created ${heavyEquipment.length} heavy equipment`);

  // Seed Tools
  const tools = [
    { name: 'Drill Machine', code: 'DRILL-001', description: 'Electric drill' },
    { name: 'Welding Machine', code: 'WELD-001', description: 'Arc welding equipment' },
    { name: 'Grinder', code: 'GRIND-001', description: 'Angle grinder' },
    { name: 'Hammer', code: 'HAMMER-001', description: 'Hand hammer' },
    { name: 'Screwdriver Set', code: 'SCREW-001', description: 'Various screwdrivers' },
  ];

  for (const tool of tools) {
    await prisma.tool.upsert({
      where: { code: tool.code },
      update: tool,
      create: tool,
    });
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
    await prisma.material.upsert({
      where: { code: material.code },
      update: material,
      create: material,
    });
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
    await prisma.machine.upsert({
      where: { code: machine.code },
      update: machine,
      create: machine,
    });
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
  ];

  for (const company of companies) {
    await prisma.company.upsert({
      where: { code: company.code },
      update: company,
      create: company,
    });
  }
  console.log(`✅ Created ${companies.length} companies`);

  // Seed Professions
  const professions = [
    { name: 'Welder', code: 'WELDER', description: 'Welding specialist' },
    { name: 'Electrician', code: 'ELEC-TECH', description: 'Electrical technician' },
    { name: 'Plumber', code: 'PLUMBER', description: 'Plumbing specialist' },
    { name: 'Crane Operator', code: 'CRANE-OP', description: 'Crane operation specialist' },
    { name: 'Safety Officer', code: 'SAFETY', description: 'Safety and health officer' },
    { name: 'Supervisor', code: 'SUPER', description: 'Work supervisor' },
  ];

  for (const profession of professions) {
    await prisma.profession.upsert({
      where: { code: profession.code },
      update: profession,
      create: profession,
    });
  }
  console.log(`✅ Created ${professions.length} professions`);

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
    await prisma.area.upsert({
      where: { code: area.code },
      update: area,
      create: area,
    });
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
  if (guests.length < 6) {
    console.log('⚠️ Not enough guests. Please ensure at least 6 guests are seeded.');
    return;
  }

  const supervisor = guests[5];
  if (!supervisor) {
    console.log('⚠️ Failed to get required guests for supervisor.');
    return;
  }

  // Workers are now Users with role Guest (not t_guests)
  const guestRole = await prisma.role.findFirst({ where: { code: 'GUEST' } });
  if (!guestRole) {
    console.log('⚠️ Guest role not found. Please run roles seed first.');
    return;
  }
  let workerUsers = await prisma.user.findMany({
    where: { roleId: guestRole.id },
    take: 5,
  });
  const officeId = creator.officeId;
  while (workerUsers.length < 5) {
    const i = workerUsers.length + 1;
    const u = await prisma.user.upsert({
      where: { email: `wp.worker${i}@seed.test` },
      update: {},
      create: {
        email: `wp.worker${i}@seed.test`,
        firstName: `Worker`,
        lastName: `${i}`,
        isActive: true,
        roleId: guestRole.id,
        officeId,
      },
    });
    workerUsers = [...workerUsers, u];
  }
  const worker1 = workerUsers[0]!;
  const worker2 = workerUsers[1]!;
  const worker3 = workerUsers[2]!;
  const worker4 = workerUsers[3]!;
  const worker5 = workerUsers[4]!;

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

  // Sample Work Permit 1: DRAFT
  const wp1 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 1),
      projectName: 'Maintenance Building A - Electrical System',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: '1. Site preparation\n2. Electrical installation\n3. Testing and commissioning\n4. Cleanup',
      jobSafetyAnalysis: 'Risk: Electrical shock\nControl: Use proper PPE, lockout/tagout procedures, qualified electrician only',
      workRequirements: 'All workers must have electrical safety training certificate',
      safetyGuideline: 'Follow electrical safety standards and procedures',
      requireCourseVerification: true,
      status: 'DRAFT',
      createdBy: creator.id,
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
          {
            userId: worker1.id,
            idNumber: 'ID123456789',
            healthDeclarationUrl: 'https://example.com/health-declaration-1.pdf',
            order: 0,
          },
          {
            userId: worker2.id,
            idNumber: 'ID987654321',
            healthDeclarationUrl: 'https://example.com/health-declaration-2.pdf',
            order: 1,
          },
        ],
      },
      heavyEquipment: {
        create: [
          {
            heavyEquipmentId: heavyEquip.id,
            quantity: 1,
            order: 0,
          },
        ],
      },
      tools: {
        create: [
          {
            toolId: tool.id,
            quantity: 2,
            order: 0,
          },
        ],
      },
      materials: {
        create: [
          {
            materialId: material.id,
            quantity: 10,
            order: 0,
          },
        ],
      },
      machines: {
        create: [
          {
            machineId: machine.id,
            quantity: 1,
            order: 0,
          },
        ],
      },
      professions: {
        create: [
          {
            professionId: profession.id,
            quantity: 2,
            order: 0,
          },
        ],
      },
      hazards: {
        create: [
          {
            hazardName: 'Electrical Shock',
            description: 'Risk of electric shock during installation',
            controlMeasure: 'Use insulated tools, proper grounding, lockout/tagout',
            order: 0,
          },
          {
            hazardName: 'Falling Objects',
            description: 'Risk of tools or materials falling',
            controlMeasure: 'Secure tools, use tool lanyards, barricade work area',
            order: 1,
          },
        ],
      },
      supervisors: {
        create: [
          {
            guestId: supervisor.id,
          },
        ],
      },
      hseOfficers: {
        create: [
          {
            userId: hseOfficer.id,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp1.code} (DRAFT)`);

  // Sample Work Permit 2: WAITING_APPROVAL
  const wp2 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 2),
      projectName: 'Renovation Building B - Plumbing System',
      areaId: masters.areas.length > 1 ? masters.areas[1]!.id : area.id,
      companyId: masters.companies.length > 1 ? masters.companies[1]!.id : company.id,
      proposedStartDate: nextWeek,
      proposedEndDate: nextMonth,
      workStagesDescription: '1. Remove old pipes\n2. Install new plumbing\n3. Pressure testing\n4. Final inspection',
      jobSafetyAnalysis: 'Risk: Water damage, confined space\nControl: Proper drainage, ventilation, confined space permit',
      workRequirements: 'Plumber certification required',
      safetyGuideline: 'Follow plumbing safety standards',
      requireCourseVerification: false,
      status: 'IN_REVIEW_HSE',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId:
              masters.workClassifications.length > 1 ? masters.workClassifications[1]!.id : workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker3.id,
            idNumber: 'ID111222333',
            healthDeclarationUrl: 'https://example.com/health-declaration-3.pdf',
            order: 0,
          },
        ],
      },
      hazards: {
        create: [
          {
            hazardName: 'Confined Space',
            description: 'Working in tight spaces',
            controlMeasure: 'Proper ventilation, entry permit, safety monitoring',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp2.code} (IN_REVIEW_HSE)`);

  // Sample Work Permit 3: APPROVED
  const wp3 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 3),
      projectName: 'Painting Warehouse Exterior',
      areaId: masters.areas.length > 2 ? masters.areas[2]!.id : area.id,
      companyId: masters.companies[0].id,
      proposedStartDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      proposedEndDate: nextWeek,
      workStagesDescription: '1. Surface preparation\n2. Primer application\n3. Paint application\n4. Cleanup',
      jobSafetyAnalysis: 'Risk: Fall from height, chemical exposure\nControl: Safety harness, proper PPE, ventilation',
      workRequirements: 'Painter certification, height work permit',
      safetyGuideline: 'Follow painting safety standards',
      requireCourseVerification: true,
      status: 'APPROVED',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId:
              masters.workClassifications.length > 3 ? masters.workClassifications[3]!.id : workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker4.id,
            idNumber: 'ID444555666',
            healthDeclarationUrl: 'https://example.com/health-declaration-4.pdf',
            order: 0,
          },
        ],
      },
      tools: {
        create: [
          {
            toolId: masters.tools.length > 3 ? masters.tools[3]!.id : tool.id,
            quantity: 5,
            order: 0,
          },
        ],
      },
      materials: {
        create: [
          {
            materialId: masters.materials.length > 3 ? masters.materials[3]!.id : material.id,
            quantity: 20,
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp3.code} (APPROVED)`);

  // Sample Work Permit 4: REJECTED
  const wp4 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 4),
      projectName: 'Hot Work - Welding Operations',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: 'Welding work for structural repairs',
      jobSafetyAnalysis: 'Risk: Fire, explosion\nControl: Fire watch, fire extinguisher, clear area',
      workRequirements: 'Welder certification required',
      safetyGuideline: 'Follow hot work safety standards',
      requireCourseVerification: true,
      status: 'REJECTED',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId: workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker5.id,
            idNumber: 'ID777888999',
            healthDeclarationUrl: 'https://example.com/health-declaration-5.pdf',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp4.code} (REJECTED)`);

  // Sample Work Permit 5: CLOSED
  const wp5 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 5),
      projectName: 'General Maintenance - Completed',
      areaId: masters.areas[0].id,
      companyId: masters.companies[0].id,
      proposedStartDate: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 2 weeks ago
      proposedEndDate: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 1 week ago
      workStagesDescription: 'General maintenance work - completed',
      jobSafetyAnalysis: 'Standard maintenance procedures',
      workRequirements: 'General maintenance training',
      safetyGuideline: 'Follow standard safety procedures',
      requireCourseVerification: false,
      status: 'CLOSED',
      createdBy: creator.id,
      workers: {
        create: [
          {
            userId: worker1.id,
            idNumber: 'ID123456789',
            healthDeclarationUrl: 'https://example.com/health-declaration-1.pdf',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp5.code} (CLOSED)`);

  // Admin Overview dashboard: WAITING_APPROVAL and one more APPROVED
  const wp6 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 6),
      projectName: 'Admin Overview - Confined Space Entry',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: nextWeek,
      proposedEndDate: nextMonth,
      workStagesDescription: 'Confined space inspection and maintenance',
      jobSafetyAnalysis: 'Risk: Confined space\nControl: Entry permit, gas monitoring',
      workRequirements: 'Confined space training',
      safetyGuideline: 'Follow confined space procedures',
      requireCourseVerification: true,
      status: 'WAITING_APPROVAL',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId:
              masters.workClassifications.length > 1 ? masters.workClassifications[1]!.id : workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker1.id,
            idNumber: 'ID111111111',
            healthDeclarationUrl: 'https://example.com/health-declaration-wp6.pdf',
            order: 0,
          },
        ],
      },
      hazards: {
        create: [
          {
            hazardName: 'Confined Space',
            description: 'Limited entry and exit',
            controlMeasure: 'Permit to work, attendant',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp6.code} (WAITING_APPROVAL)`);

  const wp7 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 7),
      projectName: 'Admin Overview - Height Work',
      areaId: masters.areas.length > 1 ? masters.areas[1]!.id : area.id,
      companyId: company.id,
      proposedStartDate: tomorrow,
      proposedEndDate: nextWeek,
      workStagesDescription: 'Work at height - facade inspection',
      jobSafetyAnalysis: 'Risk: Fall from height\nControl: Harness, guardrails',
      workRequirements: 'Height work certification',
      safetyGuideline: 'Follow work at height procedures',
      requireCourseVerification: true,
      status: 'WAITING_APPROVAL',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId:
              masters.workClassifications.length > 3 ? masters.workClassifications[3]!.id : workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker2.id,
            idNumber: 'ID222222222',
            healthDeclarationUrl: 'https://example.com/health-declaration-wp7.pdf',
            order: 0,
          },
        ],
      },
      hazards: {
        create: [
          {
            hazardName: 'Fall from height',
            description: 'Working above 1.5m',
            controlMeasure: 'Fall arrest, barriers',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp7.code} (WAITING_APPROVAL)`);

  const wp8 = await prisma.workPermit.create({
    data: {
      code: generateCode(currentYear, 8),
      projectName: 'Admin Overview - Approved Permit',
      areaId: area.id,
      companyId: company.id,
      proposedStartDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      proposedEndDate: nextWeek,
      workStagesDescription: 'General repair work - approved',
      jobSafetyAnalysis: 'Standard risks and controls',
      workRequirements: 'General safety training',
      safetyGuideline: 'Follow standard procedures',
      requireCourseVerification: false,
      status: 'APPROVED',
      createdBy: creator.id,
      classifications: {
        create: [
          {
            workClassificationId: workClassification.id,
            order: 0,
          },
        ],
      },
      workers: {
        create: [
          {
            userId: worker2.id,
            idNumber: 'ID987654321',
            healthDeclarationUrl: 'https://example.com/health-declaration-wp8.pdf',
            order: 0,
          },
        ],
      },
    },
  });
  console.log(`✅ Created work permit: ${wp8.code} (APPROVED)`);

  console.log('✅ Work permit seeding completed');
  return {
    workPermits: [wp1, wp2, wp3, wp4, wp5, wp6, wp7, wp8],
    masters,
    guests,
  };
}

export async function seedWorkPermitsData(prisma: PrismaClient) {
  await seedWorkPermits(prisma);
}
