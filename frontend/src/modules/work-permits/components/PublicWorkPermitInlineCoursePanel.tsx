import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, ChevronRight, GraduationCap, Loader2 } from 'lucide-react';
import { Button } from '@/core/components/ui/button';
import { Progress as ProgressBar } from '@/core/components/ui/progress';
import { cn } from '@/core/lib/utils';
import ChapterContent from '@/modules/courses/components/ChapterContent';
import type { LearningContext } from '@/modules/courses/types/course.types';
import { ProgressStatus } from '@/modules/courses/types/course.types';
import type { Quiz } from '@/modules/quizzes/types/quiz.types';
import publicWorkPermitCourseService from '../services/publicWorkPermitCourseService';
import PublicWorkPermitQuizPlayer from './PublicWorkPermitQuizPlayer';

const SESSION_PREFIX = 'wp_public_course_ui:';

type UiState = {
  currentChapterId: string;
  currentQuizId: string;
  activeCourseId: string;
};

function readSession(token: string): Partial<UiState> | null {
  try {
    const raw = sessionStorage.getItem(SESSION_PREFIX + token.slice(0, 48));
    if (!raw) return null;
    return JSON.parse(raw) as Partial<UiState>;
  } catch {
    return null;
  }
}

function writeSession(token: string, state: UiState) {
  try {
    sessionStorage.setItem(SESSION_PREFIX + token.slice(0, 48), JSON.stringify(state));
  } catch {
    // ignore
  }
}

type Props = {
  permitToken: string;
  courseId: string;
  courseTitle?: string;
  onContextRefresh: () => void;
};

const PublicWorkPermitInlineCoursePanel = ({
  permitToken,
  courseId,
  courseTitle,
  onContextRefresh,
}: Props) => {
  const [loading, setLoading] = useState(true);
  const [ctx, setCtx] = useState<LearningContext | null>(null);
  const [currentChapterId, setCurrentChapterId] = useState('');
  const [currentQuizId, setCurrentQuizId] = useState('');

  const loadContext = useCallback(async (options?: { silent?: boolean }) => {
    const silent = options?.silent ?? false;
    if (!silent) {
      setLoading(true);
    }
    try {
      const data = await publicWorkPermitCourseService.getLearningContext(permitToken, courseId);
      setCtx(data);
      const ch = data.course.chapters || [];
      const stored = readSession(permitToken);
      if (stored?.activeCourseId === courseId) {
        if (stored.currentQuizId) {
          setCurrentQuizId(stored.currentQuizId);
          setCurrentChapterId('');
        } else if (stored.currentChapterId && ch.some((c) => c.id === stored.currentChapterId)) {
          setCurrentChapterId(stored.currentChapterId);
          setCurrentQuizId('');
        } else {
          setCurrentChapterId(data.currentChapterId || ch[0]?.id || '');
          setCurrentQuizId('');
        }
      } else {
        setCurrentChapterId(data.currentChapterId || ch[0]?.id || '');
        setCurrentQuizId('');
      }
    } catch (e) {
      console.error(e);
      toast.error('Failed to load course. Try refresh or return later.');
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [permitToken, courseId]);

  useEffect(() => {
    void loadContext();
  }, [loadContext]);

  useEffect(() => {
    if (!permitToken || !courseId) return;
    writeSession(permitToken, {
      activeCourseId: courseId,
      currentChapterId,
      currentQuizId,
    });
  }, [permitToken, courseId, currentChapterId, currentQuizId]);

  const handleCompleteChapter = async () => {
    if (!ctx || !currentChapterId) return;
    try {
      await publicWorkPermitCourseService.completeChapter(
        permitToken,
        courseId,
        currentChapterId,
      );
      await loadContext({ silent: true });
      onContextRefresh();
      toast.success('Chapter marked complete');
    } catch (e) {
      console.error(e);
      toast.error('Could not mark chapter complete');
    }
  };

  const startChapter = async (chapterId: string) => {
    if (!ctx) return;
    try {
      const p = ctx.progress.find((x) => x.chapterId === chapterId);
      if (!p || p.status === ProgressStatus.NOT_STARTED) {
        await publicWorkPermitCourseService.updateProgress(permitToken, courseId, chapterId, {
          status: ProgressStatus.IN_PROGRESS,
        });
        await loadContext({ silent: true });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCurrentQuizId('');
      setCurrentChapterId(chapterId);
    }
  };

  if (loading || !ctx) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading course…
      </div>
    );
  }

  const chapters = ctx.course.chapters || [];
  const quizzes = (ctx.quizzes || []) as Quiz[];
  const enrollmentProgress = Math.round(Number(ctx.enrollment?.progress ?? 0));
  const currentChapter = chapters.find((c) => c.id === currentChapterId);
  const currentQuiz = currentQuizId ? quizzes.find((q) => q.id === currentQuizId) : null;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-sm">
        <div className="flex items-center gap-2 min-w-0">
          <GraduationCap className="h-4 w-4 shrink-0 text-primary" />
          <span className="font-medium truncate">
            {ctx.course.title || courseTitle || 'Course'}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{enrollmentProgress}%</span>
          <ProgressBar value={enrollmentProgress} className="h-1.5 w-28" />
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Your progress is saved on this page. You can close and return with this link until it expires.
      </p>

      <div className="grid gap-3 md:grid-cols-[minmax(0,11rem)_1fr]">
        <div className="space-y-1 text-sm border rounded-md p-2 bg-muted/20 max-h-64 overflow-y-auto">
          <p className="text-xs font-medium text-muted-foreground px-1 py-0.5">Chapters</p>
          {chapters.map((ch) => {
            const pr = ctx.progress.find((p) => p.chapterId === ch.id);
            const done = pr?.status === ProgressStatus.COMPLETED;
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => {
                  void startChapter(ch.id);
                }}
                className={cn(
                  'w-full text-left rounded px-2 py-1.5 flex items-center gap-1 hover:bg-muted/80',
                  currentChapterId === ch.id && !currentQuizId && 'bg-primary/10 font-medium',
                )}
              >
                <ChevronRight className="h-3 w-3 shrink-0 opacity-50" />
                <span className="truncate">{ch.title}</span>
                {done ? <span className="text-primary text-xs ml-auto">OK</span> : null}
              </button>
            );
          })}
          {quizzes.length > 0 ? (
            <>
              <p className="text-xs font-medium text-muted-foreground px-1 pt-2 pb-0.5">Quizzes</p>
              {quizzes.map((q) => {
                const att = ctx.quizAttempts?.find((a) => a.quizId === q.id);
                const done = att?.status === 'COMPLETED' && (att as { isPassed?: boolean }).isPassed !== false;
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentQuizId(q.id);
                      setCurrentChapterId('');
                    }}
                    className={cn(
                      'w-full text-left rounded px-2 py-1.5 flex items-center gap-1 hover:bg-muted/80',
                      currentQuizId === q.id && 'bg-primary/10 font-medium',
                    )}
                  >
                    <BookOpen className="h-3 w-3 shrink-0 opacity-50" />
                    <span className="truncate">{q.title}</span>
                    {done ? <span className="text-primary text-xs ml-auto">Done</span> : null}
                  </button>
                );
              })}
            </>
          ) : null}
        </div>

        <div className="min-h-[200px] border rounded-md p-4 bg-card">
          {currentQuizId && currentQuiz ? (
            <PublicWorkPermitQuizPlayer
              permitToken={permitToken}
              courseId={courseId}
              quizId={currentQuizId}
              quizMeta={currentQuiz as Quiz}
              onComplete={() => {
                void loadContext({ silent: true });
                onContextRefresh();
              }}
            />
          ) : currentChapter ? (
            <div className="space-y-4">
              <div>
                <h4 className="text-base font-semibold">{currentChapter.title}</h4>
                {currentChapter.description ? (
                  <p className="text-sm text-muted-foreground mt-1">{currentChapter.description}</p>
                ) : null}
              </div>
              <ChapterContent chapter={currentChapter} />
              <div className="flex flex-wrap gap-2 justify-end border-t pt-3">
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  onClick={handleCompleteChapter}
                  disabled={
                    ctx.progress.find((p) => p.chapterId === currentChapterId)?.status ===
                    ProgressStatus.COMPLETED
                  }
                >
                  {ctx.progress.find((p) => p.chapterId === currentChapterId)?.status ===
                  ProgressStatus.COMPLETED
                    ? 'Completed'
                    : 'Mark as complete'}
                </Button>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Select a chapter or quiz to start.</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button type="button" variant="outline" size="sm" onClick={onContextRefresh}>
          Refresh permit status
        </Button>
      </div>
    </div>
  );
};

export default PublicWorkPermitInlineCoursePanel;
