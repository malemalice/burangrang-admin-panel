import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';

import { useRiskRegisterDetail } from '../hooks/useRiskRegister';
import { RiskRegisterSourceBadge } from '../components/RiskRegisterSourceBadge';

const ViewRiskRegisterPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: item, isLoading } = useRiskRegisterDetail(id || null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!item) {
    return null;
  }

  const isRiskAssessment = item.entity === 'RISK_ASSESSMENT_ITEM';
  const source = item.source;

  return (
    <>
      <PageHeader
        title="Risk Register Details"
        subtitle="View detailed information about this risk mitigation record"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate('/risk-register')}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Risk Register
          </Button>
        }
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Source Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Code</p>
                <p className="text-sm font-medium font-mono">
                  {item.code || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Source Type</p>
                <RiskRegisterSourceBadge entity={item.entity} />
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">
                  {isRiskAssessment ? 'Assessment Code' : 'Inspection Code'}
                </p>
                <p className="text-sm font-medium">
                  {'code' in source ? source.code : 'N/A'}
                </p>
              </div>
              {isRiskAssessment && 'assessmentDate' in source && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Assessment Date</p>
                  <p className="text-sm">
                    {format(new Date(source.assessmentDate), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              {!isRiskAssessment && 'inspectionDate' in source && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Inspection Date</p>
                  <p className="text-sm">
                    {format(new Date(source.inspectionDate), 'dd MMM yyyy')}
                  </p>
                </div>
              )}
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Department</p>
                <p className="text-sm">
                  {source.department?.name || 'N/A'}
                </p>
              </div>
              {isRiskAssessment && 'creator' in source && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Creator</p>
                  <p className="text-sm">
                    {source.creator
                      ? `${source.creator.firstName} ${source.creator.lastName}`
                      : 'N/A'}
                  </p>
                </div>
              )}
              {('assignee' in source && source.assignee) && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Assignee</p>
                  <p className="text-sm">
                    {source.assignee
                      ? `${source.assignee.firstName} ${source.assignee.lastName}`
                      : 'N/A'}
                  </p>
                </div>
              )}
              {!isRiskAssessment && 'area' in source && (
                <div className="space-y-1.5">
                  <p className="text-sm font-medium text-muted-foreground">Area</p>
                  <p className="text-sm">
                    {source.area?.name || 'N/A'}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk Category</p>
                <p className="text-sm">
                  {isRiskAssessment
                    ? source.riskAssessmentItem.mRiskCategory?.name || 'N/A'
                    : source.inspectionItem.riskCategory?.name || 'N/A'}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Risk</p>
                <p className="text-sm">
                  {isRiskAssessment
                    ? source.riskAssessmentItem.mRisk?.name || 'N/A'
                    : source.inspectionItem.risk?.name || 'N/A'}
                </p>
              </div>
              {isRiskAssessment && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Likelihood Level</p>
                    <p className="text-sm">{source.riskAssessmentItem.likelihoodLevel}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Consequence Level</p>
                    <p className="text-sm">{source.riskAssessmentItem.consequenceLevel}</p>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Risk Rating</p>
                    <Badge variant="outline">{source.riskAssessmentItem.riskMatrixRating}</Badge>
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Interpretation</p>
                    <Badge variant="outline">{source.riskAssessmentItem.interpretation}</Badge>
                  </div>
                </>
              )}
              {!isRiskAssessment && (
                <>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium text-muted-foreground">Status</p>
                    <Badge variant="outline">{source.inspectionItem.status}</Badge>
                  </div>
                  {source.inspectionItem.findings && (
                    <div className="space-y-1.5 md:col-span-2">
                      <p className="text-sm font-medium text-muted-foreground">Findings</p>
                      <p className="text-sm whitespace-pre-wrap">{source.inspectionItem.findings}</p>
                    </div>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mitigation Strategies</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {item.eliminate && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Eliminate</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.eliminate}</p>
              </div>
            )}
            {item.transfer && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Transfer</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.transfer}</p>
              </div>
            )}
            {item.reduce && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Reduce</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.reduce}</p>
              </div>
            )}
            {item.accept && (
              <div>
                <h4 className="text-sm font-semibold mb-2">Accept</h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.accept}</p>
              </div>
            )}
            {!item.eliminate && !item.transfer && !item.reduce && !item.accept && (
              <p className="text-sm text-muted-foreground">No mitigation strategies defined</p>
            )}
          </CardContent>
        </Card>

        {item.legalAspect && (
          <Card>
            <CardHeader>
              <CardTitle>Legal Aspect</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm whitespace-pre-wrap">{item.legalAspect}</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Created At</p>
                <p className="text-sm">
                  {format(new Date(item.createdAt), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Updated At</p>
                <p className="text-sm">
                  {format(new Date(item.updatedAt), 'dd MMM yyyy HH:mm')}
                </p>
              </div>
              <div className="space-y-1.5">
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <Badge variant={item.isActive ? 'default' : 'secondary'}>
                  {item.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ViewRiskRegisterPage;
