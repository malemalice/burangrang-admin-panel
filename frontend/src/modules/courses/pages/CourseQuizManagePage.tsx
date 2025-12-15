import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  Plus,
  FileQuestion,
  Search,
  Check,
  Clock,
  Users,
} from 'lucide-react';
import { Badge } from '@/core/components/ui/badge';
import { Button } from '@/core/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/core/components/ui/card';
import { Input } from '@/core/components/ui/input';
import { Separator } from '@/core/components/ui/separator';
import quizService from '@/modules/quizzes/services/quizService';
import courseService from '../services/courseService';
import chapterService from '../services/chapterService';
import { Quiz } from '@/modules/quizzes/types/quiz.types';

const CourseQuizManagePage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const entity = searchParams.get('entity') as 'COURSE' | 'CHAPTER' | null;
  const entityId = searchParams.get('entityId');

  const [availableQuizzes, setAvailableQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [linking, setLinking] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [entityTitle, setEntityTitle] = useState<string>('');

  // Load entity title (course or chapter name)
  useEffect(() => {
    const loadEntityTitle = async () => {
      try {
        if (entity === 'COURSE' && entityId) {
          const course = await courseService.getCourseById(entityId);
          setEntityTitle(course.title);
        } else if (entity === 'CHAPTER' && entityId) {
          const chapter = await chapterService.getChapterById(entityId);
          setEntityTitle(chapter.title);
        }
      } catch (error) {
        console.error('Failed to load entity:', error);
      }
    };
    loadEntityTitle();
  }, [entity, entityId]);

  // Load available quizzes (standalone quizzes without entity assignment)
  useEffect(() => {
    const loadQuizzes = async () => {
      setLoading(true);
      try {
        // Get all quizzes and filter standalone ones
        const response = await quizService.getQuizzes({
          page: 1,
          limit: 100,
          search: searchTerm || undefined,
          isPublished: true,
        });
        // Filter to show only standalone quizzes (entity is null)
        const standaloneQuizzes = response.data.filter(
          (quiz) => quiz.entity === null
        );
        setAvailableQuizzes(standaloneQuizzes);
      } catch (error) {
        console.error('Failed to load quizzes:', error);
        toast.error('Failed to load available quizzes');
      } finally {
        setLoading(false);
      }
    };
    loadQuizzes();
  }, [searchTerm]);

  const handleLinkQuiz = async (quizId: string) => {
    if (!entity || !entityId) {
      toast.error('Invalid entity configuration');
      return;
    }

    setLinking(quizId);
    try {
      await quizService.linkQuiz(quizId, entity, entityId);
      toast.success('Quiz linked successfully');
      navigate(`/courses/${courseId}?tab=quizzes`);
    } catch (error) {
      console.error('Failed to link quiz:', error);
      toast.error('Failed to link quiz');
    } finally {
      setLinking(null);
    }
  };

  const handleCreateNew = () => {
    navigate(`/quizzes/new?entity=${entity}&entityId=${entityId}&returnTo=/courses/${courseId}`);
  };

  const handleBack = () => {
    if (entity === 'CHAPTER') {
      navigate(`/courses/${courseId}?tab=chapters`);
    } else {
      navigate(`/courses/${courseId}?tab=quizzes`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Add Quiz</h1>
          <p className="text-gray-600">
            {entity === 'COURSE' ? 'Course' : 'Chapter'}: {entityTitle || 'Loading...'}
          </p>
        </div>
      </div>

      {/* Options Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Create New Quiz */}
        <Card className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer" onClick={handleCreateNew}>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
              <Plus className="h-6 w-6 text-primary" />
            </div>
            <CardTitle>Create New Quiz</CardTitle>
            <CardDescription>
              Build a new quiz from scratch with custom questions
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Create Quiz
            </Button>
          </CardContent>
        </Card>

        {/* Select Existing Quiz */}
        <Card>
          <CardHeader className="text-center pb-2">
            <div className="mx-auto w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <FileQuestion className="h-6 w-6 text-blue-600" />
            </div>
            <CardTitle>Select Existing Quiz</CardTitle>
            <CardDescription>
              Choose from available quizzes to link to this {entity === 'COURSE' ? 'course' : 'chapter'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-500 text-center">
              Browse quizzes below
            </p>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Available Quizzes Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Available Quizzes</h2>
          <div className="relative w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search quizzes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="h-8 w-8 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
          </div>
        ) : availableQuizzes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileQuestion className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No available quizzes</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm
                  ? 'No quizzes match your search. Try a different term.'
                  : 'Create a new quiz to get started.'}
              </p>
              <Button onClick={handleCreateNew}>
                <Plus className="mr-2 h-4 w-4" />
                Create New Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableQuizzes.map((quiz) => (
              <Card key={quiz.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{quiz.title}</h4>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {quiz.description || 'No description'}
                      </p>
                    </div>
                    {quiz.isPublished && (
                      <Badge variant="outline" className="bg-green-100 text-green-800 border-0 text-xs ml-2">
                        Published
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <span className="flex items-center gap-1">
                      <FileQuestion className="h-3 w-3" />
                      {quiz.questions?.length || 0} questions
                    </span>
                    {quiz.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {quiz.duration} min
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {quiz.passingScore}% pass
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => handleLinkQuiz(quiz.id)}
                    disabled={linking === quiz.id}
                  >
                    {linking === quiz.id ? (
                      <>
                        <div className="h-4 w-4 mr-2 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
                        Linking...
                      </>
                    ) : (
                      <>
                        <Check className="mr-2 h-4 w-4" />
                        Select Quiz
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseQuizManagePage;
