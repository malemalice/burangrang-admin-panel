import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { Chapter, ProgressStatus } from '../types/course.types';
import { containsHtmlTags, getYoutubeEmbedUrl } from '@/core/lib/media-utils';
import { Button } from '@/core/components/ui/button';

interface VideoChapterPlayerProps {
  chapterId: string;
  src: string;
  title: string;
  isCompleted?: boolean;
  onVideoComplete?: (chapterId: string) => Promise<void> | void;
}

const isCompletedFromStatus = (status?: ProgressStatus) => status === ProgressStatus.COMPLETED;

const VideoChapterPlayer = ({
  chapterId,
  src,
  title,
  isCompleted = false,
  onVideoComplete,
}: VideoChapterPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hasCompletedRef = useRef(isCompleted);
  const hasRequestedPlaybackRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(isCompleted);
  const [isLoading, setIsLoading] = useState(false);
  const [hasRequestedPlayback, setHasRequestedPlayback] = useState(false);

  useEffect(() => {
    hasCompletedRef.current = hasCompleted;
  }, [hasCompleted]);

  useEffect(() => {
    hasRequestedPlaybackRef.current = hasRequestedPlayback;
  }, [hasRequestedPlayback]);

  useEffect(() => {
    hasCompletedRef.current = isCompleted;
    hasRequestedPlaybackRef.current = false;

    setHasCompleted(isCompleted);
    setIsPlaying(false);
    setIsLoading(false);
    setHasRequestedPlayback(false);
  }, [chapterId, src, isCompleted]);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const showLoadingIfPending = () => {
      if (hasRequestedPlaybackRef.current && !hasCompletedRef.current) {
        setIsLoading(true);
      }
    };

    const handlePlay = () => {
      setIsPlaying(true);
    };

    const handlePlaying = () => {
      setIsPlaying(true);
      setIsLoading(false);
    };

    const handleCanPlay = () => {
      if (hasRequestedPlaybackRef.current) {
        setIsLoading(false);
      }
    };

    const handlePause = () => {
      setIsPlaying(false);
      setIsLoading(false);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setHasRequestedPlayback(false);
      hasRequestedPlaybackRef.current = false;

      if (hasCompletedRef.current) {
        return;
      }

      hasCompletedRef.current = true;
      setHasCompleted(true);
      void onVideoComplete?.(chapterId);
    };

    const handleError = () => {
      setIsPlaying(false);
      setIsLoading(false);
      setHasRequestedPlayback(false);
      hasRequestedPlaybackRef.current = false;
    };

    videoElement.addEventListener('loadstart', showLoadingIfPending);
    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('waiting', showLoadingIfPending);
    videoElement.addEventListener('stalled', showLoadingIfPending);
    videoElement.addEventListener('playing', handlePlaying);
    videoElement.addEventListener('canplay', handleCanPlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);
    videoElement.addEventListener('error', handleError);

    return () => {
      videoElement.removeEventListener('loadstart', showLoadingIfPending);
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('waiting', showLoadingIfPending);
      videoElement.removeEventListener('stalled', showLoadingIfPending);
      videoElement.removeEventListener('playing', handlePlaying);
      videoElement.removeEventListener('canplay', handleCanPlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
      videoElement.removeEventListener('error', handleError);
    };
  }, [chapterId, onVideoComplete]);

  const requestPlayback = async (restart = false) => {
    if (!videoRef.current) {
      return;
    }

    setHasRequestedPlayback(true);
    setIsLoading(true);
    hasRequestedPlaybackRef.current = true;

    try {
      if (restart) {
        videoRef.current.currentTime = 0;
      }

      await videoRef.current.play();
    } catch {
      setIsLoading(false);
      setHasRequestedPlayback(false);
      hasRequestedPlaybackRef.current = false;
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-black">
      <video
        ref={videoRef}
        src={src}
        controls={hasCompleted}
        className="h-full w-full"
        controlsList="nodownload"
        playsInline
      />

      {!hasCompleted && isLoading && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/55 text-sm text-white">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading video...</span>
        </div>
      )}

      {!hasCompleted && !isPlaying && !isLoading && (
        <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/55">
          <Button type="button" onClick={() => void requestPlayback()}>
            Play
          </Button>
          <Button type="button" variant="outline" onClick={() => void requestPlayback(true)}>
            Restart
          </Button>
        </div>
      )}

      {!hasCompleted && isPlaying && !isLoading && (
        <div className="absolute bottom-3 right-3 rounded bg-black/60 px-2 py-1 text-xs text-white">
          Complete this video to unlock full controls
        </div>
      )}

      {hasCompleted && (
        <div className="absolute top-3 right-3 rounded bg-green-700/90 px-2 py-1 text-xs text-white">
          Completed
        </div>
      )}

      <span className="sr-only">{title}</span>
    </div>
  );
};

interface ChapterContentProps {
  chapter: Chapter;
  progressStatus?: ProgressStatus;
  onVideoComplete?: (chapterId: string) => Promise<void> | void;
}

const ChapterContent = ({ chapter, progressStatus, onVideoComplete }: ChapterContentProps) => {
  if (!chapter) return null;

  const contentType = chapter.contentType?.toLowerCase();
  const isCompleted = isCompletedFromStatus(progressStatus);

  const isEmptyRichText = (content: string) => {
    const normalized = content.replace(/\s+/g, '').replace(/&nbsp;/g, '');
    if (!normalized) return true;
    if (normalized === '<p></p>') return true;
    const textOnly = content.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, '').trim();
    return textOnly.length === 0 && /<p>\s*<\/p>/i.test(content);
  };

  switch (contentType) {
    case 'video':
      return chapter.contentUrl ? (
        <VideoChapterPlayer
          key={`${chapter.id}:${chapter.contentUrl}`}
          chapterId={chapter.id}
          src={chapter.contentUrl}
          title={chapter.title}
          isCompleted={isCompleted}
          onVideoComplete={onVideoComplete}
        />
      ) : (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          <div className="flex h-full items-center justify-center text-white">Video URL missing</div>
        </div>
      );

    case 'youtube': {
      const embedUrl = getYoutubeEmbedUrl(
        chapter.youtubeVideoId?.trim() || chapter.contentUrl?.trim(),
      );
      return (
        <div className="aspect-video w-full overflow-hidden rounded-lg bg-black">
          {embedUrl ? (
            <iframe
              width="100%"
              height="100%"
              src={embedUrl}
              title={chapter.title}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center gap-2 text-white">
              <p>Invalid YouTube Video</p>
              <p className="text-sm text-gray-400">Please check the video URL</p>
            </div>
          )}
        </div>
      );
    }

    case 'audio':
      return (
        <div className="flex flex-col items-center gap-4 rounded-lg border bg-card p-6">
          <div className="text-4xl">🎧</div>
          <h3 className="text-lg font-semibold">{chapter.title}</h3>
          {chapter.contentUrl ? (
            <audio src={chapter.contentUrl} controls className="w-full" />
          ) : (
            <p className="text-destructive">Audio URL missing</p>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="w-full overflow-hidden rounded-lg border">
          {chapter.contentUrl ? (
            <img
              src={chapter.contentUrl}
              alt={chapter.title}
              className="h-auto max-h-[600px] w-full object-contain"
            />
          ) : (
            <div className="bg-muted p-10 text-center text-muted-foreground">Image URL missing</div>
          )}
        </div>
      );

    case 'pdf':
      return (
        <div className="h-[800px] w-full overflow-hidden rounded-lg border bg-muted">
          {chapter.contentUrl ? (
            <iframe
              src={`${chapter.contentUrl}#toolbar=0`}
              className="h-full w-full"
              title={chapter.title}
            />
          ) : (
            <div className="flex h-full items-center justify-center">PDF URL missing</div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="prose max-w-none dark:prose-invert [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-border [&_th]:border [&_th]:border-border">
          {chapter.content ? (
            containsHtmlTags(chapter.content) ? (
              isEmptyRichText(chapter.content) ? (
                <p className="italic text-muted-foreground">No text content available.</p>
              ) : (
                <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
              )
            ) : (
              <div className="whitespace-pre-wrap">{chapter.content}</div>
            )
          ) : (
            <p className="italic text-muted-foreground">No text content available.</p>
          )}
        </div>
      );

    default:
      return (
        <div className="rounded-lg border bg-muted p-6 text-center">
          <p>Unsupported content type: {chapter.contentType}</p>
        </div>
      );
  }
};

export default ChapterContent;
