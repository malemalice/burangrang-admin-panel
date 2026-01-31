import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import PageHeader from '@/core/components/ui/PageHeader';

import { useRiskRegisterDetail } from '../hooks/useRiskRegister';
import { RiskRegisterSourceBadge } from '../components/RiskRegisterSourceBadge';
import { getRiskRegisterStatusLabel } from '../utils/riskRegisterStatus';

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div className="space-y-1.5">
    <p className="text-sm font-medium text-muted-foreground">{label}</p>
    <div className="text-sm">{value ?? '—'}</div>
  </div>
);

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
  const statusLabel = isRiskAssessment
    ? getRiskRegisterStatusLabel('status' in source ? source.status : 'OPEN')
    : getRiskRegisterStatusLabel(source.inspectionItem.status);

  return (
    <>
      <PageHeader
        title="Risk Register Details"
        subtitle="View detailed information about this risk mitigation record"
        actions={
          <Button
            variant="outline"
            onClick={() => navigate(-1)}
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
                <Badge
                  variant={
                    statusLabel === 'Open'
                      ? 'default'
                      : statusLabel === 'Close'
                        ? 'secondary'
                        : 'outline'
                  }
                >
                  {statusLabel}
                </Badge>
              </div>
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
                    <Badge variant="outline">{statusLabel}</Badge>
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
            <CardTitle>Risk Mitigation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <h4 className="text-sm font-semibold mb-2">Eliminate</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.eliminate ?? '—'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Transfer</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.transfer ?? '—'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Reduce</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.reduce ?? '—'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Accept</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.accept ?? '—'}</p>
            </div>
            <div>
              <h4 className="text-sm font-semibold mb-2">Legal Aspect</h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{item.legalAspect ?? '—'}</p>
            </div>
          </CardContent>
        </Card>


        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle>{isRiskAssessment ? 'Risk Assessment Item' : 'Inspection Item'}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                isRiskAssessment && 'riskAssessmentId' in source
                  ? navigate(`/risk-assessment/${source.riskAssessmentId}`)
                  : navigate(`/inspections/items/${item.entityId}`)
              }
            >
              <ExternalLink className="mr-2 h-4 w-4" />
              View {isRiskAssessment ? 'Risk Assessment' : 'Inspection Item'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-6">
            {isRiskAssessment && 'riskAssessmentItem' in source && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Field label="Status" value={<Badge variant="outline">{statusLabel}</Badge>} />
                <Field label="Entity ID" value={source.riskAssessmentItem.id} />
                <Field label="Risk" value={source.riskAssessmentItem.mRisk?.name} />
                <Field label="Risk Category" value={source.riskAssessmentItem.mRiskCategory?.name} />
                <Field label="Likelihood Level" value={source.riskAssessmentItem.likelihoodLevel} />
                <Field label="Consequence Level" value={source.riskAssessmentItem.consequenceLevel} />
                <Field label="Risk Matrix Rating" value={source.riskAssessmentItem.riskMatrixRating} />
                <Field label="Interpretation" value={<Badge variant="outline">{source.riskAssessmentItem.interpretation}</Badge>} />
                <Field label="Post Likelihood Level" value={source.riskAssessmentItem.postLikelihoodLevel} />
                <Field label="Post Consequence Level" value={source.riskAssessmentItem.postConsequenceLevel} />
                <Field label="Post Risk Matrix Rating" value={source.riskAssessmentItem.postRiskMatrixRating} />
                <Field label="Post Interpretation" value={<Badge variant="outline">{source.riskAssessmentItem.postInterpretation}</Badge>} />
              </div>
            )}
            {!isRiskAssessment && 'inspectionItem' in source && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field label="Entity ID" value={source.inspectionItem.id} />
                  <Field label="Risk" value={source.inspectionItem.risk?.name} />
                  <Field label="Risk Category" value={source.inspectionItem.riskCategory?.name} />
                  <Field label="Status" value={<Badge variant="outline">{statusLabel}</Badge>} />
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Findings</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{source.inspectionItem.findings ?? '—'}</p>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{source.inspectionItem.description ?? '—'}</p>
                  </div>
                  <div className="space-y-1.5 md:col-span-2">
                    <p className="text-sm font-medium text-muted-foreground">Follow-up Notes</p>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{source.inspectionItem.followUpNotes ?? '—'}</p>
                  </div>
                </div>
                {(source.inspectionItem.images?.length ?? 0) > 0 && (
                  <div className="space-y-3">
                    <p className="text-sm font-semibold">Images</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {(source.inspectionItem.images ?? []).map((img) => (
                        <div key={img.id} className="rounded-lg border overflow-hidden bg-muted/50">
                          <a href={img.imageUrl} target="_blank" rel="noopener noreferrer" className="block aspect-video">
                            <img src={img.imageUrl} alt={img.caption || `Image ${img.type}`} className="w-full h-full object-cover" />
                          </a>
                          <div className="p-2 space-y-1">
                            <Badge variant="secondary" className="text-xs">{img.type}</Badge>
                            {img.caption && <p className="text-xs text-muted-foreground line-clamp-2">{img.caption}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ViewRiskRegisterPage;
