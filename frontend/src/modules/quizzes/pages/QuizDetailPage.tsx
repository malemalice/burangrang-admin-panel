import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit,
  Trash2,
  FileQuestion,
  BookOpen,
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  Target,
  BarChart3,
  Users,
  ArrowLeft,
  Play,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Separator } from '@/core/components/ui/separator';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { useQuiz, useQuizzes } from '../hooks/useQuizzes';
import { Quiz, QuizQuestion, QuizAttempt } from '../types/quiz.types';
import quizService from '../services/quizService';

const QuizDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { quiz, isLoading, fetchQuiz, setQuiz } = useQuiz(id || null);
  const { deleteQuiz, updateQuiz } = useQuizzes();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [completedAttempt, setCompletedAttempt] = useState<QuizAttempt | null>(
    location.state?.attempt || null
  );

  useEffect(() => {
    if (id) {
      fetchQuiz(id);
    }
  }, [id, fetchQuiz]);

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (quiz) {
      try {
        await deleteQuiz(quiz.id);
        navigate('/quizzes');
      } catch (error) {
        console.error('Failed to delete quiz:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to delete quiz';
        toast.error(errorMessage);
      }
    }
  };

  const handleTogglePublish = async () => {
    if (!quiz) return;

    try {
      setIsPublishing(true);
      const newPublishedStatus = !quiz.isPublished;
      const updatedQuiz = await updateQuiz(quiz.id, {
        isPublished: newPublishedStatus,
      });
      // Update local quiz state immediately
      if (setQuiz) {
        setQuiz(updatedQuiz);
      }
      toast.success(`Quiz ${newPublishedStatus ? 'published' : 'unpublished'} successfully`);
    } catch (error) {
      console.error('Failed to update publish status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to update publish status';
      toast.error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  const getEntityLabel = (quiz: Quiz) => {
    if (quiz.entity === 'COURSE') {
      return quiz.course ? `Course: ${quiz.course.title}` : 'Course';
    }
    if (quiz.entity === 'CHAPTER') {
      return quiz.chapter ? `Chapter: ${quiz.chapter.title}` : 'Chapter';
    }
    return 'Standalone';
  };

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }

  if (!quiz) {
    return (
      <div className="text-center py-12">
        <FileQuestion className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Quiz not found</h3>
        <p className="text-muted-foreground mb-4">The quiz you're looking for doesn't exist.</p>
        <Button onClick={() => navigate('/quizzes')}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Quizzes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/quizzes')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{quiz.title}</h1>
            <p className="text-muted-foreground mt-1">{getEntityLabel(quiz)}</p>
            <div className="flex items-center gap-2 mt-2">
              {quiz.isPublished ? (
                <Badge variant="outline" className={`${quizService.getStatusBadgeColor('published')} border-0`}>
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Published
                </Badge>
              ) : (
                <Badge variant="outline" className={`${quizService.getStatusBadgeColor('draft')} border-0`}>
                  <XCircle className="h-3 w-3 mr-1" />
                  Draft
                </Badge>
              )}
              {!quiz.isActive && (
                <Badge variant="outline" className={`${quizService.getStatusBadgeColor('inactive')} border-0`}>
                  Inactive
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleTogglePublish}
            disabled={isPublishing}
          >
            {quiz.isPublished ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" />
                Unpublish
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" />
                Publish
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/quizzes/${quiz.id}/attempt`)}
          >
            <Play className="mr-2 h-4 w-4" />
            Take Quiz
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/quizzes/${quiz.id}/edit`)}
          >
            <Edit className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            onClick={handleDeleteClick}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      <Tabs defaultValue={completedAttempt && quiz?.showCorrectAnswer ? "results" : "overview"} className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
          {completedAttempt && quiz?.showCorrectAnswer && (
            <TabsTrigger value="results">Results</TabsTrigger>
          )}
          <TabsTrigger value="statistics">Statistics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quiz.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm text-foreground">{quiz.description}</p>
                  </div>
                )}
                {quiz.instructions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                    <p className="text-sm text-foreground">{quiz.instructions}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {quiz.duration && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="text-sm text-foreground flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration} minutes
                      </p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Passing Score</p>
                    <p className="text-sm text-foreground flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      {quiz.passingScore}%
                    </p>
                  </div>
                  {quiz.maxAttempts && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Max Attempts</p>
                      <p className="text-sm text-foreground">{quiz.maxAttempts}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shuffle Questions</span>
                  <Badge variant={quiz.shuffleQuestions ? 'default' : 'outline'}>
                    {quiz.shuffleQuestions ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Shuffle Options</span>
                  <Badge variant={quiz.shuffleOptions ? 'default' : 'outline'}>
                    {quiz.shuffleOptions ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Show Correct Answer</span>
                  <Badge variant={quiz.showCorrectAnswer ? 'default' : 'outline'}>
                    {quiz.showCorrectAnswer ? 'Yes' : 'No'}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="questions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Questions ({quiz.questions?.length || 0})</CardTitle>
            </CardHeader>
            <CardContent>
              {quiz.questions && quiz.questions.length > 0 ? (
                <div className="space-y-4">
                  {quiz.questions.map((question: QuizQuestion, index: number) => (
                    <div key={question.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{index + 1}</Badge>
                          <Badge variant="outline">
                            {getQuestionTypeLabel(question.questionType)}
                          </Badge>
                          <span className="text-sm text-muted-foreground">
                            {question.points} point{question.points !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">{question.questionText}</p>
                      {question.mediaUrl && (
                        <div className="mb-2">
                          {question.mediaType?.startsWith('image/') ? (
                            <img
                              src={question.mediaUrl}
                              alt="Question media"
                              className="max-w-md rounded"
                            />
                          ) : question.mediaType?.startsWith('video/') ? (
                            <video
                              src={question.mediaUrl}
                              controls
                              className="max-w-md rounded"
                              style={{ maxHeight: '400px' }}
                            >
                              Your browser does not support the video tag.
                            </video>
                          ) : question.mediaType?.startsWith('audio/') ? (
                            <audio
                              src={question.mediaUrl}
                              controls
                              className="w-full"
                            >
                              Your browser does not support the audio tag.
                            </audio>
                          ) : (
                            <img
                              src={question.mediaUrl}
                              alt="Question media"
                              className="max-w-md rounded"
                            />
                          )}
                        </div>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={option.id}
                              className={`text-sm p-2 rounded ${option.isCorrect
                                ? `${quizService.getStatusBadgeColor('published')}`
                                : 'bg-muted text-muted-foreground'
                                }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option.optionText}
                              {option.isCorrect && (
                                <CheckCircle2 className="h-3 w-3 ml-2 inline" />
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <strong>Explanation:</strong> {question.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No questions added yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {completedAttempt && quiz?.showCorrectAnswer && (
          <TabsContent value="results" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quiz Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Score</p>
                    <p className="text-3xl font-bold">
                      {completedAttempt.score?.toFixed(1) || 0}%
                    </p>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Status</p>
                    <Badge
                      variant={completedAttempt.isPassed ? 'default' : 'destructive'}
                      className="text-lg px-4 py-2"
                    >
                      {completedAttempt.isPassed ? 'Passed' : 'Failed'}
                    </Badge>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <p className="text-sm text-muted-foreground">Time Spent</p>
                    <p className="text-2xl font-bold">
                      {Math.floor((completedAttempt.timeSpent || 0) / 60)}:
                      {String((completedAttempt.timeSpent || 0) % 60).padStart(2, '0')}
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="space-y-6">
                  <h3 className="text-lg font-semibold">Answers Review</h3>
                  {completedAttempt.quiz?.questions?.map((question: QuizQuestion, index: number) => {
                    const answer = completedAttempt.answers?.find(
                      (a) => a.questionId === question.id
                    );
                    const isCorrect = answer?.isCorrect ?? false;
                    const pointsEarned = answer?.pointsEarned || 0;

                    return (
                      <div key={question.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{index + 1}</Badge>
                            <Badge variant="outline">
                              {getQuestionTypeLabel(question.questionType)}
                            </Badge>
                            <Badge
                              variant={isCorrect ? 'default' : 'destructive'}
                            >
                              {isCorrect ? 'Correct' : 'Incorrect'}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              {pointsEarned} / {question.points} points
                            </span>
                          </div>
                        </div>

                        <p className="font-medium">{question.questionText}</p>

                        {question.questionType === 'MULTIPLE_CHOICE' ||
                          question.questionType === 'TRUE_FALSE' ? (
                          <div className="space-y-2">
                            {question.options?.map((option, optIndex) => {
                              const isSelected = answer?.selectedOptionId === option.id;
                              const isCorrectOption = option.isCorrect;
                              let bgColor = 'bg-muted';
                              let textColor = 'text-muted-foreground';

                              if (isCorrectOption) {
                                bgColor = 'bg-green-100 dark:bg-green-900';
                                textColor = 'text-green-800 dark:text-green-200';
                              } else if (isSelected && !isCorrectOption) {
                                bgColor = 'bg-red-100 dark:bg-red-900';
                                textColor = 'text-red-800 dark:text-red-200';
                              }

                              return (
                                <div
                                  key={option.id}
                                  className={`p-3 rounded-lg border ${bgColor} ${textColor}`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span>{String.fromCharCode(65 + optIndex)}.</span>
                                    <span>{option.optionText}</span>
                                    {isCorrectOption && (
                                      <CheckCircle2 className="h-4 w-4 ml-auto" />
                                    )}
                                    {isSelected && (
                                      <Badge variant="outline" className="ml-2">
                                        Your Answer
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div className="p-3 rounded-lg border bg-muted">
                              <p className="text-sm font-medium mb-2">Your Answer:</p>
                              <p className="text-sm">{answer?.essayAnswer || 'No answer provided'}</p>
                            </div>
                            {answer?.feedback && (
                              <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900">
                                <p className="text-sm font-medium mb-2">Feedback:</p>
                                <p className="text-sm">{answer.feedback}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {question.explanation && (
                          <div className="p-3 rounded-lg border bg-blue-50 dark:bg-blue-900">
                            <p className="text-sm font-medium mb-1">Explanation:</p>
                            <p className="text-sm">{question.explanation}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="statistics" className="space-y-4">
          {quiz.statistics ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Total Attempts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">{quiz.statistics.totalAttempts}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Average Score
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {quiz.statistics.averageScore.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Pass Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold">
                    {quiz.statistics.passRate.toFixed(1)}%
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                No statistics available yet
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Quiz"
        description={`Are you sure you want to delete "${quiz.title}"? This action cannot be undone.`}
        variant="destructive"
      />
    </div>
  );
};

export default QuizDetailPage;
