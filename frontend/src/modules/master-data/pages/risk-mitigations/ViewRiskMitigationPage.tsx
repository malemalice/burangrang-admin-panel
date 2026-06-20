import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, Loader2, Shield } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';
import { riskMitigationService } from '@/modules/master-data';
import { RiskMitigation } from '@/core/lib/types';

const ViewRiskMitigationPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [mitigation, setMitigation] = useState<RiskMitigation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMitigation = async () => {
      try {
        if (!id) return;
        const data = await riskMitigationService.getById(id);
        setMitigation(data);
      } catch (error) {
        toast.error('Failed to fetch risk mitigation');
        navigate('/master/risk-mitigations');
      } finally {
        setIsLoading(false);
      }
    };

    fetchMitigation();
  }, [id, navigate]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex items-center gap-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading risk mitigation details...</span>
        </div>
      </div>
    );
  }

  if (!mitigation) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Risk Mitigation not found
        </h2>
        <p className="text-gray-600 mb-4">
          The risk mitigation you're looking for doesn't exist or has been deleted.
        </p>
        <Button onClick={() => navigate('/master/risk-mitigations')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Risk Mitigations
        </Button>
      </div>
    );
  }

  const Section = ({
    label,
    value,
    className,
  }: {
    label: string;
    value: string | null | undefined;
    className?: string;
  }) => (
    <div className={className}>
      <h3 className="text-sm font-medium text-muted-foreground">{label}</h3>
      <p className="mt-1 text-sm whitespace-pre-wrap">{value || '-'}</p>
    </div>
  );

  return (
    <>
      <PageHeader
        title="View Risk Mitigation"
        subtitle={`Risk: ${mitigation.risk?.name || mitigation.riskId}`}
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate('/master/risk-mitigations')}>
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to Risk Mitigations
            </Button>
            <Button onClick={() => navigate(`/master/risk-mitigations/${id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          </div>
        }
      />
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center">
              <Shield className="mr-2 h-5 w-5" /> Mitigation Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Risk</h3>
              <p className="mt-1 font-medium">
                {mitigation.risk?.name || mitigation.riskId}
                {mitigation.risk?.code && (
                  <span className="text-muted-foreground font-normal ml-2">({mitigation.risk.code})</span>
                )}
              </p>
            </div>
            <Section label="Elimination Control" value={mitigation.eliminationControl ?? undefined} />
            <Section label="Substitution Control" value={mitigation.substitutionControl ?? undefined} />
            <Section label="Engineering Control" value={mitigation.engineeringControl ?? undefined} />
            <Section label="Administration Control" value={mitigation.administrationControl ?? undefined} />
            <Section label="Personal Protective Equipment" value={mitigation.personalProtectiveEquipment ?? undefined} />
            <Section label="Transfer" value={mitigation.transfer ?? undefined} />
            <Section label="Accept" value={mitigation.accept ?? undefined} />
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Status</h3>
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className={
                    mitigation.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }
                >
                  {mitigation.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ViewRiskMitigationPage;
