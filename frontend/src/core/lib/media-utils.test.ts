import { describe, it, expect } from 'vitest';
import {
  detectMediaType,
  extractYoutubeVideoId,
  getYoutubeEmbedUrl,
  isYoutubeVideoId,
} from './media-utils';

describe('media-utils', () => {
  describe('isYoutubeVideoId', () => {
    it('returns true for valid raw video IDs', () => {
      expect(isYoutubeVideoId('dQw4w9WgXcQ')).toBe(true);
      expect(isYoutubeVideoId('   dQw4w9WgXcQ   ')).toBe(true);
    });

    it('returns false for invalid values', () => {
      expect(isYoutubeVideoId('invalid-id')).toBe(false);
      expect(isYoutubeVideoId('')).toBe(false);
      expect(isYoutubeVideoId(undefined)).toBe(false);
    });
  });

  describe('extractYoutubeVideoId', () => {
    it('returns raw video ID when valid 11-char value is provided', () => {
      expect(extractYoutubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
    });

    it('extracts video ID from common YouTube URL forms', () => {
      expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeVideoId('https://www.youtube.com/shorts/dQw4w9WgXcQ?feature=share')).toBe('dQw4w9WgXcQ');
      expect(extractYoutubeVideoId('youtube.com/watch?v=dQw4w9WgXcQ&list=abc')).toBe('dQw4w9WgXcQ');
    });

    it('returns null for invalid YouTube input', () => {
      expect(extractYoutubeVideoId('https://example.com/video')).toBeNull();
      expect(extractYoutubeVideoId('not-a-youtube-value')).toBeNull();
    });
  });

  describe('getYoutubeEmbedUrl', () => {
    it('builds canonical embed URL from raw ID or URL', () => {
      expect(getYoutubeEmbedUrl('dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
      expect(getYoutubeEmbedUrl('https://youtu.be/dQw4w9WgXcQ')).toBe('https://www.youtube.com/embed/dQw4w9WgXcQ');
    });

    it('returns null for invalid input', () => {
      expect(getYoutubeEmbedUrl('invalid')).toBeNull();
    });
  });

  describe('detectMediaType', () => {
    it('detects youtube type from raw video ID input', () => {
      expect(detectMediaType('dQw4w9WgXcQ')).toBe('youtube');
    });

    it('keeps existing behavior for full youtube URLs', () => {
      expect(detectMediaType('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('youtube');
    });

    it('keeps existing behavior for non-youtube media types', () => {
      expect(detectMediaType('https://cdn.example.com/video.mp4')).toBe('video');
      expect(detectMediaType('https://cdn.example.com/audio.mp3')).toBe('audio');
      expect(detectMediaType('https://cdn.example.com/image.png')).toBe('image');
    });
  });
});
