import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Edit,
  Trash2,
  FileQuestion,
  CheckCircle2,
  XCircle,
  ArrowLeft,
  Eye,
  EyeOff,
  Clock,
} from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import { ConfirmDialog } from '@/core/components/ui/confirm-dialog';
import { usePermissions } from '@/core/hooks/usePermissions';
import { useHealthQuiz, useHealthQuizzes } from '../hooks/useHealthQuizzes';
import { Quiz, QuizQuestion } from '@/modules/quizzes/types/quiz.types';
import quizService from '@/modules/quizzes/services/quizService';

const HealthQuizDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { quiz, isLoading, fetchQuiz, setQuiz } = useHealthQuiz(id || null);
  const { deleteQuiz, updateQuiz } = useHealthQuizzes();
  const { hasPermission } = usePermissions();
  const canUpdate = hasPermission('health-quiz:update');
  const canDelete = hasPermission('health-quiz:delete');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    if (id) fetchQuiz(id);
  }, [id, fetchQuiz]);

  const handleDeleteConfirm = async () => {
    if (!quiz) return;
    try {
      await deleteQuiz(quiz.id);
      toast.success('Questionnaire removed');
      navigate('/health-quizzes');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete';
      toast.error(msg);
    }
  };

  const handleTogglePublish = async () => {
    if (!quiz) return;
    try {
      setIsPublishing(true);
      const next = !quiz.isPublished;
      const updated = await updateQuiz(quiz.id, { isPublished: next });
      if (setQuiz) setQuiz(updated);
      toast.success(next ? 'Published' : 'Unpublished');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Update failed');
    } finally {
      setIsPublishing(false);
    }
  };

  const getEntityLabel = (q: Quiz) => {
    if (q.entity === 'COURSE') return q.course ? `Course: ${q.course.title}` : 'Course';
    if (q.entity === 'CHAPTER') return q.chapter ? `Chapter: ${q.chapter.title}` : 'Chapter';
    return 'Standalone';
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'MULTIPLE_CHOICE':
        return 'Multiple choice';
      case 'TRUE_FALSE':
        return 'True / false';
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
        <h3 className="text-lg font-medium mb-2">Questionnaire not found</h3>
        <Button variant="outline" onClick={() => navigate('/health-quizzes')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to list
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/health-quizzes')}>
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
              {quiz.isDefaultForHealthScreening && (
                <Badge variant="secondary" className="border-0">
                  Default screening template
                </Badge>
              )}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canUpdate && (
            <Button variant="outline" onClick={handleTogglePublish} disabled={isPublishing}>
              {quiz.isPublished ? (
                <>
                  <EyeOff className="mr-2 h-4 w-4" /> Unpublish
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-4 w-4" /> Publish
                </>
              )}
            </Button>
          )}
          {canUpdate && (
            <Button variant="outline" onClick={() => navigate(`/health-quizzes/${quiz.id}/edit`)}>
              <Edit className="mr-2 h-4 w-4" /> Edit
            </Button>
          )}
          {canDelete && (
            <Button variant="outline" onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
              <Trash2 className="mr-2 h-4 w-4" /> Delete
            </Button>
          )}
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="questions">Questions</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quiz.description && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Description</p>
                    <p className="text-sm">{quiz.description}</p>
                  </div>
                )}
                {quiz.instructions && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Instructions</p>
                    <p className="text-sm">{quiz.instructions}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-2">
                  {quiz.duration != null && quiz.duration > 0 && (
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Duration</p>
                      <p className="text-sm flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        {quiz.duration} min
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Behaviour</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shuffle questions</span>
                  <Badge variant={quiz.shuffleQuestions ? 'default' : 'outline'}>
                    {quiz.shuffleQuestions ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shuffle options</span>
                  <Badge variant={quiz.shuffleOptions ? 'default' : 'outline'}>
                    {quiz.shuffleOptions ? 'Yes' : 'No'}
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
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline">{index + 1}</Badge>
                          <Badge variant="outline">{getQuestionTypeLabel(question.questionType)}</Badge>
                        </div>
                      </div>
                      <p className="text-sm font-medium mb-2">{question.questionText}</p>
                      {question.mediaUrl && (
                        <div className="mb-2">
                          {question.mediaType?.startsWith('image/') ? (
                            <img src={question.mediaUrl} alt="" className="max-w-md rounded" />
                          ) : question.mediaType?.startsWith('video/') ? (
                            <video src={question.mediaUrl} controls className="max-w-md rounded max-h-[400px]" />
                          ) : (
                            <img src={question.mediaUrl} alt="" className="max-w-md rounded" />
                          )}
                        </div>
                      )}
                      {question.options && question.options.length > 0 && (
                        <div className="mt-3 space-y-1">
                          {question.options.map((option, optIndex) => (
                            <div
                              key={option.id}
                              className={`text-sm p-2 rounded ${
                                option.isCorrect
                                  ? quizService.getStatusBadgeColor('published')
                                  : 'bg-muted text-muted-foreground'
                              }`}
                            >
                              {String.fromCharCode(65 + optIndex)}. {option.optionText}
                              {option.isCorrect && <CheckCircle2 className="h-3 w-3 ml-2 inline" />}
                            </div>
                          ))}
                        </div>
                      )}
                      {question.explanation && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          <strong>Note:</strong> {question.explanation}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">No questions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete questionnaire?"
        description="This will deactivate the health questionnaire template."
        confirmText="Delete"
        onConfirm={handleDeleteConfirm}
        variant="destructive"
      />
    </div>
  );
};

export default HealthQuizDetailPage;
