import { Badge } from '@/core/components/ui/badge';

interface RiskRegisterSourceBadgeProps {
  entity: string;
}

export const RiskRegisterSourceBadge = ({ entity }: RiskRegisterSourceBadgeProps) => {
  const isRiskAssessment = entity === 'RISK_ASSESSMENT_ITEM';
  const isInspection = entity === 'INSPECTION_ITEM';

  return (
    <Badge
      variant="outline"
      className={
        isRiskAssessment
          ? 'bg-blue-100 text-blue-800 border-blue-300'
          : isInspection
          ? 'bg-green-100 text-green-800 border-green-300'
          : 'bg-gray-100 text-gray-800'
      }
    >
      {isRiskAssessment ? 'Risk Assessment' : isInspection ? 'Inspection' : entity}
    </Badge>
  );
};
