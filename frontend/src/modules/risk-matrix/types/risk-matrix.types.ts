/**
 * Risk Matrix module types
 */

import type { PaginatedResponse, PaginationParams } from '@/core/lib/types';

// Risk Rating Enum
export enum RiskRatingEnum {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  EXTREME = 'EXTREME',
}

// =============================================================================
// LIKELIHOOD TYPES (Local UI Only - extracted from RiskMatrix)
// =============================================================================
// Note: Backend does not have separate Likelihood/Consequence tables
// These types are used for UI organization only

export interface LikelihoodOption {
  level: number;
  name: string;
  desc: string;
}

export interface ConsequenceOption {
  level: string;
  name: string;
  desc: string;
}

// =============================================================================
// RISK MATRIX TYPES
// =============================================================================

// Interface for risk matrix data from API
export interface RiskMatrixDTO {
  id: string;
  likelihoodLevel: number;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: string;
  consequenceName: string;
  consequenceDesc: string;
  risk_rating: RiskRatingEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Frontend model for risk matrix
export interface RiskMatrix {
  id: string;
  likelihoodLevel: number;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: string;
  consequenceName: string;
  consequenceDesc: string;
  riskRating: RiskRatingEnum;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Interface for creating a risk matrix entry
export interface CreateRiskMatrixDTO {
  likelihoodLevel: number;
  likelihoodName: string;
  likelihoodDesc: string;
  consequenceLevel: string;
  consequenceName: string;
  consequenceDesc: string;
  risk_rating: RiskRatingEnum;
  isActive?: boolean;
}

// Interface for updating a risk matrix entry
export interface UpdateRiskMatrixDTO {
  likelihoodLevel?: number;
  likelihoodName?: string;
  likelihoodDesc?: string;
  consequenceLevel?: string;
  consequenceName?: string;
  consequenceDesc?: string;
  risk_rating?: RiskRatingEnum;
  isActive?: boolean;
}

// Search parameters for risk matrix
export interface RiskMatrixSearchParams extends PaginationParams {
  search?: string;
  isActive?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Risk Rating calculation types
export interface RiskRating {
  riskLevel: {
    level: number;
    description: string;
    color: string;
  };
  score: number;
  description: string;
}

export interface CalculateRiskDTO {
  likelihoodLevel: number;
  consequenceLevel: number;
}

// =============================================================================
// BATCH UPDATE TYPES
// =============================================================================

export interface MatrixCell {
  id?: string;
  likelihoodLevel: number;
  consequenceLevel: string;
  riskRating: RiskRatingEnum;
  isActive: boolean;
  isNew?: boolean;
  isModified?: boolean;
}
