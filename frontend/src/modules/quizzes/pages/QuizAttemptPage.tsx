import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ArrowRight,
  Clock,
  Save,
  Send,
} from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { Textarea } from '@/core/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/core/components/ui/radio-group';
import { Label } from '@/core/components/ui/label';
import { Separator } from '@/core/components/ui/separator';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { useQuizAttempt } from '../hooks/useQuizAttempt';
import { useQuiz } from '../hooks/useQuizzes';
import { SubmitAnswerDTO } from '../types/quiz.types';
import { enrollmentService } from '@/modules/enrollments';

const QuizAttemptPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const enrollmentIdFromUrl = searchParams.get('enrollmentId') || undefined;

  const { quiz, isLoading: quizLoading, fetchQuiz } = useQuiz(id || null);
  const { attempt, startAttempt, submitAnswer, submitAttempt, isLoading, error } = useQuizAttempt(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, Partial<SubmitAnswerDTO>>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [enrollmentId, setEnrollmentId] = useState<string | undefined>(enrollmentIdFromUrl);
  const [isFindingEnrollment, setIsFindingEnrollment] = useState(false);
  const hasAutoSubmittedRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load quiz
  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id, fetchQuiz]);

  // Find enrollment for bound quizzes
  useEffect(() => {
    const findEnrollment = async () => {
      // Skip if enrollmentId already exists, quiz is not loaded, or still loading
      if (enrollmentId || !quiz || quizLoading || isLoading) {
        return;
      }

      // Only need enrollment for bound quizzes
      if (quiz.entity !== 'COURSE' && quiz.entity !== 'CHAPTER') {
        return;
      }

      setIsFindingEnrollment(true);
      try {
        // Get courseId from quiz
        let courseId: string | undefined;
        if (quiz.entity === 'COURSE') {
          courseId = quiz.entityId;
        } else if (quiz.entity === 'CHAPTER') {
          // For chapter, we need to get courseId from chapter
          if (quiz.chapter?.courseId) {
            courseId = quiz.chapter.courseId;
          } else if (quiz.entityId) {
            // If chapter data not loaded yet, we might need to fetch it
            // But for now, we'll show error
            toast.error('Chapter information not available. Please try again.');
            navigate(`/quizzes/${quiz.id}`);
            return;
          }
        }

        if (!courseId) {
          toast.error('Unable to determine course for this quiz');
          navigate(`/quizzes/${quiz.id}`);
          return;
        }

        // Get user enrollments and find matching enrollment
        const userEnrollments = await enrollmentService.getUserEnrollments();
        const matchingEnrollment = userEnrollments.find(
          (enrollment) => enrollment.courseId === courseId && enrollment.status === 'ACTIVE'
        );

        if (matchingEnrollment) {
          setEnrollmentId(matchingEnrollment.id);
        } else {
          toast.error('You need to be enrolled in this course to take the quiz');
          navigate(`/quizzes/${quiz.id}`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to find enrollment for this quiz';
        toast.error(errorMessage);
        navigate(`/quizzes/${quiz.id}`);
      } finally {
        setIsFindingEnrollment(false);
      }
    };

    findEnrollment();
  }, [quiz?.id, quiz?.entity, quiz?.entityId, quiz?.chapter?.courseId, enrollmentId, quizLoading, isLoading, navigate]);

  // Load saved answers from attempt when attempt is loaded
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

  // Save answers to localStorage as backup for Q-062
  useEffect(() => {
    if (attempt?.id && Object.keys(answers).length > 0) {
      localStorage.setItem(`quiz_answers_${attempt.id}`, JSON.stringify(answers));
    }
  }, [answers, attempt?.id]);

  // Load answers from localStorage on mount if attempt exists
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
    // Cleanup localStorage when attempt is completed
    if (attempt?.status === 'COMPLETED' && attempt?.id) {
      localStorage.removeItem(`quiz_answers_${attempt.id}`);
    }
  }, [attempt?.id, attempt?.status]);

  // Start attempt when quiz is loaded and enrollment is ready
  useEffect(() => {
    // Skip if quiz is not loaded, attempt already exists, or currently loading
    if (!quiz || attempt || isLoading || isFindingEnrollment) {
      return;
    }

    // Check if quiz is published
    if (!quiz.isPublished) {
      toast.error('This quiz is not published yet');
      navigate(`/quizzes/${quiz.id}`);
      return;
    }

    // For bound quizzes, ensure enrollmentId is available
    if ((quiz.entity === 'COURSE' || quiz.entity === 'CHAPTER') && !enrollmentId) {
      // Enrollment finding is in progress or failed, wait or return
      return;
    }

    // Start attempt
    const initializeAttempt = async () => {
      try {
        // Only include enrollmentId if it exists (for bound quizzes)
        const attemptData: { enrollmentId?: string } = {};
        if (enrollmentId) {
          attemptData.enrollmentId = enrollmentId;
        }

        const newAttempt = await startAttempt(quiz.id, attemptData);
        if (newAttempt.quiz?.duration) {
          setTimeRemaining(newAttempt.quiz.duration * 60); // Convert to seconds
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to start quiz attempt';
        toast.error(errorMessage);
        navigate(`/quizzes/${quiz.id}`);
      }
    };

    initializeAttempt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quiz?.id, quiz?.isPublished, quiz?.entity, enrollmentId, attempt, isLoading, isFindingEnrollment]);

  const handleSubmitAttempt = useCallback(async () => {
    if (!attempt) return;

    try {
      const completedAttempt = await submitAttempt(attempt.id);
      // Toast is already shown in useQuizAttempt.submitAttempt
      navigate(`/quizzes/${quiz?.id}`, {
        state: { attempt: completedAttempt },
      });
    } catch (error) {
      // Error toast is already shown in useQuizAttempt.submitAttempt
      // No need to show duplicate error toast
    }
  }, [attempt, submitAttempt, navigate, quiz?.id]);

  // Timer countdown
  useEffect(() => {
    if (timeRemaining !== null && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev === null || prev <= 1) {
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    } else if (timeRemaining === 0 && attempt && attempt.status === 'IN_PROGRESS' && !hasAutoSubmittedRef.current) {
      // Auto-submit when time runs out (only once)
      hasAutoSubmittedRef.current = true;
      handleSubmitAttempt();
    }
  }, [timeRemaining, attempt, handleSubmitAttempt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = async (questionId: string, answer: SubmitAnswerDTO) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    // Auto-save answer if attempt exists
    if (attempt) {
      // Get current question type for debounce decision
      const displayQuiz = attempt?.quiz || quiz;
      const question = displayQuiz?.questions?.find(q => q.id === questionId);
      
      // Clear any pending save timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
      
      // Use debounce for essay questions (Q-069 fix)
      if (question?.questionType === 'ESSAY') {
        saveTimeoutRef.current = setTimeout(async () => {
          try {
            await submitAnswer(attempt.id, answer);
          } catch (error) {
            console.error('Failed to save answer:', error);
          }
        }, 800); // 800ms debounce for essay
      } else {
        // Immediate save for multiple choice
        try {
          await submitAnswer(attempt.id, answer);
        } catch (error) {
          console.error('Failed to save answer:', error);
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Loading quiz...</p>
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (isFindingEnrollment) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Finding enrollment...</p>
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!attempt && isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Starting quiz...</p>
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  if (!attempt && error) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => navigate(`/quizzes/${quiz.id}`)}>
            Back to Quiz
          </Button>
        </div>
      </div>
    );
  }

  if (!attempt) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">Preparing quiz...</p>
          <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin mx-auto" />
        </div>
      </div>
    );
  }

  // Use attempt.quiz (with shuffled questions) if available, otherwise fall back to quiz
  const displayQuiz = attempt?.quiz || quiz;

  if (!displayQuiz.questions || displayQuiz.questions.length === 0) {
    return (
      <div className="container mx-auto py-6 max-w-4xl">
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">This quiz has no questions yet.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentQuestion = displayQuiz.questions[currentQuestionIndex];
  if (!currentQuestion) {
    return null;
  }

  const currentAnswer = (answers[currentQuestion.id] || {}) as Partial<SubmitAnswerDTO>;
  const totalQuestions = displayQuiz.questions.length;
  const answeredCount = Object.keys(answers).length;

  return (
    <div className="container mx-auto py-6 max-w-4xl">
      {/* Header with timer */}
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
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
                style={{ width: `${Math.min(100, Math.max(0, (answeredCount / totalQuestions) * 100))}%` }}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">
              Question {currentQuestionIndex + 1}
            </CardTitle>
            <Badge variant="outline">
              {currentQuestion.points} point{currentQuestion.points !== 1 ? 's' : ''}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-base font-medium mb-2">{currentQuestion.questionText}</p>
            {currentQuestion.mediaUrl && (
              <div className="my-4">
                {currentQuestion.mediaType?.startsWith('image/') ? (
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question media"
                    className="max-w-full rounded"
                  />
                ) : currentQuestion.mediaType?.startsWith('video/') ? (
                  <video
                    src={currentQuestion.mediaUrl}
                    controls
                    className="max-w-full rounded"
                    style={{ maxHeight: '400px' }}
                  >
                    Your browser does not support the video tag.
                  </video>
                ) : currentQuestion.mediaType?.startsWith('audio/') ? (
                  <audio
                    src={currentQuestion.mediaUrl}
                    controls
                    className="w-full"
                  >
                    Your browser does not support the audio tag.
                  </audio>
                ) : (
                  <img
                    src={currentQuestion.mediaUrl}
                    alt="Question media"
                    className="max-w-full rounded"
                  />
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Answer input based on question type */}
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
              placeholder="Type your answer here... (You can leave this empty if needed)"
              className="min-h-[200px]"
              value={currentAnswer.essayAnswer || ''}
              onChange={(e) =>
                handleAnswerChange(currentQuestion.id, {
                  questionId: currentQuestion.id,
                  essayAnswer: e.target.value, // Allow empty string
                })
              }
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentQuestionIndex === 0}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              // Save progress
              toast.info('Progress saved');
            }}
          >
            <Save className="mr-2 h-4 w-4" />
            Save
          </Button>
          {currentQuestionIndex === totalQuestions - 1 ? (
            <Button onClick={() => setSubmitDialogOpen(true)}>
              <Send className="mr-2 h-4 w-4" />
              Submit Quiz
            </Button>
          ) : (
            <Button onClick={handleNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
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
        description="Are you sure you want to submit your quiz? You won't be able to change your answers after submission."
      />
    </div>
  );
};


export default QuizAttemptPage;
