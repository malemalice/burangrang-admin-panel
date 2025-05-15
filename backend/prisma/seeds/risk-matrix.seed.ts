import { PrismaClient } from '@prisma/client';

type RiskRating = 'LOW' | 'MEDIUM' | 'HIGH' | 'EXTREME';

// Risk Matrix data following a 5x5 matrix pattern
export const riskMatrix = [
  // Likelihood Level 1 (Rare)
  { likelihoodLevel: 1, consequenceLevel: 1, risk_rating: 'LOW' as RiskRating },
  { likelihoodLevel: 1, consequenceLevel: 2, risk_rating: 'LOW' as RiskRating },
  { likelihoodLevel: 1, consequenceLevel: 3, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 1, consequenceLevel: 4, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 1, consequenceLevel: 5, risk_rating: 'HIGH' as RiskRating },

  // Likelihood Level 2 (Unlikely)
  { likelihoodLevel: 2, consequenceLevel: 1, risk_rating: 'LOW' as RiskRating },
  { likelihoodLevel: 2, consequenceLevel: 2, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 2, consequenceLevel: 3, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 2, consequenceLevel: 4, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 2, consequenceLevel: 5, risk_rating: 'EXTREME' as RiskRating },

  // Likelihood Level 3 (Possible)
  { likelihoodLevel: 3, consequenceLevel: 1, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 3, consequenceLevel: 2, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 3, consequenceLevel: 3, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 3, consequenceLevel: 4, risk_rating: 'EXTREME' as RiskRating },
  { likelihoodLevel: 3, consequenceLevel: 5, risk_rating: 'EXTREME' as RiskRating },

  // Likelihood Level 4 (Likely)
  { likelihoodLevel: 4, consequenceLevel: 1, risk_rating: 'MEDIUM' as RiskRating },
  { likelihoodLevel: 4, consequenceLevel: 2, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 4, consequenceLevel: 3, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 4, consequenceLevel: 4, risk_rating: 'EXTREME' as RiskRating },
  { likelihoodLevel: 4, consequenceLevel: 5, risk_rating: 'EXTREME' as RiskRating },

  // Likelihood Level 5 (Almost Certain)
  { likelihoodLevel: 5, consequenceLevel: 1, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 5, consequenceLevel: 2, risk_rating: 'HIGH' as RiskRating },
  { likelihoodLevel: 5, consequenceLevel: 3, risk_rating: 'EXTREME' as RiskRating },
  { likelihoodLevel: 5, consequenceLevel: 4, risk_rating: 'EXTREME' as RiskRating },
  { likelihoodLevel: 5, consequenceLevel: 5, risk_rating: 'EXTREME' as RiskRating },
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