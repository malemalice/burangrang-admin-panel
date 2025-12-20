import { PrismaClient } from '@prisma/client';

export const threats = [
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

export async function seedThreats(prisma: PrismaClient, hseCategoryIds: string[]) {
  console.log('Creating risks...');
  
  // Map threats to categories based on CSV data
  const threatsWithCategories = [
    { ...threats[0], hseCategoryId: hseCategoryIds[0] },  // Natural Disaster
    { ...threats[1], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[2], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[3], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[4], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[5], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[6], hseCategoryId: hseCategoryIds[1] },  // Physical Hazard
    { ...threats[7], hseCategoryId: hseCategoryIds[2] },  // Mechanical Hazard
    { ...threats[8], hseCategoryId: hseCategoryIds[2] },  // Mechanical Hazard
    { ...threats[9], hseCategoryId: hseCategoryIds[2] },  // Mechanical Hazard
    { ...threats[10], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...threats[11], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...threats[12], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...threats[13], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...threats[14], hseCategoryId: hseCategoryIds[2] }, // Mechanical Hazard
    { ...threats[15], hseCategoryId: hseCategoryIds[3] }, // Ergonomic Hazard
    { ...threats[16], hseCategoryId: hseCategoryIds[4] }, // Environmental Hazard
    { ...threats[17], hseCategoryId: hseCategoryIds[4] }, // Environmental Hazard
    { ...threats[18], hseCategoryId: hseCategoryIds[5] }, // Chemical Hazard
    { ...threats[19], hseCategoryId: hseCategoryIds[5] }, // Chemical Hazard
    { ...threats[20], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...threats[21], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...threats[22], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...threats[23], hseCategoryId: hseCategoryIds[6] }, // Biological Hazard
    { ...threats[24], hseCategoryId: hseCategoryIds[7] }, // Government Permit
  ];

  const createdRisks = await Promise.all(
    threatsWithCategories.map((threat) =>
      (prisma as any).risk.create({
        data: threat,
      })
    )
  );
  console.log('Created risks:', createdRisks.map((t) => t.name));
  return createdRisks;
} 