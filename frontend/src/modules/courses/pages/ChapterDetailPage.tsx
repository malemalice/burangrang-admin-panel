import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ArrowLeft, Edit, FileQuestion } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import PageHeader from '@/core/components/ui/PageHeader';
import chapterService from '../services/chapterService';
import { Chapter } from '../types/course.types';
import ChapterContent from '../components/ChapterContent';

const ChapterDetailPage = () => {
  const navigate = useNavigate();
  const { courseId, chapterId } = useParams<{ courseId: string; chapterId: string }>();

  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadChapter = async () => {
      if (!chapterId) {
        toast.error('Chapter not found');
        navigate('/courses');
        return;
      }

      setIsLoading(true);
      try {
        const data = await chapterService.getChapterById(chapterId);
        setChapter(data);
      } catch (error) {
        console.error('Failed to load chapter:', error);
        toast.error('Failed to load chapter');
      } finally {
        setIsLoading(false);
      }
    };

    loadChapter();
  }, [chapterId]);

  return (
    <div className="space-y-6">
      <PageHeader
        title={chapter?.title || 'Chapter Detail'}
        subtitle={chapter ? `Chapter ${chapter.order}` : 'View chapter content'}
        actions={
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button
              variant="outline"
              onClick={() => (courseId ? navigate(`/courses/${courseId}?tab=chapters`) : navigate('/courses'))}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Course
            </Button>
            {courseId && chapterId && (
              <>
                <Button variant="outline" onClick={() => navigate(`/courses/${courseId}/chapters/${chapterId}/edit`)}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  onClick={() =>
                    navigate(`/courses/${courseId}/quizzes/manage?entity=CHAPTER&entityId=${chapterId}`)
                  }
                >
                  <FileQuestion className="mr-2 h-4 w-4" />
                  Add Quiz
                </Button>
              </>
            )}
          </div>
        }
      />

      {isLoading ? (
        <div className="flex items-center justify-center py-10">
          <div className="h-6 w-6 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
        </div>
      ) : !chapter ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">Chapter not found.</CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <CardTitle className="break-words">{chapter.title}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {chapter.description || 'No description'}
                  </p>
                </div>
                <div className="flex items-center gap-2 flex-wrap justify-end">
                  {chapter.isFree && (
                    <Badge variant="outline" className="text-xs">
                      Free
                    </Badge>
                  )}
                  {chapter.isPublished && (
                    <Badge variant="outline" className="bg-green-100 text-green-800 border-0 text-xs">
                      Published
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-xs capitalize">
                    {chapter.contentType}
                  </Badge>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Content</CardTitle>
            </CardHeader>
            <CardContent>
              <ChapterContent chapter={chapter} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ChapterDetailPage;

