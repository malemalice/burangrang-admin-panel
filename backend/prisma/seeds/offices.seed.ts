import { PrismaClient } from '@prisma/client';

export const offices = [
  {
    name: 'Headquarters',
    code: 'HQ',
    isActive: true,
  },
];

export async function seedOffices(prisma: PrismaClient) {
  console.log('Creating default office...');
  const createdOffices = await Promise.all(
    offices.map((office) =>
      prisma.office.create({
        data: office,
      })
    )
  );
  console.log('Created offices:', createdOffices.map((o) => o.name));
  return createdOffices;
} 