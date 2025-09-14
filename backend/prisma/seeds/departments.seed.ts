import { PrismaClient } from '@prisma/client';

export async function seedDepartments(prisma: PrismaClient) {
  console.log('Seeding departments...');

  const departments = [
    {
      name: 'Administration',
      code: 'ADMIN',
      description: 'Handles school operations, leadership, and policies',
      isActive: true,
    },
    {
      name: 'Admissions',
      code: 'ADM',
      description: 'Manages student enrollment and application process',
      isActive: true,
    },
    {
      name: 'Academics',
      code: 'ACAD',
      description: 'Academic support for students',
      isActive: true,
    },
    {
      name: 'Human Resources',
      code: 'HR',
      description: 'Manages staffing, recruitment, and employee welfare',
      isActive: true,
    },
    {
      name: 'Finance',
      code: 'FIN',
      description: 'Handles budgeting, billing, and school finances',
      isActive: true,
    },
    {
      name: 'Information Technology',
      code: 'IT',
      description: 'Supports technology infrastructure and digital learning tools',
      isActive: true,
    },
    {
      name: 'Library and Media Center',
      code: 'LIB',
      description: 'Maintains educational resources and supports research',
      isActive: true,
    },
    {
      name: 'Counseling and Student Services',
      code: 'CSS',
      description: 'Provides psychological and academic counseling for students',
      isActive: true,
    },
    {
      name: 'Health Services',
      code: 'HEALTH',
      description: 'Manages student health and wellness',
      isActive: true,
    },
    {
      name: 'Facilities and Maintenance',
      code: 'FAC',
      description: 'Maintains school buildings, classrooms, and grounds',
      isActive: true,
    },
    {
      name: 'Security',
      code: 'SEC',
      description: 'Ensures safety of students and staff on campus',
      isActive: true,
    },
    {
      name: 'Transportation',
      code: 'TRANS',
      description: 'Organizes school bus services and logistics',
      isActive: true,
    },
    {
      name: 'Cafeteria and Food Services',
      code: 'CAFE',
      description: 'Provides meals and manages food service operations',
      isActive: true,
    },
    {
      name: 'Extracurricular Activities',
      code: 'EXTRA',
      description: 'Coordinates clubs, athletics, and enrichment programs',
      isActive: true,
    },
    {
      name: 'Marketing and Communications',
      code: 'MARCOM',
      description: 'Manages public relations, branding, and internal communication',
      isActive: true,
    },
  ];

  // Clear existing departments
  await prisma.department.deleteMany();

  // Create departments
  const createdDepartments = await Promise.all(
    departments.map((dept) =>
      prisma.department.create({
        data: dept,
      })
    )
  );

  console.log(`Created ${createdDepartments.length} departments`);
  return createdDepartments;
} 