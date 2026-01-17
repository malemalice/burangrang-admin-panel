import { Chapter, Quiz, Progress, ProgressStatus } from '../types/course.types';
import { cn } from '@/core/lib/utils';
import { CheckCircle, Circle, PlayCircle, FileQuestion } from 'lucide-react';

interface ChapterSidebarProps {
  chapters: Chapter[];
  quizzes?: Quiz[];
  progress: Progress[];
  currentChapterId: string;
  currentQuizId?: string;
  onChapterSelect: (chapterId: string) => void;
  onQuizSelect?: (quizId: string) => void;
  title: string;
}

const ChapterSidebar = ({
  chapters,
  quizzes = [],
  progress,
  currentChapterId,
  currentQuizId,
  onChapterSelect,
  onQuizSelect,
  title,
}: ChapterSidebarProps) => {
  const getChapterStatus = (chapterId: string) => {
    const chapterProgress = progress.find((p) => p.chapterId === chapterId);
    return chapterProgress?.status || ProgressStatus.NOT_STARTED;
  };

  return (
    <div className="flex flex-col h-full border-r bg-card">
      <div className="p-4 border-b">
        <h2 className="font-semibold text-lg line-clamp-2">{title}</h2>
        <div className="mt-2 text-sm text-muted-foreground">
          {progress.filter((p) => p.status === ProgressStatus.COMPLETED).length} / {chapters.length} Chapters Completed
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        <div className="flex flex-col">
          {chapters.map((chapter, index) => {
            const status = getChapterStatus(chapter.id);
            const isCurrent = chapter.id === currentChapterId;
            const isCompleted = status === ProgressStatus.COMPLETED;
            
            const chapterQuizzes = quizzes.filter(q => q.entity === 'CHAPTER' && q.entityId === chapter.id);

            return (
              <div key={chapter.id} className="flex flex-col border-b last:border-0">
                <button
                  onClick={() => onChapterSelect(chapter.id)}
                  className={cn(
                    "flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50",
                    isCurrent && "bg-accent hover:bg-accent border-l-4 border-l-primary pl-[13px]" // adjust padding for border
                  )}
                >
                  <div className="mt-0.5">
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : isCurrent ? (
                      <PlayCircle className="h-5 w-5 text-primary" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  
                  <div className="flex-1 space-y-1">
                    <div className={cn(
                      "text-sm font-medium leading-none",
                      isCompleted && "text-muted-foreground line-through",
                      isCurrent && "text-foreground"
                    )}>
                      {index + 1}. {chapter.title}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {chapter.duration} mins • {chapter.contentType}
                    </div>
                  </div>
                </button>

                {/* Chapter Quizzes */}
                {chapterQuizzes.map(quiz => {
                  const isQuizCurrent = quiz.id === currentQuizId;
                  return (
                    <button
                      key={quiz.id}
                      onClick={() => onQuizSelect && onQuizSelect(quiz.id)}
                      className={cn(
                        "flex items-start gap-3 p-4 pl-12 text-left transition-colors hover:bg-accent/50 border-t",
                        isQuizCurrent && "bg-accent hover:bg-accent border-l-4 border-l-primary pl-[45px]"
                      )}
                    >
                      <div className="mt-0.5">
                        {isQuizCurrent ? (
                          <PlayCircle className="h-4 w-4 text-primary" />
                        ) : (
                          <FileQuestion className="h-4 w-4 text-muted-foreground" />
                        )}
                      </div>
                      
                      <div className="flex-1 space-y-1">
                        <div className={cn(
                          "text-sm font-medium leading-none",
                          isQuizCurrent && "text-foreground"
                        )}>
                          Quiz: {quiz.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {quiz.duration ? `${quiz.duration} mins` : 'No time limit'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })}

          {/* Course Level Quizzes */}
          {quizzes.filter(q => q.entity === 'COURSE').length > 0 && (
            <div className="mt-4 pt-4 border-t px-4 pb-2">
              <h3 className="font-semibold text-sm mb-2 text-muted-foreground">Course Assessments</h3>
            </div>
          )}

          {quizzes.filter(q => q.entity === 'COURSE').map((quiz, index) => {
            const isCurrent = quiz.id === currentQuizId;
            
            return (
              <button
                key={quiz.id}
                onClick={() => onQuizSelect && onQuizSelect(quiz.id)}
                className={cn(
                  "flex items-start gap-3 p-4 text-left transition-colors hover:bg-accent/50 border-b last:border-0",
                  isCurrent && "bg-accent hover:bg-accent border-l-4 border-l-primary pl-[13px]"
                )}
              >
                <div className="mt-0.5">
                  {isCurrent ? (
                    <PlayCircle className="h-5 w-5 text-primary" />
                  ) : (
                    <FileQuestion className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex-1 space-y-1">
                  <div className={cn(
                    "text-sm font-medium leading-none",
                    isCurrent && "text-foreground"
                  )}>
                    {quiz.title}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {quiz.duration ? `${quiz.duration} mins` : 'No time limit'} • Passing: {quiz.passingScore}%
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ChapterSidebar;
