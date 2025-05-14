import { PrismaClient } from '@prisma/client';

export async function seedJobPositions(prisma: PrismaClient) {
    console.log('Seeding job positions...');

    const jobPositions = [
        {
            "name": "Head",
            "code": "HEAD",
            "description": "Top leader of a department or school, responsible for strategic and operational oversight",
            "level": 1
        },
        {
            "name": "Director",
            "code": "DIRECTOR",
            "description": "Oversees a major function or division, often reporting directly to the head of school",
            "level": 2
        },
        {
            "name": "Principal",
            "code": "PRINCIPAL",
            "description": "Leads a specific school level (e.g., Primary, Secondary), typically under the Head of School",
            "level": 3
        },
        {
            "name": "Vice Principal",
            "code": "VICE_PRINCIPAL",
            "description": "Supports the Principal in managing academic and operational activities",
            "level": 4
        },
        {
            "name": "Manager",
            "code": "MANAGER",
            "description": "Responsible for day-to-day operations within a department or team",
            "level": 5
        },
        {
            "name": "Supervisor",
            "code": "SUPERVISOR",
            "description": "Oversees a small team or specific functional area within a department",
            "level": 6
        },
        {
            "name": "Coordinator",
            "code": "COORDINATOR",
            "description": "Coordinates specific activities or programs, often cross-functional",
            "level": 7
        },
        {
            "name": "Lead",
            "code": "LEAD",
            "description": "Senior staff member with leadership duties but not full managerial authority",
            "level": 8
        },
        {
            "name": "Specialist",
            "code": "SPECIALIST",
            "description": "Expert in a specific field or area, provides support or training",
            "level": 9
        },
        {
            "name": "Officer",
            "code": "OFFICER",
            "description": "Mid-level position executing specific tasks, often administrative",
            "level": 10
        },
        {
            "name": "Assistant",
            "code": "ASSISTANT",
            "description": "Supports a specific person or function, often entry-level or clerical",
            "level": 11
        },
        {
            "name": "Staff",
            "code": "STAFF",
            "description": "General term for employees performing operational or support roles",
            "level": 12
        },
        {
            "name": "Intern",
            "code": "INTERN",
            "description": "Temporary role, usually for students or trainees",
            "level": 13
        }
    ];

    // Clear existing job positions
    await prisma.jobPosition.deleteMany();

    // Create job positions
    const createdJobPositions = await Promise.all(
        jobPositions.map((jobPosition) =>
            prisma.jobPosition.create({
                data: jobPosition,
            })
        )
    );

    console.log(`Created ${createdJobPositions.length} job positions`);
    return createdJobPositions;
}