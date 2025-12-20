import { PrismaClient } from '@prisma/client';

export const risks = [
  {
    name: 'Earthquake & Flood',
    code: 'EQ-FLOOD',
    description: 'Risk of earthquake and flood damage',
    isActive: true,
  },
  {
    name: 'Electric Shock',
    code: 'ELEC-SHOCK',
    description: 'Electric shock when work using the electric equipment and from electrostatic wave',
    isActive: true,
  },
  {
    name: 'Fire from Short Circuit',
    code: 'FIRE-SC',
    description: 'Fire due to short circuit',
    isActive: true,
  },
  {
    name: 'Noise Induced Hearing Loss',
    code: 'NOISE-HL',
    description: 'Noise induced hearing lost',
    isActive: true,
  },
  {
    name: 'Burns and Scalds',
    code: 'BURNS',
    description: 'Burns, scalds during bonefire activity',
    isActive: true,
  },
  {
    name: 'Heat Related Illness',
    code: 'HEAT-ILL',
    description: 'Heat stroke, exhaustion, Dehydration, Sun burn due to High Temperature Exposure',
    isActive: true,
  },
  {
    name: 'Drowning',
    code: 'DROWN',
    description: 'Drowning / Near drowning at the swimming pool',
    isActive: true,
  },
  {
    name: 'Slippery Floor',
    code: 'SLIP-FLOOR',
    description: 'Falling or stumbling at the same/fixed level due to slipery floor',
    isActive: true,
  },
  {
    name: 'Fall from Height',
    code: 'FALL-HGT',
    description: 'Falling from different level of the floor',
    isActive: true,
  },
  {
    name: 'Vehicle Gate Collision',
    code: 'VEH-GATE',
    description: 'Hit the portal gate while driving on Campus',
    isActive: true,
  },
  {
    name: 'Pedestrian Collision',
    code: 'PED-HIT',
    description: 'Hit the pedisterian while driving on Campus',
    isActive: true,
  },
  {
    name: 'Vehicle Collision',
    code: 'VEH-CRASH',
    description: 'Crash with other vihicles while driving on Campus',
    isActive: true,
  },
  {
    name: 'Bike Fall',
    code: 'BIKE-FALL',
    description: 'Fall from the bike due to slippery road',
    isActive: true,
  },
  {
    name: 'Emergency Access Blocked',
    code: 'EMER-BLOCK',
    description: 'Emergency access blocked',
    isActive: true,
  },
  {
    name: 'Falling Objects',
    code: 'FALL-OBJ',
    description: 'Falling Objects',
    isActive: true,
  },
  {
    name: 'Musculoskeletal Disorder',
    code: 'MSD',
    description: 'Musculosceletal disorder due to taking too long in the wrong position/bad posture of work',
    isActive: true,
  },
  {
    name: 'Water Pollution',
    code: 'WATER-POL',
    description: 'Pollution of water, soil from WWTP',
    isActive: true,
  },
  {
    name: 'Lightning Strike',
    code: 'LIGHT-STRIKE',
    description: 'Lightnig strike',
    isActive: true,
  },
  {
    name: 'Carbon Dioxide Poisoning',
    code: 'CO2-POISON',
    description: 'Carbon dioxide poisoning from vehicles',
    isActive: true,
  },
  {
    name: 'Chemical Exposure',
    code: 'CHEM-EXP',
    description: 'Exposure to chemical vapors or splashes',
    isActive: true,
  },
  {
    name: 'Insect Bites',
    code: 'INSECT-BITE',
    description: 'Insect Bites',
    isActive: true,
  },
  {
    name: 'Wild Animal Attack',
    code: 'ANIMAL-ATK',
    description: 'Wild animals attack outdoor or indoor venue',
    isActive: true,
  },
  {
    name: 'Food Poisoning',
    code: 'FOOD-POISON',
    description: 'Food Poisoning',
    isActive: true,
  },
  {
    name: 'Communicable Disease',
    code: 'COMM-DISEASE',
    description: 'Comunicable disease such as Virus Covid 19',
    isActive: true,
  },
  {
    name: 'Permit Issues',
    code: 'PERMIT-ISS',
    description: 'Goverment Permit & License not available',
    isActive: true,
  },
];

export async function seedRisks(
  prisma: PrismaClient,
  hseCategoryIds: string[],
) {
  console.log('Creating risks...');

  // Map risks to categories based on HSE category order
  // Categories: [0] Natural Disaster, [1] Physical Hazard, [2] Mechanical Hazard,
  //             [3] Ergonomic Hazard, [4] Environmental Hazard, [5] Chemical Hazard,
  //             [6] Biological Hazard, [7] Government Permit
  const risksWithCategories = [
    { ...risks[0], hseCategoryId: hseCategoryIds[0] }, // Natural Disaster
    { ...risks[1], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[2], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[3], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[4], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[5], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[6], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[7], hseCategoryId: hseCategoryIds[1] }, // Physical Hazard
    { ...risks[8], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[9], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[10], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[11], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[12], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[13], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[14], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...risks[15], hseCategoryId: hseCategoryIds[3] }, // Ergonomic Hazard
    { ...risks[16], hseCategoryId: hseCategoryIds[4] }, // Environmental Hazard
    { ...risks[17], hseCategoryId: hseCategoryIds[4] }, // Environmental Hazard
    { ...risks[18], hseCategoryId: hseCategoryIds[5] }, // Chemical Hazard
    { ...risks[19], hseCategoryId: hseCategoryIds[5] }, // Chemical Hazard
    { ...risks[20], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...risks[21], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...risks[22], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...risks[23], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...risks[24], hseCategoryId: hseCategoryIds[7] }, // Government Permit
  ];

  const createdRisks = await Promise.all(
    risksWithCategories.map((risk) =>
      prisma.risk.create({
        data: risk,
      }),
    ),
  );
  console.log('Created risks:', createdRisks.map((r) => r.name));
  return createdRisks;
}
