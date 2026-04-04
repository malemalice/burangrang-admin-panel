const YOUTUBE_VIDEO_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

export const isYoutubeVideoId = (value: string | null | undefined): boolean => {
  if (!value) return false;
  return YOUTUBE_VIDEO_ID_REGEX.test(value.trim());
};

/**
 * Extract YouTube video ID from supported URL formats or return the ID when already valid.
 */
export const extractYoutubeVideoId = (urlOrId: string | null | undefined): string | null => {
  if (!urlOrId) return null;

  const trimmed = urlOrId.trim();

  if (isYoutubeVideoId(trimmed)) {
    return trimmed;
  }

  const parseUrl = (value: string): URL | null => {
    try {
      return new URL(value);
    } catch {
      try {
        return new URL(`https://${value}`);
      } catch {
        return null;
      }
    }
  };

  const parsedUrl = parseUrl(trimmed);

  if (parsedUrl) {
    const hostname = parsedUrl.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);

    if (hostname === 'youtu.be') {
      const candidate = pathSegments[0];
      return isYoutubeVideoId(candidate) ? candidate : null;
    }

    if (hostname === 'youtube.com' || hostname === 'youtube-nocookie.com') {
      if (pathSegments[0] === 'watch') {
        const candidate = parsedUrl.searchParams.get('v');
        return isYoutubeVideoId(candidate) ? candidate : null;
      }

      if (['embed', 'v', 'shorts'].includes(pathSegments[0])) {
        const candidate = pathSegments[1];
        return isYoutubeVideoId(candidate) ? candidate : null;
      }
    }
  }

  const fallbackPatterns = [
    /(?:youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube(?:-nocookie)?\.com\/(?:embed|v|shorts)\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of fallbackPatterns) {
    const match = trimmed.match(pattern);
    if (match?.[1]) {
      return match[1];
    }
  }

  return null;
};

export const getYoutubeEmbedUrl = (urlOrId: string | null | undefined): string | null => {
  const videoId = extractYoutubeVideoId(urlOrId);
  return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
};

/**
 * Detect media type from URL or explicit type
 */
export type MediaType = 'audio' | 'video' | 'youtube' | 'image' | 'unknown';

export const detectMediaType = (
  url: string | null | undefined,
  explicitType?: string | null
): MediaType => {
  if (explicitType) {
    const type = explicitType.toLowerCase();
    if (type === 'audio' || type.includes('audio')) return 'audio';
    if (type === 'video' || type.includes('video')) return 'video';
    if (type === 'youtube') return 'youtube';
    if (type === 'image' || type.includes('image')) return 'image';
  }

  if (!url) return 'unknown';

  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('youtube.com') || lowerUrl.includes('youtu.be')) {
    return 'youtube';
  }

  if (extractYoutubeVideoId(url)) {
    return 'youtube';
  }

  if (/\.(mp3|wav|ogg|m4a|aac|flac|wma)(\?|$)/i.test(url)) {
    return 'audio';
  }

  if (/\.(mp4|webm|mov|avi|mkv|wmv|flv|m4v)(\?|$)/i.test(url)) {
    return 'video';
  }

  if (/\.(jpg|jpeg|png|gif|webp|svg|bmp|ico)(\?|$)/i.test(url)) {
    return 'image';
  }

  return 'unknown';
};

/**
 * Check if content contains HTML tags
 */
export const containsHtmlTags = (content: string | null | undefined): boolean => {
  if (!content) return false;
  return /<[a-z][\s\S]*>/i.test(content);
};
