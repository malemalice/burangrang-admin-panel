import { fireEvent, render, screen } from '@testing-library/react';
import { act } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChapterContent from './ChapterContent';
import { Chapter, ProgressStatus } from '../types/course.types';

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

  it('renders full controls when video progress is already completed on mount', () => {
    const chapter = createVideoChapter({});
    const { container } = render(
      <ChapterContent chapter={chapter} progressStatus={ProgressStatus.COMPLETED} />,
    );

    const video = container.querySelector('video') as HTMLVideoElement;
    expect(video).toBeInTheDocument();
    expect(video.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();
  });

  it('calls onVideoComplete when video ends', () => {
    const chapter = createVideoChapter({});
    const onVideoComplete = vi.fn();
    const { container } = render(
      <ChapterContent chapter={chapter} onVideoComplete={onVideoComplete} />,
    );

    const video = container.querySelector('video') as HTMLVideoElement;

    act(() => {
      video.dispatchEvent(new Event('ended'));
    });

    expect(video.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
    expect(onVideoComplete).toHaveBeenCalledTimes(1);
    expect(onVideoComplete).toHaveBeenCalledWith(chapter.id);
  });

  it('shows loading state after Play and clears it on playing', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue(undefined);

    const chapter = createVideoChapter({});
    const { container } = render(<ChapterContent chapter={chapter} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    });

    expect(screen.getByText('Loading video...')).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Play' })).not.toBeInTheDocument();

    const video = container.querySelector('video') as HTMLVideoElement;

    act(() => {
      video.dispatchEvent(new Event('playing'));
    });

    expect(screen.queryByText('Loading video...')).not.toBeInTheDocument();
    expect(screen.getByText('Complete this video to unlock full controls')).toBeInTheDocument();
  });

  it('restores Play/Restart overlay after play error', async () => {
    vi.spyOn(HTMLMediaElement.prototype, 'play').mockRejectedValue(new DOMException('AbortError'));

    const chapter = createVideoChapter({});
    const { container } = render(<ChapterContent chapter={chapter} />);

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Play' }));
    });

    // After play() rejects, loading clears and Play/Restart buttons return
    expect(screen.queryByText('Loading video...')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Restart' })).toBeInTheDocument();

    // Simulate browser error event after rejection
    const video = container.querySelector('video') as HTMLVideoElement;
    act(() => {
      video.dispatchEvent(new Event('error'));
    });

    // Still showing Play/Restart, not stuck in hint state
    expect(screen.getByRole('button', { name: 'Play' })).toBeInTheDocument();
    expect(screen.queryByText('Complete this video to unlock full controls')).not.toBeInTheDocument();
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

    act(() => {
      videoA.dispatchEvent(new Event('ended'));
    });

    expect(videoA.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();

    rerender(<ChapterContent chapter={chapterB} />);

    const videoB = container.querySelector('video') as HTMLVideoElement;
    expect(videoB).toBeInTheDocument();
    expect(videoB.controls).toBe(false);
    expect(screen.queryByText('Completed')).not.toBeInTheDocument();

    act(() => {
      videoB.dispatchEvent(new Event('ended'));
    });

    expect(videoB.controls).toBe(true);
    expect(screen.getByText('Completed')).toBeInTheDocument();
  });
});
