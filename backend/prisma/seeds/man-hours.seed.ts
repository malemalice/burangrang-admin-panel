import { ManHourGroupEnum, MonthEnum } from '@prisma/client';
import { notDeleted } from './not-deleted';
import { seedPrisma as prisma } from './prisma-seed-client';

/**
 * Seed data for Man Hours
 * Creates sample man hour records for students and non-students across multiple months/years
 */
export async function seedManHours(): Promise<void> {

  try {
    console.log('📊 Seeding Man Hours...');

    // Get a user for createdBy field
    const user = await prisma.user.findFirst({
      where: { isActive: true },
    });

    if (!user) {
      console.log('⚠️  No active user found. Skipping man hours seed.');
      return;
    }

    // Define class data
    const classes = [
      // Student classes
      { name: 'Year 1-2', group: ManHourGroupEnum.STUDENT, qty: 120, manHourPerDay: 6.0 },
      { name: 'Year 3-4', group: ManHourGroupEnum.STUDENT, qty: 100, manHourPerDay: 6.5 },
      { name: 'Year 5-6', group: ManHourGroupEnum.STUDENT, qty: 90, manHourPerDay: 7.0 },
      { name: 'Kukang - KG1', group: ManHourGroupEnum.STUDENT, qty: 25, manHourPerDay: 4.0 },
      { name: 'Kukang - KG2', group: ManHourGroupEnum.STUDENT, qty: 30, manHourPerDay: 4.5 },
      { name: 'Kukang - KG3', group: ManHourGroupEnum.STUDENT, qty: 28, manHourPerDay: 5.0 },
      // Non-student classes (staff, teachers, etc.)
      { name: 'Teachers', group: ManHourGroupEnum.NON_STUDENT, qty: 45, manHourPerDay: 8.0 },
      { name: 'Admin Staff', group: ManHourGroupEnum.NON_STUDENT, qty: 15, manHourPerDay: 8.0 },
      { name: 'Security', group: ManHourGroupEnum.NON_STUDENT, qty: 8, manHourPerDay: 10.0 },
      { name: 'Cleaning Staff', group: ManHourGroupEnum.NON_STUDENT, qty: 12, manHourPerDay: 8.0 },
    ];

    // Define months to seed (2020-2026 for LTICR/KPI sample data)
    const currentYear = new Date().getFullYear();
    const years = [2020, 2021, 2022, 2023, 2024, 2025, 2026];
    const allMonths: MonthEnum[] = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

    // Working day count per month (NON_STUDENT: stored in totalWorkingDays; capacity = qty × mhpd × this)
    const defaultWorkingDayCount = 22;

    let createdCount = 0;

    for (const year of years) {
      // For current year, only seed up to current month
      const currentMonth = new Date().getMonth(); // 0-indexed
      const monthsToSeed = year === currentYear ? allMonths.slice(0, currentMonth + 1) : allMonths;

      for (const month of monthsToSeed) {
        for (const classData of classes) {
          const isStudent = classData.group === ManHourGroupEnum.STUDENT;
          const workingDayCount = defaultWorkingDayCount;
          // STUDENT: totalWorkingDays column stores capacity (man-hours) per PRD; NON_STUDENT: day count
          const totalWorkingDays = isStudent
            ? classData.qty * classData.manHourPerDay * workingDayCount
            : workingDayCount;
          const lostHour = 0;
          const capacityManHours = classData.qty * classData.manHourPerDay * workingDayCount;
          const total = capacityManHours - lostHour;

          try {
            const createData = {
              name: classData.name,
              group: classData.group,
              qty: classData.qty,
              manHourPerDay: classData.manHourPerDay,
              month: month,
              year: year,
              totalWorkingDays,
              lostHour,
              total,
              notes: `Man hour data for ${classData.name} - ${month} ${year}`,
              createdBy: user.id,
            };
            const updateData = {
              qty: classData.qty,
              manHourPerDay: classData.manHourPerDay,
              totalWorkingDays,
              lostHour,
              total,
            };
            const existing = await prisma.manHour.findFirst({
              where: {
                name: classData.name,
                group: classData.group,
                month: month,
                year: year,
                ...notDeleted,
              },
            });
            if (existing) {
              await prisma.manHour.update({
                where: { id: existing.id },
                data: updateData,
              });
            } else {
              await prisma.manHour.create({ data: createData });
            }
            createdCount++;
          } catch (error: any) {
            if (error.code !== 'P2002') {
              // Ignore unique constraint errors
              console.error(`Error creating man hour for ${classData.name} ${month} ${year}:`, error.message);
            }
          }
        }
      }
    }

    console.log(`   ✅ Created/Updated ${createdCount} man hour records`);
    console.log(`   📅 Years: ${years.join(', ')}`);
    console.log(`   👥 Classes: ${classes.length} (Students: ${classes.filter(c => c.group === 'STUDENT').length}, Non-Students: ${classes.filter(c => c.group === 'NON_STUDENT').length})`);

  } catch (error) {
    console.error('❌ Error seeding man hours:', error);
    throw error;
  }
}
