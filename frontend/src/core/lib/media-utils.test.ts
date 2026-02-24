import { describe, it, expect } from 'vitest';
import { extractYoutubeVideoId, detectMediaType } from './media-utils';

describe('media-utils', () => {
    describe('extractYoutubeVideoId', () => {
        it('returns raw video ID when valid 11-char value is provided', () => {
            expect(extractYoutubeVideoId('dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
        });

        it('returns trimmed raw video ID', () => {
            expect(extractYoutubeVideoId('   dQw4w9WgXcQ   ')).toBe('dQw4w9WgXcQ');
        });

        it('extracts video ID from watch URL and youtu.be URL forms', () => {
            expect(extractYoutubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ')).toBe('dQw4w9WgXcQ');
            expect(extractYoutubeVideoId('https://youtu.be/dQw4w9WgXcQ?t=12')).toBe('dQw4w9WgXcQ');
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
