import { Injectable } from '@nestjs/common';
import { RiskLevel, RiskRating, RiskMatrixConfig } from '../interfaces/risk-matrix.interface';

@Injectable()
export class RiskMatrixService {
  private readonly riskMatrixConfig: RiskMatrixConfig = {
    // 5x5 Risk Matrix Configuration
    matrix: [
      [1, 2, 3, 4, 5],
      [2, 4, 6, 8, 10],
      [3, 6, 9, 12, 15],
      [4, 8, 12, 16, 20],
      [5, 10, 15, 20, 25],
    ],
    levels: [
      { level: 1, description: 'Low Risk', color: 'green' },
      { level: 2, description: 'Medium Risk', color: 'yellow' },
      { level: 3, description: 'High Risk', color: 'orange' },
      { level: 4, description: 'Critical Risk', color: 'red' },
      { level: 5, description: 'Extreme Risk', color: 'darkred' },
    ],
  };

  calculateRiskRating(likelihoodLevel: number, consequenceLevel: number): RiskRating {
    // Adjust indices for 0-based array
    const row = likelihoodLevel - 1;
    const col = consequenceLevel - 1;

    // Calculate risk score from matrix
    const score = this.riskMatrixConfig.matrix[row][col];

    // Determine risk level based on score
    const riskLevel = this.determineRiskLevel(score);

    return {
      riskLevel,
      score,
      description: `${riskLevel.description} (Score: ${score})`,
    };
  }

  private determineRiskLevel(score: number): RiskLevel {
    if (score <= 4) return this.riskMatrixConfig.levels[0]; // Low Risk
    if (score <= 8) return this.riskMatrixConfig.levels[1]; // Medium Risk
    if (score <= 12) return this.riskMatrixConfig.levels[2]; // High Risk
    if (score <= 16) return this.riskMatrixConfig.levels[3]; // Critical Risk
    return this.riskMatrixConfig.levels[4]; // Extreme Risk
  }
} 