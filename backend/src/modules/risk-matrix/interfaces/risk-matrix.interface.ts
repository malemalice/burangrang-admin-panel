export interface RiskLevel {
  level: number;
  description: string;
  color: string;
}

export interface RiskRating {
  riskLevel: RiskLevel;
  score: number;
  description: string;
}

export interface RiskMatrixConfig {
  matrix: number[][];
  levels: RiskLevel[];
} 