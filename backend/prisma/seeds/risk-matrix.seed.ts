import { PrismaClient } from '@prisma/client';

type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

// Risk Matrix data following a 5x5 matrix pattern
// Likelihood levels: A (Unlikely), B (Less likely), C (Probably), D (Likely), E (Most likely)
// Consequence levels: 1 (Insignificant), 2 (Minor), 3 (Moderate), 4 (Major), 5 (Extreme)
export const riskMatrix = [
  // Likelihood Level A (Unlikely)
  { 
    likelihoodLevel: 'A', 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 1,
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    interpretation: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 'A', 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 2,
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    interpretation: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 'A', 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 3,
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'A', 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 4,
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'A', 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 5,
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    interpretation: 'HIGH' as RiskRating 
  },

  // Likelihood Level B (Less likely to occur)
  { 
    likelihoodLevel: 'B', 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 1,
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    interpretation: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 'B', 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 2,
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'B', 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 3,
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'B', 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 4,
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'B', 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 5,
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    interpretation: 'EXTREME' as RiskRating 
  },

  // Likelihood Level C (Probably)
  { 
    likelihoodLevel: 'C', 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 1,
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'C', 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 2,
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'C', 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 3,
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'C', 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 4,
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    interpretation: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 'C', 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 5,
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    interpretation: 'EXTREME' as RiskRating 
  },

  // Likelihood Level D (Likely to occur)
  { 
    likelihoodLevel: 'D', 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 1,
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    interpretation: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 'D', 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 2,
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'D', 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 3,
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'D', 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 4,
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    interpretation: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 'D', 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 5,
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    interpretation: 'EXTREME' as RiskRating 
  },

  // Likelihood Level E (Most likely)
  { 
    likelihoodLevel: 'E', 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 1,
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'E', 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 2,
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    interpretation: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 'E', 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 3,
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    interpretation: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 'E', 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 4,
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    interpretation: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 'E', 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 5,
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    interpretation: 'EXTREME' as RiskRating 
  },
];

export async function seedRiskMatrix(prisma: PrismaClient) {
  console.log('Creating risk matrix entries...');
  const createdEntries = await Promise.all(
    riskMatrix.map((entry) =>
      prisma.riskMatrix.create({
        data: entry,
      })
    )
  );
  console.log(`Created ${createdEntries.length} risk matrix entries`);
  return createdEntries;
} 