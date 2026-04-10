import { useEffect, useRef, useState } from 'react';
import { Chapter } from '../types/course.types';
import { containsHtmlTags, getYoutubeEmbedUrl } from '@/core/lib/media-utils';
import { Button } from '@/core/components/ui/button';

interface VideoChapterPlayerProps {
  src: string;
  title: string;
}

const VideoChapterPlayer = ({ src, title }: VideoChapterPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => {
      setIsPlaying(false);
      setHasCompleted(true);
    };

    videoElement.addEventListener('play', handlePlay);
    videoElement.addEventListener('pause', handlePause);
    videoElement.addEventListener('ended', handleEnded);

    return () => {
      videoElement.removeEventListener('play', handlePlay);
      videoElement.removeEventListener('pause', handlePause);
      videoElement.removeEventListener('ended', handleEnded);
    };
  }, []);

  const handlePlay = async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      await videoRef.current.play();
    } catch {
      // Ignore autoplay/playback errors and keep UI consistent
    }
  };

  const handleRestart = async () => {
    if (!videoRef.current) {
      return;
    }

    try {
      videoRef.current.currentTime = 0;
      await videoRef.current.play();
    } catch {
      // Ignore playback errors and keep UI consistent
    }
  };

  return (
    <div className="aspect-video w-full bg-black rounded-lg overflow-hidden relative">
      <video
        ref={videoRef}
        src={src}
        controls={hasCompleted}
        className="w-full h-full"
        controlsList="nodownload"
        playsInline
      />

      {!hasCompleted && !isPlaying && (
        <div className="absolute inset-0 bg-black/55 flex items-center justify-center gap-3">
          <Button type="button" onClick={handlePlay}>
            Play
          </Button>
          <Button type="button" variant="outline" onClick={handleRestart}>
            Restart
          </Button>
        </div>
      )}

      {!hasCompleted && isPlaying && (
        <div className="absolute bottom-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          Complete this video to unlock full controls
        </div>
      )}

      {hasCompleted && (
        <div className="absolute top-3 right-3 bg-green-700/90 text-white text-xs px-2 py-1 rounded">
          Completed
        </div>
      )}

      <span className="sr-only">{title}</span>
    </div>
  );
};

interface ChapterContentProps {
  chapter: Chapter;
}

const ChapterContent = ({ chapter }: ChapterContentProps) => {
  if (!chapter) return null;

  const contentType = chapter.contentType?.toLowerCase();

  switch (contentType) {
    case 'video':
      return (
        chapter.contentUrl ? (
          <VideoChapterPlayer src={chapter.contentUrl} title={chapter.title} />
        ) : (
          <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
            <div className="flex items-center justify-center h-full text-white">
              Video URL missing
            </div>
          </div>
        )
      );

    case 'youtube': {
      const embedUrl = getYoutubeEmbedUrl(chapter.youtubeVideoId?.trim() || chapter.contentUrl?.trim());
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
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
            <div className="flex flex-col items-center justify-center h-full text-white gap-2">
              <p>Invalid YouTube Video</p>
              <p className="text-sm text-gray-400">Please check the video URL</p>
            </div>
          )}
        </div>
      );
    }

    case 'audio':
      return (
        <div className="bg-card p-6 rounded-lg border flex flex-col items-center gap-4">
          <div className="text-4xl">🎧</div>
          <h3 className="font-semibold text-lg">{chapter.title}</h3>
          {chapter.contentUrl ? (
            <audio src={chapter.contentUrl} controls className="w-full" />
          ) : (
            <p className="text-destructive">Audio URL missing</p>
          )}
        </div>
      );

    case 'image':
      return (
        <div className="w-full rounded-lg overflow-hidden border">
          {chapter.contentUrl ? (
            <img 
              src={chapter.contentUrl} 
              alt={chapter.title} 
              className="w-full h-auto object-contain max-h-[600px]"
            />
          ) : (
            <div className="p-10 text-center text-muted-foreground bg-muted">
              Image URL missing
            </div>
          )}
        </div>
      );

    case 'pdf':
      return (
        <div className="w-full h-[800px] rounded-lg overflow-hidden border bg-muted">
          {chapter.contentUrl ? (
            <iframe
              src={`${chapter.contentUrl}#toolbar=0`}
              className="w-full h-full"
              title={chapter.title}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              PDF URL missing
            </div>
          )}
        </div>
      );

    case 'text':
      return (
        <div className="prose max-w-none dark:prose-invert">
          {chapter.content ? (
            containsHtmlTags(chapter.content) ? (
              <div dangerouslySetInnerHTML={{ __html: chapter.content }} />
            ) : (
              <div className="whitespace-pre-wrap">{chapter.content}</div>
            )
          ) : (
            <p className="text-muted-foreground italic">No text content available.</p>
          )}
        </div>
      );

    default:
      return (
        <div className="p-6 border rounded-lg bg-muted text-center">
          <p>Unsupported content type: {chapter.contentType}</p>
        </div>
      );
  }
};

export default ChapterContent;
