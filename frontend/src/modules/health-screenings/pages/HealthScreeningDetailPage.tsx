import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, CheckCircle2, ClipboardList, Play } from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import { Separator } from '@/core/components/ui/separator';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useAuth } from '@/core/lib/auth';
import type { QuizAnswer, QuestionType } from '@/modules/quizzes/types/quiz.types';
import healthScreeningService from '../services/healthScreeningService';
import type { HealthScreeningDetailView } from '../types/healthScreening.types';
import { HEALTH_DECLARATION_TERMS } from '../constants/declarationTerms';

function answerSummary(questionType: QuestionType, answer: QuizAnswer | undefined): string {
  if (!answer) return 'Not answered';
  if (questionType === 'ESSAY') {
    const t = answer.essayAnswer?.trim();
    return t ? t : 'Not answered';
  }
  return answer.selectedOption?.optionText ?? 'Not answered';
}

const HealthScreeningDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { hasPermission } = usePermissions();
  const [data, setData] = useState<HealthScreeningDetailView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const d = await healthScreeningService.getById(id);
        if (!cancelled) setData(d);
      } catch (e) {
        toast.error(e instanceof Error ? e.message : 'Failed to load');
        navigate('/health-screenings');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, navigate]);

  const questionsOrdered = useMemo(() => {
    const qs = data?.quiz?.questions ?? [];
    return [...qs].sort((a, b) => a.order - b.order);
  }, [data?.quiz?.questions]);

  const answersByQuestionId = useMemo(() => {
    const map = new Map<string, QuizAnswer>();
    for (const a of data?.quizAttempt?.answers ?? []) {
      map.set(a.questionId, a);
    }
    return map;
  }, [data?.quizAttempt?.answers]);

  if (loading || !data) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  const isOwner = data.userId === user?.id;
  const canContinue =
    data.status === 'IN_PROGRESS' &&
    isOwner &&
    hasPermission('health-screening:submit');

  const subtitleParts = [
    data.quiz?.title,
    data.createdAt ? `Started ${new Date(data.createdAt).toLocaleString()}` : null,
  ].filter(Boolean);

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Health declaration"
        subtitle={
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <ClipboardList className="h-4 w-4 shrink-0 text-muted-foreground" />
            {subtitleParts.join(' · ')}
          </span>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => navigate('/health-screenings')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to list
            </Button>
            {canContinue && (
              <Button onClick={() => navigate(`/health-screenings/${data.id}/fill`)}>
                <Play className="mr-2 h-4 w-4" />
                Continue
              </Button>
            )}
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Status</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">State</span>
            <Badge
              variant={
                data.status === 'DONE'
                  ? 'default'
                  : data.status === 'EXPIRED'
                    ? 'destructive'
                    : 'secondary'
              }
            >
              {data.status === 'IN_PROGRESS'
                ? 'In progress'
                : data.status === 'DONE'
                  ? 'Done'
                  : 'Expired'}
            </Badge>
          </div>
          {data.validUntil && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Valid until</span>
              <span>{new Date(data.validUntil).toLocaleString()}</span>
            </div>
          )}
          {data.user && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Person</span>
              <span>
                {data.user.firstName} {data.user.lastName} ({data.user.email})
              </span>
            </div>
          )}
          {data.workPermitWorker?.workPermit && (
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Work permit</span>
              <span>{data.workPermitWorker.workPermit.code}</span>
            </div>
          )}
        </CardContent>
      </Card>

      {data.declarationTermsAcceptedAt && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Declaration confirmation</CardTitle>
            <p className="text-sm text-muted-foreground font-normal">
              The submitter confirmed the statements below on{' '}
              {new Date(data.declarationTermsAcceptedAt).toLocaleString()}.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {HEALTH_DECLARATION_TERMS.map((term) => (
              <div key={term.id} className="flex gap-3 items-start">
                <CheckCircle2
                  className="h-5 w-5 shrink-0 text-primary mt-0.5"
                  aria-hidden
                />
                <p className="text-sm leading-relaxed">
                  <span>{term.en} </span>
                  <span className="text-muted-foreground">({term.idLang})</span>
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Responses</CardTitle>
          <p className="text-sm text-muted-foreground font-normal">
            Questions and answers recorded for this declaration.
          </p>
        </CardHeader>
        <CardContent className="space-y-0">
          {questionsOrdered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No questions in this questionnaire.</p>
          ) : (
            questionsOrdered.map((q, idx) => {
              const answer = answersByQuestionId.get(q.id);
              const summary = answerSummary(q.questionType, answer);
              const isEssay = q.questionType === 'ESSAY';

              return (
                <div key={q.id}>
                  {idx > 0 && <Separator className="my-4" />}
                  <div className="space-y-2">
                    <p className="text-sm font-medium leading-snug">
                      <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                      {q.questionText}
                    </p>
                    {isEssay ? (
                      <p className="text-sm text-muted-foreground whitespace-pre-wrap pl-6">
                        {summary}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground pl-6">{summary}</p>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default HealthScreeningDetailPage;
