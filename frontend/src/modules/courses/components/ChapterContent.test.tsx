import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChapterContent from './ChapterContent';
import { Chapter } from '../types/course.types';

const createVideoChapter = (overrides: Partial<Chapter>): Chapter => ({
  id: overrides.id ?? 'chapter-video-a',
  courseId: overrides.courseId ?? 'course-1',
  title: overrides.title ?? 'Video Chapter',
  description: overrides.description,
  order: overrides.order ?? 1,
  duration: overrides.duration ?? 120,
  contentType: 'video',
  contentUrl: overrides.contentUrl ?? 'https://cdn.example.com/video-a.mp4',
  youtubeVideoId: overrides.youtubeVideoId,
  content: overrides.content,
  isFree: overrides.isFree ?? true,
  isPublished: overrides.isPublished ?? true,
  publishedAt: overrides.publishedAt,
  isActive: overrides.isActive ?? true,
  createdAt: overrides.createdAt ?? '2026-01-01T00:00:00.000Z',
  updatedAt: overrides.updatedAt ?? '2026-01-01T00:00:00.000Z',
});

describe('ChapterContent - video controls completion state', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('resets controls and completion state when navigating to another video chapter', () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const chapterA = createVideoChapter({
      id: 'chapter-a',
      title: 'Chapter A',
      contentUrl: 'https://cdn.example.com/chapter-a.mp4',
    });
    const chapterB = createVideoChapter({
      id: 'chapter-b',
      title: 'Chapter B',
      contentUrl: 'https://cdn.example.com/chapter-b.mp4',
      order: 2,
    });

    const { container, rerender } = render(<ChapterContent chapter={chapterA} />);

    const videoA = container.querySelector('video') as HTMLVideoElement;
    expect(videoA).toBeInTheDocument();
    expect(videoA.controls).toBe(false);
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();

    videoA.dispatchEvent(new Event('ended'));

    expect(videoA.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    rerender(<ChapterContent chapter={chapterB} />);

    const videoB = container.querySelector('video') as HTMLVideoElement;
    expect(videoB).toBeInTheDocument();
    expect(videoB.controls).toBe(false);
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();

    videoB.dispatchEvent(new Event('ended'));

    expect(videoB.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
