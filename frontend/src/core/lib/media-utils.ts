/**
 * Extract YouTube video ID from various URL formats or return the ID if already valid
 * Supports:
 * - youtube.com/watch?v=VIDEO_ID
 * - youtu.be/VIDEO_ID
 * - youtube.com/embed/VIDEO_ID
 * - youtube.com/v/VIDEO_ID
 * - youtube.com/shorts/VIDEO_ID
 * - Direct video ID (11 characters)
 */
export const extractYoutubeVideoId = (urlOrId: string | null | undefined): string | null => {
  if (!urlOrId) return null;

  const trimmed = urlOrId.trim();

  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtube\.com\/watch\?.*&v=)([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/v\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = trimmed.match(pattern);
    if (match) return match[1];
  }

  return null;
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
