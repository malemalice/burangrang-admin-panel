import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'sonner';
import { Loader2, ArrowLeft, PanelLeft } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/core/components/ui/sheet';
import enrollmentService from '@/modules/enrollments/services/enrollmentService';
import { useIsMobile } from '@/core/hooks/useIsMobile';
import ChapterSidebar from '../components/ChapterSidebar';
import ChapterContent from '../components/ChapterContent';
import QuizPlayer from '../components/QuizPlayer';
import { LearningContext, Progress, ProgressStatus } from '../types/course.types';
import progressService from '../services/progressService';

const CoursePlayerPage = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // Get enrollmentId from query params if available, or fetch user enrollments to find it
  // Since we don't have enrollmentId in URL params, we might need to find it
  // The backend getLearningContext expects ENROLLMENT ID, not COURSE ID
  // But our route is /courses/:courseId/learn
  // So we first need to find the enrollment ID for this course and user

  const [learningContext, setLearningContext] = useState<LearningContext | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentChapterId, setCurrentChapterId] = useState<string>('');
  const [currentQuizId, setCurrentQuizId] = useState<string>('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMobile = useIsMobile();

  const loadContext = async () => {
    try {
      // 1. Find enrollment for this course
      const userEnrollments = await enrollmentService.getUserEnrollments();
      const enrollment = userEnrollments.find(e => e.courseId === courseId);

      if (!enrollment) {
        toast.error('You are not enrolled in this course');
        navigate(`/courses/${courseId}`);
        return null;
      }

      // 2. Get full learning context
      const context = await enrollmentService.getLearningContext(enrollment.id);
      setLearningContext(context);
      return context;
    } catch (error: any) {
      console.error('Failed to load course:', error);
      toast.error('Failed to load course content');
      navigate(`/courses/${courseId}`);
      return null;
    }
  };

  useEffect(() => {
    const initPlayer = async () => {
      setIsLoading(true);
      const context = await loadContext();
      setIsLoading(false);

      if (context) {
        // 3. Determine initial chapter if not set via params
        const quizParam = searchParams.get('quiz');
        const chapterParam = searchParams.get('chapter');
        if (quizParam) {
          setCurrentQuizId(quizParam);
          setCurrentChapterId('');
        } else if (chapterParam) {
          setCurrentChapterId(chapterParam);
          setCurrentQuizId('');
        } else if (!currentChapterId && !currentQuizId) {
          // Find first incomplete chapter
          const chapters = context.course.chapters || [];
          const progress = context.progress || [];

          const firstIncomplete = chapters.find((ch: any) => {
            const p = progress.find((p: any) => p.chapterId === ch.id);
            return !p || p.status !== ProgressStatus.COMPLETED;
          });

          if (firstIncomplete) {
            setCurrentChapterId(firstIncomplete.id);
          } else if (chapters.length > 0) {
            setCurrentChapterId(chapters[0].id);
          }
        }
      }
    };

    if (courseId) {
      initPlayer();
    }
  }, [courseId]);

  // Update URL when chapter or quiz changes
  useEffect(() => {
    if (currentQuizId) {
      setSearchParams({ quiz: currentQuizId });
      return;
    }

    if (currentChapterId) {
      setSearchParams({ chapter: currentChapterId });

      // Also trigger start progress if not started
      if (learningContext) {
        const p = learningContext.progress.find(p => p.chapterId === currentChapterId);
        if (!p || p.status === ProgressStatus.NOT_STARTED) {
          // Fire and forget update
          progressService.updateProgress(learningContext.enrollment.id, currentChapterId, {
            status: ProgressStatus.IN_PROGRESS
          }).then(updatedProgress => {
            // Update local state
            setLearningContext(prev => {
              if (!prev) return null;
              const newProgress = [...prev.progress];
              const idx = newProgress.findIndex(p => p.chapterId === currentChapterId);
              if (idx >= 0) {
                newProgress[idx] = updatedProgress;
              } else {
                newProgress.push(updatedProgress);
              }
              return { ...prev, progress: newProgress };
            });
          });
        }
      }
    }
  }, [currentChapterId, currentQuizId, learningContext, setSearchParams]);

  const handleChapterSelect = (chapterId: string) => {
    setCurrentChapterId(chapterId);
    setCurrentQuizId('');
    setSidebarOpen(false);
  };

  const handleQuizSelect = (quizId: string) => {
    setCurrentQuizId(quizId);
    setCurrentChapterId('');
    setSidebarOpen(false);
  };

  const applyProgressUpdate = (updatedProgress: Progress) => {
    setLearningContext(prev => {
      if (!prev) return null;
      const newProgress = [...prev.progress];
      const idx = newProgress.findIndex(p => p.chapterId === updatedProgress.chapterId);
      if (idx >= 0) {
        newProgress[idx] = updatedProgress;
      } else {
        newProgress.push(updatedProgress);
      }
      return { ...prev, progress: newProgress };
    });
  };

  const persistChapterCompletion = async (
    chapterId: string,
    { autoAdvance }: { autoAdvance: boolean },
  ) => {
    if (!learningContext) return;

    const alreadyCompleted = learningContext.progress.find(
      p => p.chapterId === chapterId,
    )?.status === ProgressStatus.COMPLETED;

    if (alreadyCompleted) {
      if (autoAdvance) {
        const chapters = learningContext.course.chapters || [];
        const currentIndex = chapters.findIndex(c => c.id === chapterId);
        if (currentIndex < chapters.length - 1) {
          setCurrentChapterId(chapters[currentIndex + 1].id);
        }
      }
      return;
    }

    try {
      const updatedProgress = await progressService.completeChapter(
        learningContext.enrollment.id,
        chapterId,
      );
      applyProgressUpdate(updatedProgress);

      if (autoAdvance) {
        toast.success('Chapter completed!');
        const chapters = learningContext.course.chapters || [];
        const currentIndex = chapters.findIndex(c => c.id === chapterId);
        if (currentIndex < chapters.length - 1) {
          setCurrentChapterId(chapters[currentIndex + 1].id);
        }
      }
    } catch {
      toast.error('Failed to update progress');
    }
  };

  // Called by VideoChapterPlayer when video ends — persist without auto-advance
  const handleVideoComplete = (chapterId: string) => {
    void persistChapterCompletion(chapterId, { autoAdvance: false });
  };

  // Called by "Mark as Complete" button — persist and auto-advance
  const handleComplete = async () => {
    if (!currentChapterId) return;
    await persistChapterCompletion(currentChapterId, { autoAdvance: true });
  };

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!learningContext) return null;

  const currentChapter = learningContext.course.chapters?.find(c => c.id === currentChapterId);
  const currentQuiz = learningContext.quizzes?.find(q => q.id === currentQuizId);
  const currentChapterProgress = learningContext.progress.find(
    progress => progress.chapterId === currentChapterId,
  );

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-background">
      {/* Header */}
      <header className="flex h-14 items-center gap-4 border-b bg-card px-6">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/courses/${courseId}`)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="font-semibold truncate max-w-md" title={learningContext.course.title}>
          {learningContext.course.title}
        </h1>
        <div className="ml-auto flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <PanelLeft className="mr-2 h-4 w-4" /> Menu
          </Button>
          {(() => {
            const progressPct = Math.round(Number(learningContext.enrollment.progress || 0));

            return (
              <>
                <span className="text-sm text-muted-foreground">{progressPct}% Complete</span>
                <div className="h-2 w-32 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
              </>
            );
          })()}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
          <SheetContent side="left" className="w-full max-w-sm p-0 lg:hidden">
            <SheetHeader className="border-b px-4 py-3">
              <SheetTitle>Course navigation</SheetTitle>
            </SheetHeader>
            <div className="h-[calc(100vh-57px)] overflow-hidden">
              <ChapterSidebar
                chapters={learningContext.course.chapters || []}
                quizzes={learningContext.quizzes || []}
                progress={learningContext.progress}
                quizAttempts={learningContext.quizAttempts || []}
                currentChapterId={currentChapterId}
                currentQuizId={currentQuizId}
                onChapterSelect={handleChapterSelect}
                onQuizSelect={handleQuizSelect}
                title={learningContext.course.title}
              />
            </div>
          </SheetContent>
        </Sheet>

        <aside className="hidden w-80 flex-col border-r lg:flex">
          <ChapterSidebar
            chapters={learningContext.course.chapters || []}
            quizzes={learningContext.quizzes || []}
            progress={learningContext.progress}
            quizAttempts={learningContext.quizAttempts || []}
            currentChapterId={currentChapterId}
            currentQuizId={currentQuizId}
            onChapterSelect={handleChapterSelect}
            onQuizSelect={handleQuizSelect}
            title={learningContext.course.title}
          />
        </aside>

        {/* Main Content */}
        <main className={`flex-1 overflow-y-auto bg-muted/20 p-6 ${isMobile ? 'pb-24' : ''}`}>
          <div className="mx-auto max-w-4xl">
            {currentChapter ? (
              <div className="space-y-6">
                <div className="rounded-lg border bg-card p-6 shadow-sm">
                  <h2 className="text-2xl font-bold">{currentChapter.title}</h2>
                  <p className="mt-2 text-muted-foreground">{currentChapter.description}</p>
                </div>

                <ChapterContent
                  chapter={currentChapter}
                  progressStatus={currentChapterProgress?.status}
                  onVideoComplete={handleVideoComplete}
                />

                <div className="flex justify-between items-center pt-6 border-t">
                  <div className="flex gap-2">
                    {/* Previous Button Logic */}
                    {(() => {
                      const chapters = learningContext.course.chapters || [];
                      const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
                      const prevChapter = currentIndex > 0 ? chapters[currentIndex - 1] : null;

                      return (
                        <Button
                          variant="outline"
                          disabled={!prevChapter}
                          onClick={() => prevChapter && handleChapterSelect(prevChapter.id)}
                        >
                          Previous
                        </Button>
                      );
                    })()}
                  </div>

                  <div className="flex gap-2">
                    {/* Next Button Logic */}
                    {(() => {
                      const chapters = learningContext.course.chapters || [];
                      const currentIndex = chapters.findIndex(c => c.id === currentChapterId);
                      const nextChapter = currentIndex < chapters.length - 1 ? chapters[currentIndex + 1] : null;
                      const isCompleted =
                        currentChapterProgress?.status === ProgressStatus.COMPLETED;

                      return (
                        <>
                          {!isCompleted && (
                            <Button onClick={handleComplete}>
                              Mark as Complete
                            </Button>
                          )}

                          <Button
                            variant={isCompleted ? "default" : "outline"}
                            disabled={!nextChapter}
                            onClick={() => nextChapter && handleChapterSelect(nextChapter.id)}
                          >
                            Next
                          </Button>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            ) : currentQuiz ? (
              <QuizPlayer
                quizId={currentQuiz.id}
                enrollmentId={learningContext.enrollment.id}
                onComplete={async () => {
                  const ctx = await loadContext();
                  if (!ctx) return;

                  const chapters = ctx.course.chapters || [];
                  const quizzes = ctx.quizzes || [];

                  const currentQuizData = quizzes.find(q => q.id === currentQuizId);

                  if (currentQuizData?.entity === 'CHAPTER' && currentQuizData?.entityId) {
                    const chapterIndex = chapters.findIndex(c => c.id === currentQuizData.entityId);
                    if (chapterIndex >= 0 && chapterIndex < chapters.length - 1) {
                      setCurrentQuizId('');
                      setCurrentChapterId(chapters[chapterIndex + 1].id);
                      return;
                    }
                  }

                  const firstIncomplete = chapters.find((ch) => {
                    const p = ctx.progress.find((p) => p.chapterId === ch.id);
                    return !p || p.status !== ProgressStatus.COMPLETED;
                  });

                  if (firstIncomplete) {
                    setCurrentQuizId('');
                    setCurrentChapterId(firstIncomplete.id);
                  } else if (chapters.length > 0) {
                    setCurrentQuizId('');
                    setCurrentChapterId(chapters[0].id);
                  }
                }}
              />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-center py-20">
                <h2 className="text-2xl font-bold mb-2">Welcome to the Course!</h2>
                {((learningContext.course.chapters && learningContext.course.chapters.length > 0) || (learningContext.quizzes && learningContext.quizzes.length > 0)) ? (
                  <p className="text-muted-foreground mb-6">Select a chapter or quiz from the sidebar to begin learning.</p>
                ) : (
                  <div className="text-destructive mb-6">
                    <p className="font-semibold">No content available.</p>
                    <p className="text-sm">Please verify that the course has published chapters or quizzes.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default CoursePlayerPage;
