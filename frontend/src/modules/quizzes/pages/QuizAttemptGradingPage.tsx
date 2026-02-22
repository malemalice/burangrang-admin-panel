import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Target,
  User,
  SlidersHorizontal,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Label } from '@/core/components/ui/label';
import { Input } from '@/core/components/ui/input';
import { Textarea } from '@/core/components/ui/textarea';
import { Separator } from '@/core/components/ui/separator';
import PageHeader from '@/core/components/ui/PageHeader';
import quizService from '../services/quizService';
import ScoreAdjustmentDialog from '../components/ScoreAdjustmentDialog';
import type { QuizAttempt, QuizQuestion, QuizAnswer, GradeAnswerDTO, AdjustAttemptScoreDTO } from '../types/quiz.types';

const getQuestionTypeLabel = (type: string) => {
  switch (type) {
    case 'MULTIPLE_CHOICE':
      return 'Multiple Choice';
    case 'TRUE_FALSE':
      return 'True/False';
    case 'ESSAY':
      return 'Essay';
    default:
      return type;
  }
};

const QuizAttemptGradingPage = () => {
  const { id: quizId, attemptId } = useParams<{ id: string; attemptId: string }>();
  const navigate = useNavigate();
  const [attempt, setAttempt] = useState<(QuizAttempt & { user?: { id: string; firstName: string; lastName: string; email: string } }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [gradingAnswerId, setGradingAnswerId] = useState<string | null>(null);
  const [gradingQuestionId, setGradingQuestionId] = useState<string | null>(null);
  const [adjustScoreOpen, setAdjustScoreOpen] = useState(false);
  const [adjustingScore, setAdjustingScore] = useState(false);

  const fetchAttempt = async () => {
    if (!attemptId) return;
    try {
      setLoading(true);
      const data = await quizService.getAttemptById(attemptId);
      setAttempt(data);
    } catch (err) {
      console.error('Failed to fetch attempt:', err);
      toast.error('Failed to load attempt');
      setAttempt(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttempt();
  }, [attemptId]);

  const handleGradeEssay = async (
    answerId: string,
    gradeData: GradeAnswerDTO,
  ) => {
    try {
      setGradingAnswerId(answerId);
      await quizService.gradeAnswer(answerId, gradeData);
      toast.success('Answer graded');
      await fetchAttempt();
    } catch (err) {
      console.error('Failed to grade answer:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to grade answer');
    } finally {
      setGradingAnswerId(null);
    }
  };

  const handleGradeEssayByQuestion = async (
    questionId: string,
    gradeData: GradeAnswerDTO,
  ) => {
    if (!attemptId) return;
    try {
      setGradingQuestionId(questionId);
      await quizService.gradeEssayByQuestion(attemptId, questionId, gradeData);
      toast.success('Answer graded');
      await fetchAttempt();
    } catch (err) {
      console.error('Failed to grade answer:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to grade answer');
    } finally {
      setGradingQuestionId(null);
    }
  };

  const handleAdjustScore = async (data: AdjustAttemptScoreDTO) => {
    if (!attemptId) return;
    try {
      setAdjustingScore(true);
      await quizService.adjustAttemptScore(attemptId, data);
      toast.success('Score updated');
      await fetchAttempt();
    } catch (err) {
      console.error('Failed to adjust score:', err);
      toast.error(err instanceof Error ? err.message : 'Failed to adjust score');
    } finally {
      setAdjustingScore(false);
    }
  };

  const studentLabel = attempt?.user
    ? `${attempt.user.firstName} ${attempt.user.lastName}`.trim() || attempt.user.email
    : 'Unknown';

  if (loading && !attempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!attemptId || !attempt) {
    return (
      <div className="space-y-4">
        <PageHeader title="Grading" subtitle="Quiz attempt not found." />
        <Button variant="outline" onClick={() => navigate(quizId ? `/quizzes/${quizId}` : '/quizzes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>
    );
  }

  const passingScore = attempt.quiz?.passingScore ?? 75;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Grade quiz attempt"
        subtitle={attempt.quiz?.title ? `Attempt #${attempt.attemptNumber} — ${attempt.quiz.title}` : `Attempt #${attempt.attemptNumber}`}
        actions={
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(quizId ? `/quizzes/${quizId}` : '/quizzes')}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to quiz
            </Button>
            {attempt.status === 'COMPLETED' && (
              <Button
                variant="outline"
                onClick={() => setAdjustScoreOpen(true)}
              >
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Adjust score
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4" />
              Student
            </CardTitle>
            <CardDescription>{studentLabel}</CardDescription>
            {attempt.user?.email && (
              <p className="text-sm text-muted-foreground">{attempt.user.email}</p>
            )}
          </CardHeader>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4" />
              Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {attempt.score != null ? `${Number(attempt.score).toFixed(1)}%` : '—'}
            </p>
            <Badge
              variant={attempt.isPassed ? 'default' : 'destructive'}
              className="mt-2"
            >
              {attempt.isPassed ? 'Passed' : 'Failed'}
            </Badge>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Time spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {Math.floor((attempt.timeSpent || 0) / 60)}:
              {String((attempt.timeSpent || 0) % 60).padStart(2, '0')}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Answers</CardTitle>
          <CardDescription>Review and grade essay responses.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {attempt.quiz?.questions?.map((question: QuizQuestion, index: number) => {
            const answer = attempt.answers?.find((a: QuizAnswer) => a.questionId === question.id);
            const isEssay = question.questionType === 'ESSAY';

            return (
              <div key={question.id} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline">{index + 1}</Badge>
                  <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                  <span className="text-sm text-muted-foreground">
                    {question.points} point{question.points !== 1 ? 's' : ''}
                  </span>
                  {answer && isEssay && answer.isCorrect !== null && (
                    <Badge variant={answer.isCorrect ? 'default' : 'secondary'}>
                      {answer.isCorrect ? 'Correct' : 'Incorrect'}
                    </Badge>
                  )}
                </div>

                <p className="font-medium">{question.questionText}</p>

                {isEssay ? (
                  <EssayGradingBlock
                    question={question}
                    answer={answer}
                    onGrade={
                      answer
                        ? (gradeData) => handleGradeEssay(answer.id, gradeData)
                        : (gradeData) => handleGradeEssayByQuestion(question.id, gradeData)
                    }
                    isSubmitting={gradingAnswerId === answer?.id || gradingQuestionId === question.id}
                  />
                ) : (
                  <div className="space-y-2">
                    {question.options?.map((opt, optIndex) => {
                      const isSelected = answer?.selectedOptionId === opt.id;
                      const isCorrect = opt.isCorrect;
                      let bg = 'bg-muted';
                      if (isCorrect) bg = 'bg-green-100 dark:bg-green-900';
                      else if (isSelected) bg = 'bg-red-100 dark:bg-red-900';
                      return (
                        <div
                          key={opt.id}
                          className={`p-3 rounded-lg border ${bg}`}
                        >
                          {String.fromCharCode(65 + optIndex)}. {opt.optionText}
                          {isSelected && (
                            <Badge variant="outline" className="ml-2">Selected</Badge>
                          )}
                          {isCorrect && <CheckCircle2 className="h-4 w-4 inline ml-2" />}
                        </div>
                      );
                    })}
                  </div>
                )}

                {question.explanation && (
                  <div className="p-3 rounded-lg border bg-muted/50 text-sm text-muted-foreground">
                    <strong>Explanation:</strong> {question.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      </Card>

      <ScoreAdjustmentDialog
        open={adjustScoreOpen}
        onOpenChange={setAdjustScoreOpen}
        currentScore={attempt.score ?? null}
        passingScore={passingScore}
        onConfirm={handleAdjustScore}
        isLoading={adjustingScore}
      />
    </div>
  );
};

interface EssayGradingBlockProps {
  question: QuizQuestion;
  answer: QuizAnswer | undefined;
  onGrade: (data: GradeAnswerDTO) => void | Promise<void>;
  isSubmitting: boolean;
}

const EssayGradingBlock = ({
  question,
  answer,
  onGrade,
  isSubmitting,
}: EssayGradingBlockProps) => {
  const [points, setPoints] = useState<string>(
    answer ? String(answer.pointsEarned) : '0',
  );
  const [isCorrect, setIsCorrect] = useState<boolean>(answer?.isCorrect ?? true);
  const [feedback, setFeedback] = useState<string>(answer?.feedback ?? '');

  useEffect(() => {
    if (answer) {
      setPoints(String(answer.pointsEarned));
      setIsCorrect(answer.isCorrect ?? true);
      setFeedback(answer.feedback ?? '');
    }
  }, [answer?.id, answer?.pointsEarned, answer?.isCorrect, answer?.feedback]);

  const maxPoints = Number(question.points) || 1;
  const pointsNum = points.trim() === '' ? 0 : Number(points);
  const validPoints =
    !Number.isNaN(pointsNum) && pointsNum >= 0 && pointsNum <= maxPoints;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validPoints) return;
    try {
      await Promise.resolve(
        onGrade({
          pointsEarned: pointsNum,
          isCorrect,
          feedback: feedback.trim() || undefined,
        })
      );
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save grade');
    }
  };

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg border bg-muted">
        <p className="text-sm font-medium mb-2">Student answer:</p>
        <p className="text-sm whitespace-pre-wrap">
          {answer?.essayAnswer || 'No answer provided'}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3 border rounded-lg p-4 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`points-${question.id}`}>
              Points (0–{maxPoints})
            </Label>
            <Input
              id={`points-${question.id}`}
              type="number"
              min={0}
              max={maxPoints}
              step={0.5}
              value={points}
              onChange={(e) => setPoints(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 pt-8">
            <input
              type="radio"
              id={`correct-${question.id}`}
              checked={isCorrect === true}
              onChange={() => setIsCorrect(true)}
            />
            <Label htmlFor={`correct-${question.id}`} className="font-normal">
              Correct
            </Label>
            <input
              type="radio"
              id={`incorrect-${question.id}`}
              checked={isCorrect === false}
              onChange={() => setIsCorrect(false)}
              className="ml-4"
            />
            <Label htmlFor={`incorrect-${question.id}`} className="font-normal">
              Incorrect
            </Label>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`feedback-${question.id}`}>Feedback (optional)</Label>
          <Textarea
            id={`feedback-${question.id}`}
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            placeholder="Comment for the student"
            rows={2}
            className="resize-none"
          />
        </div>
        <Button type="submit" size="sm" disabled={!validPoints || isSubmitting}>
          {isSubmitting ? 'Saving…' : 'Save grade'}
        </Button>
      </form>
    </div>
  );
};

export default QuizAttemptGradingPage;
