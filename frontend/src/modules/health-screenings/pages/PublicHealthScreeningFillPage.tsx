import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'sonner';
import axios from 'axios';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock, Send } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Checkbox } from '@/core/components/ui/checkbox';
import { Separator } from '@/core/components/ui/separator';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import healthScreeningService from '../services/healthScreeningService';
import type { HealthScreeningDetailView } from '../types/healthScreening.types';
import type { SubmitAnswerDTO } from '@/modules/quizzes/types/quiz.types';
import type { QuizQuestion } from '@/modules/quizzes/types/quiz.types';
import { HEALTH_DECLARATION_TERMS } from '../constants/declarationTerms';

function getErrorMessage(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const data = e.response?.data as { message?: string | string[] } | undefined;
    const m = data?.message;
    if (Array.isArray(m)) return m.join(', ');
    if (typeof m === 'string') return m;
  }
  if (e instanceof Error) return e.message;
  return 'Something went wrong';
}

const PublicHealthScreeningFillPage = () => {
  const { token: tokenParam } = useParams<{ token: string }>();
  const token = tokenParam ? decodeURIComponent(tokenParam) : '';

  const [screening, setScreening] = useState<HealthScreeningDetailView | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submittedDone, setSubmittedDone] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<SubmitAnswerDTO>>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [ackTruth, setAckTruth] = useState(false);
  const [ackDiscipline, setAckDiscipline] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  const load = useCallback(async () => {
    if (!token) {
      setLoadError('Invalid link');
      setLoading(false);
      return;
    }
    setLoading(true);
    setLoadError(null);
    try {
      const d = await healthScreeningService.getPublicByToken(token);
      setScreening(d);
      if (d.status !== 'IN_PROGRESS') {
        setLoadError('This declaration is no longer editable.');
        return;
      }
      const att = d.quizAttempt;
      if (att.answers && att.status === 'IN_PROGRESS') {
        const saved: Record<string, Partial<SubmitAnswerDTO>> = {};
        att.answers.forEach((a) => {
          saved[a.questionId] = {
            questionId: a.questionId,
            selectedOptionId: a.selectedOptionId,
            essayAnswer: a.essayAnswer,
          };
        });
        setAnswers(saved);
      }
      const dur = d.quiz?.duration;
      if (dur && dur > 0 && att.startedAt) {
        const start = new Date(att.startedAt).getTime();
        const elapsed = Math.floor((Date.now() - start) / 1000);
        setTimeRemaining(Math.max(0, dur * 60 - elapsed));
      } else {
        setTimeRemaining(null);
      }
    } catch (e) {
      const msg = getErrorMessage(e);
      setLoadError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (timeRemaining === null || timeRemaining <= 0) return;
    const t = setInterval(() => {
      setTimeRemaining((prev) => (prev === null ? null : Math.max(0, prev - 1)));
    }, 1000);
    return () => clearInterval(t);
  }, [timeRemaining]);

  const displayQuiz = screening?.quiz;
  const attemptId = screening?.quizAttempt?.id;

  const submitAnswerRemote = async (questionId: string, payload: SubmitAnswerDTO) => {
    if (!attemptId || !token) return;
    await healthScreeningService.submitPublicAnswer(token, payload);
  };

  const handleAnswerChange = async (questionId: string, answer: SubmitAnswerDTO) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (!attemptId) return;
    const q = displayQuiz?.questions?.find((x) => x.id === questionId);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (q?.questionType === 'ESSAY') {
      saveTimeoutRef.current = setTimeout(async () => {
        try {
          await submitAnswerRemote(questionId, answer);
        } catch (err) {
          console.error(err);
        }
      }, 800);
    } else {
      try {
        await submitAnswerRemote(questionId, answer);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleSubmit = async () => {
    if (!token) return;
    setSubmitting(true);
    try {
      await healthScreeningService.submitPublicAttempt(token, {
        ackTruth: true,
        ackDiscipline: true,
      });
      toast.success('Declaration submitted');
      setSubmittedDone(true);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      setSubmitting(false);
      setSubmitOpen(false);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (loadError || !screening || !displayQuiz) {
    return (
      <div className="container mx-auto max-w-lg py-16 px-4">
        <Card>
          <CardHeader>
            <CardTitle>Link unavailable</CardTitle>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm">
            {loadError ||
              'This link is invalid or has expired. Please contact your supervisor for a new link.'}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submittedDone) {
    return (
      <div className="container mx-auto max-w-lg py-16 px-4">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
              <CardTitle>Thank you</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="text-muted-foreground text-sm space-y-2">
            <p>Your health declaration has been submitted successfully.</p>
            <p>You can close this page.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!displayQuiz.questions?.length) {
    return (
      <div className="container max-w-4xl py-8">
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">No questions in this template.</CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = displayQuiz.questions[currentQuestionIndex] as QuizQuestion;
  const currentAnswer = (answers[currentQuestion.id] || {}) as Partial<SubmitAnswerDTO>;
  const totalQuestions = displayQuiz.questions.length;
  const answeredCount = Object.keys(answers).length;
  const isLastQuestion = currentQuestionIndex === totalQuestions - 1;
  const declarationsComplete = ackTruth && ackDiscipline;

  const participant = screening.user;
  const fullName = participant
    ? [participant.firstName, participant.lastName].filter(Boolean).join(' ').trim()
    : '';
  const emDash = '—';

  return (
    <div className="container mx-auto py-6 max-w-4xl px-4">
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Confirm who this declaration is for</CardTitle>
          <p className="text-sm text-muted-foreground font-normal mt-1">
            Check that the details match the person completing this form.
          </p>
        </CardHeader>
        <CardContent>
          <dl className="grid gap-3 sm:grid-cols-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium mt-0.5">{fullName || emDash}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd className="font-medium mt-0.5 break-all">{participant?.email?.trim() || emDash}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Profession</dt>
              <dd className="font-medium mt-0.5">{participant?.profession?.name?.trim() || emDash}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Company</dt>
              <dd className="font-medium mt-0.5">{screening.company?.name?.trim() || emDash}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>{displayQuiz.title}</CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            {timeRemaining !== null && timeRemaining > 0 && (
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <span className={`text-lg font-bold ${timeRemaining < 60 ? 'text-destructive' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              Answered: {answeredCount} / {totalQuestions}
            </span>
            <div className="w-32 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.max(0, (answeredCount / totalQuestions) * 100))}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Question {currentQuestionIndex + 1}</CardTitle>
            <Badge variant="outline">Declaration</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-base font-medium mb-2">{currentQuestion.questionText}</p>
            {currentQuestion.mediaUrl && (
              <div className="my-4">
                {currentQuestion.mediaType?.startsWith('image/') ? (
                  <img src={currentQuestion.mediaUrl} alt="" className="max-w-full rounded" />
                ) : currentQuestion.mediaType?.startsWith('video/') ? (
                  <video src={currentQuestion.mediaUrl} controls className="max-w-full rounded max-h-[400px]" />
                ) : (
                  <img src={currentQuestion.mediaUrl} alt="" className="max-w-full rounded" />
                )}
              </div>
            )}
          </div>
          <Separator />
          {currentQuestion.questionType === 'MULTIPLE_CHOICE' && (
            <RadioGroup
              value={currentAnswer.selectedOptionId || ''}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  selectedOptionId: value,
                })
              }
            >
              {currentQuestion.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {currentQuestion.questionType === 'TRUE_FALSE' && (
            <RadioGroup
              value={currentAnswer.selectedOptionId || ''}
              onValueChange={(value) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  selectedOptionId: value,
                })
              }
            >
              {currentQuestion.options?.map((option) => (
                <div key={option.id} className="flex items-center space-x-2 p-3 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem value={option.id} id={option.id} />
                  <Label htmlFor={option.id} className="flex-1 cursor-pointer">
                    {option.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          )}
          {currentQuestion.questionType === 'ESSAY' && (
            <Textarea
              placeholder="Your answer (optional)"
              className="min-h-[200px]"
              value={currentAnswer.essayAnswer || ''}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  essayAnswer: e.target.value,
                })
              }
            />
          )}
        </CardContent>
      </Card>

      {isLastQuestion && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Declaration confirmation</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3 items-start">
              <Checkbox
                id="public-health-screening-ack-truth"
                checked={ackTruth}
                onCheckedChange={(v) => setAckTruth(v === true)}
                className="mt-1"
              />
              <Label htmlFor="public-health-screening-ack-truth" className="text-sm font-normal leading-relaxed cursor-pointer">
                <span>
                  {HEALTH_DECLARATION_TERMS[0].en}{' '}
                  <span className="text-muted-foreground block sm:inline">
                    ({HEALTH_DECLARATION_TERMS[0].idLang})
                  </span>
                </span>
              </Label>
            </div>
            <div className="flex gap-3 items-start">
              <Checkbox
                id="public-health-screening-ack-discipline"
                checked={ackDiscipline}
                onCheckedChange={(v) => setAckDiscipline(v === true)}
                className="mt-1"
              />
              <Label htmlFor="public-health-screening-ack-discipline" className="text-sm font-normal leading-relaxed cursor-pointer">
                <span>
                  {HEALTH_DECLARATION_TERMS[1].en}{' '}
                  <span className="text-muted-foreground block sm:inline">
                    ({HEALTH_DECLARATION_TERMS[1].idLang})
                  </span>
                </span>
              </Label>
            </div>
            {!declarationsComplete && (
              <p className="text-sm text-muted-foreground">Please confirm both statements to submit.</p>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>
        <div className="flex gap-2">
          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button onClick={() => setSubmitOpen(true)} disabled={submitting || !declarationsComplete}>
              <Send className="mr-2 h-4 w-4" />
              Submit declaration
            </Button>
          ) : (
            <Button onClick={() => setCurrentQuestionIndex((i) => Math.min(totalQuestions - 1, i + 1))}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={submitOpen}
        onOpenChange={setSubmitOpen}
        onConfirm={handleSubmit}
        title="Submit declaration"
        description="You have confirmed the statements above. You will not be able to change answers after submission."
        confirmText="Submit"
      />
    </div>
  );
};

export default PublicHealthScreeningFillPage;
