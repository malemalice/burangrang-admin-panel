// Must match backend InspectionRiskRateEnum (Prisma schema)
export enum InspectionRiskRateEnum {
  SAFE            = 'SAFE',
  LOW_HAZARD      = 'LOW_HAZARD',
  MODERATE_HAZARD = 'MODERATE_HAZARD',
  CRITICAL_HAZARD = 'CRITICAL_HAZARD',
}

export const INSPECTION_RISK_RATE_OPTIONS = [
  { value: InspectionRiskRateEnum.SAFE,            label: 'Safe' },
  { value: InspectionRiskRateEnum.LOW_HAZARD,      label: 'Low Hazard' },
  { value: InspectionRiskRateEnum.MODERATE_HAZARD, label: 'Moderate Hazard' },
  { value: InspectionRiskRateEnum.CRITICAL_HAZARD, label: 'Critical Hazard' },
];

export const INSPECTION_RISK_RATE_BADGE_CLASSES: Record<InspectionRiskRateEnum, string> = {
  [InspectionRiskRateEnum.SAFE]:            'bg-green-100 text-green-800',
  [InspectionRiskRateEnum.LOW_HAZARD]:      'bg-yellow-100 text-yellow-800',
  [InspectionRiskRateEnum.MODERATE_HAZARD]: 'bg-orange-100 text-orange-800',
  [InspectionRiskRateEnum.CRITICAL_HAZARD]: 'bg-red-100 text-red-800',
};

export const INSPECTION_RISK_RATE_PILL_CLASSES: Record<InspectionRiskRateEnum, string> = {
  [InspectionRiskRateEnum.SAFE]:            'bg-green-600 text-white border-green-600 hover:bg-green-700',
  [InspectionRiskRateEnum.LOW_HAZARD]:      'bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600',
  [InspectionRiskRateEnum.MODERATE_HAZARD]: 'bg-orange-500 text-white border-orange-500 hover:bg-orange-600',
  [InspectionRiskRateEnum.CRITICAL_HAZARD]: 'bg-red-600 text-white border-red-600 hover:bg-red-700',
};
