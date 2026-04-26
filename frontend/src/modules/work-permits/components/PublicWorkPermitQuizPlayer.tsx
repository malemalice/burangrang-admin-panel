import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { ArrowLeft, ArrowRight, Clock, Send } from 'lucide-react';
import { detectMediaType, getYoutubeEmbedUrl } from '@/core/lib/media-utils';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import publicWorkPermitCourseService from '../services/publicWorkPermitCourseService';
import { Quiz, QuizAttempt, SubmitAnswerDTO } from '@/modules/quizzes/types/quiz.types';
import {
  canRetakeQuiz,
  getLatestAttempt,
  mergeAttemptHistory,
} from '@/modules/courses/components/QuizPlayer';

type Props = {
  permitToken: string;
  courseId: string;
  quizId: string;
  /** Quiz row from public learning context (for titles before attempt starts). */
  quizMeta?: Quiz;
  onComplete?: () => void;
};

const PublicWorkPermitQuizPlayer = ({
  permitToken,
  courseId,
  quizId,
  quizMeta,
  onComplete,
}: Props) => {
  const [attempt, setAttempt] = useState<QuizAttempt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<SubmitAnswerDTO>>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([]);
  const hasAutoSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const submitAnswer = useCallback(
    async (attemptId: string, answerData: SubmitAnswerDTO) => {
      const normalized = { ...answerData };
      if (answerData.essayAnswer !== undefined) {
        normalized.essayAnswer = answerData.essayAnswer || '';
      }
      const answer = await publicWorkPermitCourseService.submitAnswer(
        permitToken,
        courseId,
        attemptId,
        normalized,
      );
      if (attempt) {
        const updatedAnswers = attempt.answers || [];
        const existingIndex = updatedAnswers.findIndex((a) => a.questionId === answerData.questionId);
        if (existingIndex >= 0) {
          updatedAnswers[existingIndex] = answer;
        } else {
          updatedAnswers.push(answer);
        }
        setAttempt({ ...attempt, answers: updatedAnswers });
      }
      return answer;
    },
    [attempt, permitToken, courseId],
  );

  const submitAttempt = useCallback(
    async (attemptId: string) => {
      setIsLoading(true);
      try {
        const completed = await publicWorkPermitCourseService.submitAttempt(
          permitToken,
          courseId,
          attemptId,
        );
        setAttempt(completed);
        toast.success('Quiz submitted successfully');
        return completed;
      } finally {
        setIsLoading(false);
      }
    },
    [permitToken, courseId],
  );

  const handleSubmitAttempt = useCallback(async () => {
    if (!attempt) return;
    try {
      const completed = await submitAttempt(attempt.id);
      setAttemptHistory((prev) => mergeAttemptHistory(prev, completed));
      if (onComplete) onComplete();
    } catch (e) {
      console.error(e);
    }
  }, [attempt, submitAttempt, onComplete]);

  useEffect(() => {
    if (attempt && attempt.answers && attempt.status === 'IN_PROGRESS') {
      const saved: Record<string, Partial<SubmitAnswerDTO>> = {};
      attempt.answers.forEach((a) => {
        saved[a.questionId] = {
          questionId: a.questionId,
          selectedOptionId: a.selectedOptionId,
          essayAnswer: a.essayAnswer,
        };
      });
      setAnswers(saved);
    }
  }, [attempt]);

  useEffect(() => {
    if (!quizId) return;
    const init = async () => {
      setIsLoading(true);
      hasAutoSubmittedRef.current = false;
      try {
        const existing = await publicWorkPermitCourseService.getCurrentAttempt(
          permitToken,
          courseId,
          quizId,
        );
        if (existing) {
          setAttemptHistory((prev) => mergeAttemptHistory(prev, existing));
          if (existing.status === 'IN_PROGRESS') {
            setAttempt(existing);
            if (existing.quiz?.duration) {
              const startTime = new Date(existing.startedAt).getTime();
              const now = Date.now();
              const elapsed = Math.floor((now - startTime) / 1000);
              const rem = existing.quiz.duration * 60 - elapsed;
              setTimeRemaining(Math.max(0, rem));
            }
            return;
          }
          if (existing.status === 'COMPLETED' || existing.status === 'ABANDONED') {
            setAttempt(existing);
          }
        }
      } catch (e) {
        console.error(e);
        toast.error('Failed to load quiz');
      } finally {
        setIsLoading(false);
      }
    };
    void init();
  }, [permitToken, courseId, quizId]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const t = setInterval(() => {
        setTimeRemaining((prev) => (prev === null || prev <= 1 ? 0 : prev - 1));
      }, 1000);
      return () => clearInterval(t);
    }
    if (timeRemaining === 0 && attempt?.status === 'IN_PROGRESS' && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      void handleSubmitAttempt();
    }
  }, [timeRemaining, attempt?.status, handleSubmitAttempt]);

  const displayQuiz: Quiz | undefined = attempt?.quiz || quizMeta;
  const latestAttempt = getLatestAttempt(attemptHistory);
  const canRetake = canRetakeQuiz(displayQuiz?.maxAttempts, latestAttempt);

  const handleStart = async () => {
    if (!quizId) return;
    try {
      setIsLoading(true);
      const newAttempt = await publicWorkPermitCourseService.startAttempt(
        permitToken,
        courseId,
        quizId,
      );
      setAttempt(newAttempt);
      setAttemptHistory((prev) => mergeAttemptHistory(prev, newAttempt));
      setAnswers({});
      setCurrentQuestionIndex(0);
      hasAutoSubmittedRef.current = false;
      if (newAttempt.quiz?.duration) {
        setTimeRemaining(newAttempt.quiz.duration * 60);
      } else {
        setTimeRemaining(null);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || 'Failed to start quiz';
      toast.error(String(msg));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerChange = async (questionId: string, answer: SubmitAnswerDTO) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));
    if (!attempt) return;
    const qz = attempt.quiz || displayQuiz;
    const question = qz?.questions?.find((q) => q.id === questionId);
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    if (question?.questionType === 'ESSAY') {
      saveTimeoutRef.current = setTimeout(() => {
        void submitAnswer(attempt.id, answer).catch((e) => console.error(e));
      }, 800);
    } else {
      try {
        await submitAnswer(attempt.id, answer);
      } catch (e) {
        console.error(e);
      }
    }
  };

  if (isLoading && !attempt) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!attempt && !isLoading) {
    return (
      <div className="flex flex-col items-center p-6 space-y-4">
        <h3 className="text-xl font-semibold">{displayQuiz?.title || 'Quiz'}</h3>
        <p className="text-sm text-muted-foreground text-center max-w-md">
          {displayQuiz?.description}
        </p>
        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-3 text-sm">
            {displayQuiz?.duration != null && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration</span>
                <span className="font-medium">{displayQuiz.duration} mins</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passing</span>
              <span className="font-medium">{displayQuiz?.passingScore ?? '—'}%</span>
            </div>
            <Button className="w-full mt-2" onClick={handleStart} disabled={!canRetake || isLoading}>
              {latestAttempt ? 'Retake quiz' : 'Start quiz'}
            </Button>
            {!canRetake ? (
              <p className="text-center text-xs text-muted-foreground">Maximum attempts reached.</p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (attempt?.status === 'COMPLETED' || attempt?.status === 'ABANDONED') {
    const isPassed = attempt.isPassed;
    return (
      <div className="flex flex-col items-center p-6 space-y-4 text-center">
        <Badge
          className={
            isPassed
              ? 'bg-primary/10 text-primary hover:bg-primary/10'
              : 'bg-destructive/10 text-destructive hover:bg-destructive/10'
          }
        >
          {isPassed ? 'Passed' : 'Not passed'}
        </Badge>
        <p className="text-sm text-muted-foreground">
          Score: {attempt.score != null ? `${attempt.score}%` : '—'} (
          {attempt.earnedPoints ?? 0}/{attempt.totalPoints ?? 0} pts)
        </p>
        {canRetake ? (
          <Button variant="outline" onClick={handleStart}>
            Retake
          </Button>
        ) : null}
        {onComplete ? (
          <Button onClick={onComplete} variant="secondary">
            Continue
          </Button>
        ) : null}
      </div>
    );
  }

  const qForRender = (attempt?.quiz || displayQuiz) as Quiz;
  if (!qForRender?.questions?.length) {
    return <p className="p-4 text-sm text-muted-foreground">No questions in this quiz.</p>;
  }

  const currentQuestion = qForRender.questions[currentQuestionIndex];
  const currentAnswer = (answers[currentQuestion.id] || {}) as Partial<SubmitAnswerDTO>;
  const totalQuestions = qForRender.questions.length;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-4 max-w-3xl mx-auto">
      <Card>
        <CardHeader className="py-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="font-semibold">{qForRender.title}</h3>
              <p className="text-xs text-muted-foreground">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            {timeRemaining !== null && timeRemaining > 0 ? (
              <div className="flex items-center gap-1 font-mono text-sm bg-muted px-2 py-1 rounded">
                <Clock className="h-3 w-3" />
                <span className={timeRemaining < 60 ? 'text-destructive' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            ) : null}
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-2">
            <p className="text-sm font-medium whitespace-pre-wrap">{currentQuestion.questionText}</p>
            <Badge variant="outline" className="shrink-0">
              {currentQuestion.points} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentQuestion.mediaUrl ? (
            (() => {
              const mediaType = detectMediaType(
                currentQuestion.mediaUrl,
                currentQuestion.mediaType,
              );
              if (mediaType === 'youtube') {
                const emb = getYoutubeEmbedUrl(currentQuestion.mediaUrl);
                if (emb) {
                  return (
                    <div className="rounded-lg border overflow-hidden aspect-video bg-black">
                      <iframe
                        width="100%"
                        height="100%"
                        src={emb}
                        title="Media"
                        className="w-full h-full"
                      />
                    </div>
                  );
                }
              }
              if (mediaType === 'video') {
                return (
                  <div className="rounded-lg border overflow-hidden">
                    <video
                      src={currentQuestion.mediaUrl}
                      controls
                      className="w-full max-h-64"
                    />
                  </div>
                );
              }
              return null;
            })()
          ) : null}

          {currentQuestion.questionType === 'MULTIPLE_CHOICE' ||
          currentQuestion.questionType === 'TRUE_FALSE' ? (
            <RadioGroup
              value={currentAnswer.selectedOptionId || ''}
              onValueChange={(val) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  selectedOptionId: val,
                })
              }
              className="space-y-2"
            >
              {currentQuestion.options?.map((opt) => (
                <div
                  key={opt.id}
                  className="flex items-center space-x-2 border rounded-lg p-2 hover:bg-muted/50"
                >
                  <RadioGroupItem value={opt.id} id={opt.id} />
                  <Label htmlFor={opt.id} className="flex-1 cursor-pointer text-sm">
                    {opt.optionText}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          ) : (
            <Textarea
              value={currentAnswer.essayAnswer || ''}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  essayAnswer: e.target.value,
                })
              }
              className="min-h-[120px]"
            />
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setCurrentQuestionIndex((i) => Math.max(0, i - 1))}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="h-3 w-3 mr-1" /> Prev
        </Button>
        {currentQuestionIndex === totalQuestions - 1 ? (
          <Button type="button" size="sm" onClick={() => setSubmitDialogOpen(true)}>
            Submit <Send className="h-3 w-3 ml-1" />
          </Button>
        ) : (
          <Button
            type="button"
            size="sm"
            onClick={() => setCurrentQuestionIndex((i) => i + 1)}
          >
            Next <ArrowRight className="h-3 w-3 ml-1" />
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onConfirm={() => {
          setSubmitDialogOpen(false);
          void handleSubmitAttempt();
        }}
        title="Submit quiz"
        description="Finish this quiz? You can continue the course after submission."
      />
    </div>
  );
};

export default PublicWorkPermitQuizPlayer;
