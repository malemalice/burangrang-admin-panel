import { PrismaClient } from '@prisma/client';

type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

// Risk Matrix data following a 5x5 matrix pattern
// Consequence levels: A (Insignificant), B (Minor), C (Moderate), D (Major), E (Extreme)
export const riskMatrix = [
  // Likelihood Level 1 (Unlikely)
  { 
    likelihoodLevel: 1, 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 'A',
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    risk_rating: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 1, 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 'B',
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    risk_rating: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 1, 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 'C',
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 1, 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 'D',
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 1, 
    likelihoodName: 'Unlikely',
    likelihoodDesc: 'occur one time in three year of the work cycle',
    consequenceLevel: 'E',
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    risk_rating: 'HIGH' as RiskRating 
  },

  // Likelihood Level 2 (Less likely to occur)
  { 
    likelihoodLevel: 2, 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 'A',
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    risk_rating: 'LOW' as RiskRating 
  },
  { 
    likelihoodLevel: 2, 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 'B',
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 2, 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 'C',
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 2, 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 'D',
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 2, 
    likelihoodName: 'Less likely to occur',
    likelihoodDesc: 'occur one time in a year of the work cycle',
    consequenceLevel: 'E',
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    risk_rating: 'EXTREME' as RiskRating 
  },

  // Likelihood Level 3 (Probably)
  { 
    likelihoodLevel: 3, 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 'A',
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 3, 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 'B',
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 3, 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 'C',
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 3, 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 'D',
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    risk_rating: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 3, 
    likelihoodName: 'Probably',
    likelihoodDesc: 'occur more than one time in a year of the work cycle',
    consequenceLevel: 'E',
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    risk_rating: 'EXTREME' as RiskRating 
  },

  // Likelihood Level 4 (Likely to occur)
  { 
    likelihoodLevel: 4, 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 'A',
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    risk_rating: 'MEDIUM' as RiskRating 
  },
  { 
    likelihoodLevel: 4, 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 'B',
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 4, 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 'C',
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 4, 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 'D',
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    risk_rating: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 4, 
    likelihoodName: 'Likely to occur',
    likelihoodDesc: 'occur more than one time in a month of the work cycle',
    consequenceLevel: 'E',
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    risk_rating: 'EXTREME' as RiskRating 
  },

  // Likelihood Level 5 (Most likely)
  { 
    likelihoodLevel: 5, 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 'A',
    consequenceName: 'Insignificant',
    consequenceDesc: 'Incident without injury and can continue to work again',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 5, 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 'B',
    consequenceName: 'Minor',
    consequenceDesc: 'Incident without loss of time injury but require medical treatment at medical',
    risk_rating: 'HIGH' as RiskRating 
  },
  { 
    likelihoodLevel: 5, 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 'C',
    consequenceName: 'Moderate',
    consequenceDesc: 'Incident with loss time injury but not stopping the work process/activities',
    risk_rating: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 5, 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 'D',
    consequenceName: 'Major',
    consequenceDesc: 'Incidents with loss time injury and stopping the work process/activities. Causes large and extensive environmental damage',
    risk_rating: 'EXTREME' as RiskRating 
  },
  { 
    likelihoodLevel: 5, 
    likelihoodName: 'Most likely',
    likelihoodDesc: 'occur more than one time in a week of the work cycle',
    consequenceLevel: 'E',
    consequenceName: 'Extreme',
    consequenceDesc: 'Incidents that could result in death or permanent disability',
    risk_rating: 'EXTREME' as RiskRating 
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