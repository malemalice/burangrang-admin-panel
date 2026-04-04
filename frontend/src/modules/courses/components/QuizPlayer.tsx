import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Save,
  Send,
} from 'lucide-react';
import { detectMediaType, getYoutubeEmbedUrl } from '@/core/lib/media-utils';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { useQuizAttempt } from '@/modules/quizzes/hooks/useQuizAttempt';
import { useQuiz } from '@/modules/quizzes/hooks/useQuizzes';
import { QuizAttempt, SubmitAnswerDTO } from '@/modules/quizzes/types/quiz.types';
import quizService from '@/modules/quizzes/services/quizService';

interface QuizPlayerProps {
  quizId: string;
  enrollmentId: string;
  onComplete?: () => void;
}

type QuizAttemptLike = Pick<
  QuizAttempt,
  'attemptNumber' | 'status' | 'score' | 'earnedPoints' | 'totalPoints' | 'isPassed'
>;

const getLatestAttempt = <T extends QuizAttemptLike>(attempts: T[]): T | null => {
  if (attempts.length === 0) {
    return null;
  }

  return attempts.reduce((latest, current) => {
    if (current.attemptNumber > latest.attemptNumber) {
      return current;
    }

    return latest;
  });
};

const canRetakeQuiz = (
  quizMaxAttempts: number | undefined,
  latestAttempt: QuizAttemptLike | null,
): boolean => {
  if (!latestAttempt) {
    return true;
  }

  if (latestAttempt.status === 'IN_PROGRESS') {
    return false;
  }

  if (!quizMaxAttempts || quizMaxAttempts <= 0) {
    return true;
  }

  return latestAttempt.attemptNumber < quizMaxAttempts;
};

const mergeAttemptHistory = (attempts: QuizAttempt[], nextAttempt: QuizAttempt): QuizAttempt[] => {
  const next = attempts.filter((item) => item.id !== nextAttempt.id);
  return [nextAttempt, ...next];
};

const QuizPlayer = ({ quizId, enrollmentId, onComplete }: QuizPlayerProps) => {
  const { quiz, isLoading: quizLoading } = useQuiz(quizId);
  const { attempt, setAttempt, startAttempt, submitAnswer, submitAttempt, isLoading } = useQuizAttempt(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<SubmitAnswerDTO>>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [attemptHistory, setAttemptHistory] = useState<QuizAttempt[]>([]);

  const hasAutoSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (attempt && attempt.answers && attempt.status === 'IN_PROGRESS') {
      const savedAnswers: Record<string, Partial<SubmitAnswerDTO>> = {};
      attempt.answers.forEach((answer) => {
        savedAnswers[answer.questionId] = {
          questionId: answer.questionId,
          selectedOptionId: answer.selectedOptionId,
          essayAnswer: answer.essayAnswer,
        };
      });
      setAnswers(savedAnswers);
    }
  }, [attempt]);

  useEffect(() => {
    if (attempt?.id && attempt.status === 'IN_PROGRESS') {
      const savedAnswersStr = localStorage.getItem(`quiz_answers_${attempt.id}`);
      if (savedAnswersStr && Object.keys(answers).length === 0) {
        try {
          const savedAnswers = JSON.parse(savedAnswersStr);
          setAnswers(savedAnswers);
        } catch (e) {
          console.error('Failed to parse saved answers:', e);
        }
      }
    }

    if (attempt?.status === 'COMPLETED' && attempt?.id) {
      localStorage.removeItem(`quiz_answers_${attempt.id}`);
    }
  }, [attempt?.id, attempt?.status, answers]);

  useEffect(() => {
    if (attempt?.id && Object.keys(answers).length > 0) {
      localStorage.setItem(`quiz_answers_${attempt.id}`, JSON.stringify(answers));
    }
  }, [answers, attempt?.id]);

  useEffect(() => {
    if (!quiz || attempt || isLoading) {
      return;
    }

    const initializeAttempt = async () => {
      try {
        const existingAttempt = await quizService.getCurrentAttempt(quiz.id, enrollmentId);

        if (existingAttempt) {
          setAttemptHistory((prev) => mergeAttemptHistory(prev, existingAttempt));

          if (existingAttempt.status === 'IN_PROGRESS') {
            setAttempt(existingAttempt);
            if (existingAttempt.quiz?.duration) {
              const startTime = new Date(existingAttempt.startedAt).getTime();
              const now = Date.now();
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              const remainingSeconds = existingAttempt.quiz.duration * 60 - elapsedSeconds;
              setTimeRemaining(Math.max(0, remainingSeconds));
            }
            return;
          }

          if (existingAttempt.status === 'COMPLETED' || existingAttempt.status === 'ABANDONED') {
            setAttempt(existingAttempt);
          }
        }
      } catch (error) {
        console.error('Failed to initialize quiz:', error);
        toast.error('Failed to load quiz attempt');
      }
    };

    initializeAttempt();
  }, [quiz, enrollmentId, attempt, isLoading, setAttempt]);

  const latestAttempt = getLatestAttempt(attemptHistory);
  const canRetake = canRetakeQuiz(quiz?.maxAttempts, latestAttempt);

  const handleStartNewAttempt = async () => {
    if (!quiz) return;

    try {
      const newAttempt = await startAttempt(quiz.id, { enrollmentId });
      setAttemptHistory((prev) => mergeAttemptHistory(prev, newAttempt));
      setAnswers({});
      setCurrentQuestionIndex(0);
      hasAutoSubmittedRef.current = false;

      if (newAttempt.quiz?.duration) {
        setTimeRemaining(newAttempt.quiz.duration * 60);
      } else {
        setTimeRemaining(null);
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.message || error?.message || 'Failed to start quiz';
      toast.error(errorMessage);
    }
  };

  const handleSubmitAttempt = useCallback(async () => {
    if (!attempt) return;

    try {
      const completedAttempt = await submitAttempt(attempt.id);
      setAttemptHistory((prev) => mergeAttemptHistory(prev, completedAttempt));
      if (onComplete) onComplete();
      toast.success('Quiz submitted successfully!');
    } catch {
      // Error handled in hook
    }
  }, [attempt, submitAttempt, onComplete]);

  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) return 0;
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }

    if (timeRemaining === 0 && attempt?.status === 'IN_PROGRESS' && !hasAutoSubmittedRef.current) {
      hasAutoSubmittedRef.current = true;
      handleSubmitAttempt();
    }
  }, [timeRemaining, attempt?.status, handleSubmitAttempt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = async (questionId: string, answer: SubmitAnswerDTO) => {
    setAnswers((prev) => ({ ...prev, [questionId]: answer }));

    if (attempt) {
      const displayQuiz = attempt.quiz || quiz;
      const question = displayQuiz?.questions?.find((item) => item.id === questionId);

      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);

      if (question?.questionType === 'ESSAY') {
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await submitAnswer(attempt.id, answer);
          } catch (e) {
            console.error(e);
          }
        }, 800);
      } else {
        try {
          await submitAnswer(attempt.id, answer);
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const handleNext = () => {
    const displayQuiz = attempt?.quiz || quiz;
    if (displayQuiz?.questions && currentQuestionIndex < displayQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  if (quizLoading || !quiz) {
    return (
      <div className="flex items-center justify-center p-10">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!attempt && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold">{quiz.title}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">{quiz.description}</p>
        </div>

        <Card className="w-full max-w-sm">
          <CardContent className="pt-6 space-y-4">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duration</span>
              <span className="font-medium">{quiz.duration ? `${quiz.duration} mins` : 'No limit'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Passing Score</span>
              <span className="font-medium">{quiz.passingScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Questions</span>
              <span className="font-medium">{quiz.questions?.length || 0}</span>
            </div>
            {quiz.maxAttempts ? (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Attempts</span>
                <span className="font-medium">{latestAttempt ? `${latestAttempt.attemptNumber} / ${quiz.maxAttempts}` : `0 / ${quiz.maxAttempts}`}</span>
              </div>
            ) : null}

            <Button className="w-full mt-4" onClick={handleStartNewAttempt} disabled={!canRetake}>
              {latestAttempt ? 'Retake Quiz' : 'Start Quiz'}
            </Button>
            {!canRetake ? (
              <p className="text-sm text-center text-muted-foreground">
                Maximum attempts reached for this quiz.
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading && !attempt) {
    return (
      <div className="flex items-center justify-center p-10">
        <p className="text-muted-foreground">Initializing quiz...</p>
      </div>
    );
  }

  if (attempt?.status === 'COMPLETED' || attempt?.status === 'ABANDONED') {
    const isPassed = attempt.isPassed;
    const latestAttemptNumber = latestAttempt?.attemptNumber ?? attempt.attemptNumber;
    const attemptLimitLabel = quiz.maxAttempts
      ? `${latestAttemptNumber} / ${quiz.maxAttempts}`
      : `${latestAttemptNumber}`;

    return (
      <div className="flex flex-col items-center justify-center p-10 space-y-6">
        <div className="text-center">
          <Badge className={`mb-4 px-4 py-1 text-lg ${isPassed ? 'bg-green-100 text-green-800 hover:bg-green-100' : 'bg-red-100 text-red-800 hover:bg-red-100'}`}>
            {isPassed ? 'PASSED' : 'FAILED'}
          </Badge>
          <h2 className="text-3xl font-bold mb-2">Quiz Completed</h2>
          <p className="text-muted-foreground">
            You scored {attempt.score}% ({attempt.earnedPoints}/{attempt.totalPoints} points)
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Attempt {attemptLimitLabel}</p>
        </div>

        <div className="flex gap-4">
          {canRetake ? (
            <Button variant="outline" onClick={handleStartNewAttempt}>
              Retake Quiz
            </Button>
          ) : null}
          {onComplete ? (
            <Button onClick={onComplete}>Continue Course</Button>
          ) : null}
        </div>
      </div>
    );
  }

  const displayQuiz = attempt?.quiz || quiz;
  if (!displayQuiz.questions || displayQuiz.questions.length === 0) {
    return <div className="p-10 text-center">No questions available.</div>;
  }

  const currentQuestion = displayQuiz.questions[currentQuestionIndex];
  const currentAnswer = (answers[currentQuestion.id] || {}) as Partial<SubmitAnswerDTO>;
  const totalQuestions = displayQuiz.questions.length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader className="py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-lg">{displayQuiz.title}</h3>
              <p className="text-sm text-muted-foreground">
                Question {currentQuestionIndex + 1} of {totalQuestions}
              </p>
            </div>
            {timeRemaining !== null && timeRemaining > 0 ? (
              <div className="flex items-center gap-2 font-mono text-lg bg-muted px-3 py-1 rounded">
                <Clock className="h-4 w-4" />
                <span className={timeRemaining < 60 ? 'text-destructive' : ''}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <div className="px-6 pb-2">
          <div className="h-1 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start gap-4">
            <div className="text-lg font-medium whitespace-pre-wrap">{currentQuestion.questionText}</div>
            <Badge variant="outline" className="shrink-0">
              {currentQuestion.points} pts
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {currentQuestion.mediaUrl && (() => {
            const mediaType = detectMediaType(currentQuestion.mediaUrl, currentQuestion.mediaType);

            if (mediaType === 'audio') {
              return (
                <div className="rounded-lg overflow-hidden border bg-muted/50 p-4">
                  <audio src={currentQuestion.mediaUrl} controls className="w-full" />
                </div>
              );
            }

            if (mediaType === 'video') {
              return (
                <div className="rounded-lg overflow-hidden border bg-black">
                  <video src={currentQuestion.mediaUrl} controls className="w-full max-h-64" />
                </div>
              );
            }

            if (mediaType === 'youtube') {
              const embedUrl = getYoutubeEmbedUrl(currentQuestion.mediaUrl);
              if (embedUrl) {
                return (
                  <div className="rounded-lg overflow-hidden border bg-black aspect-video">
                    <iframe
                      width="100%"
                      height="100%"
                      src={embedUrl}
                      title="Question Media"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                );
              }
            }

            return (
              <div className="rounded-lg overflow-hidden border bg-black/5 flex justify-center">
                <img src={currentQuestion.mediaUrl} alt="Question Media" className="max-h-64 object-contain" />
              </div>
            );
          })()}

          <div className="space-y-4">
            {currentQuestion.questionType === 'MULTIPLE_CHOICE' || currentQuestion.questionType === 'TRUE_FALSE' ? (
              <RadioGroup
                value={currentAnswer.selectedOptionId || ''}
                onValueChange={(val) =>
                  handleAnswerChange(currentQuestion.id, {
                    questionId: currentQuestion.id,
                    selectedOptionId: val,
                  })
                }
                className="space-y-3"
              >
                {currentQuestion.options?.map((opt) => (
                  <div key={opt.id} className="flex items-center space-x-2 border rounded-lg p-3 hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value={opt.id} id={opt.id} />
                    <Label htmlFor={opt.id} className="flex-1 cursor-pointer font-normal">
                      {opt.optionText}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            ) : (
              <Textarea
                placeholder="Type your answer here..."
                value={currentAnswer.essayAnswer || ''}
                onChange={(e) =>
                  handleAnswerChange(currentQuestion.id, {
                    questionId: currentQuestion.id,
                    essayAnswer: e.target.value,
                  })
                }
                className="min-h-[150px]"
              />
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-4">
        <Button variant="outline" onClick={handlePrevious} disabled={currentQuestionIndex === 0}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Previous
        </Button>

        <div className="flex gap-2">
          <Button variant="ghost" onClick={() => toast.info('Progress saved')}>
            <Save className="mr-2 h-4 w-4" /> Save
          </Button>

          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button onClick={() => setSubmitDialogOpen(true)}>
              Submit Quiz <Send className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={submitDialogOpen}
        onOpenChange={setSubmitDialogOpen}
        onConfirm={() => {
          setSubmitDialogOpen(false);
          handleSubmitAttempt();
        }}
        title="Submit Quiz"
        description="Are you sure you want to finish? You cannot change answers after submitting."
      />
    </div>
  );
};

export default QuizPlayer;

export { canRetakeQuiz, getLatestAttempt, mergeAttemptHistory };
