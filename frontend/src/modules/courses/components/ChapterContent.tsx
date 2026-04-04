import { Chapter } from '../types/course.types';
import { containsHtmlTags, getYoutubeEmbedUrl } from '@/core/lib/media-utils';

interface ChapterContentProps {
  chapter: Chapter;
}

const ChapterContent = ({ chapter }: ChapterContentProps) => {
  if (!chapter) return null;

  const contentType = chapter.contentType?.toLowerCase();

  switch (contentType) {
    case 'video':
      return (
        <div className="aspect-video w-full bg-black rounded-lg overflow-hidden">
          {chapter.contentUrl ? (
            <video 
              src={chapter.contentUrl} 
              controls 
              className="w-full h-full"
              controlsList="nodownload"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-white">
              Video URL missing
            </div>
          )}
        </div>
      );

    case 'youtube':
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
