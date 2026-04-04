import { describe, expect, it } from 'vitest';
import { canRetakeQuiz, getLatestAttempt, mergeAttemptHistory } from './QuizPlayer';

describe('QuizPlayer helpers', () => {
  describe('getLatestAttempt', () => {
    it('returns the attempt with the highest attempt number', () => {
      const latest = getLatestAttempt([
        { attemptNumber: 1, status: 'COMPLETED', score: 60, earnedPoints: 6, totalPoints: 10, isPassed: false },
        { attemptNumber: 3, status: 'COMPLETED', score: 90, earnedPoints: 9, totalPoints: 10, isPassed: true },
        { attemptNumber: 2, status: 'ABANDONED', score: 0, earnedPoints: 0, totalPoints: 10, isPassed: false },
      ]);

      expect(latest?.attemptNumber).toBe(3);
    });

    it('returns null when no attempts exist', () => {
      expect(getLatestAttempt([])).toBeNull();
    });
  });

  describe('canRetakeQuiz', () => {
    it('allows the first attempt when no history exists', () => {
      expect(canRetakeQuiz(1, null)).toBe(true);
    });

    it('blocks retake while an attempt is still in progress', () => {
      expect(
        canRetakeQuiz(3, {
          attemptNumber: 2,
          status: 'IN_PROGRESS',
          score: 0,
          earnedPoints: 0,
          totalPoints: 10,
          isPassed: false,
        }),
      ).toBe(false);
    });

    it('allows retake when latest completed attempt is below max attempts', () => {
      expect(
        canRetakeQuiz(3, {
          attemptNumber: 2,
          status: 'COMPLETED',
          score: 60,
          earnedPoints: 6,
          totalPoints: 10,
          isPassed: false,
        }),
      ).toBe(true);
    });

    it('blocks retake when latest completed attempt reaches max attempts', () => {
      expect(
        canRetakeQuiz(2, {
          attemptNumber: 2,
          status: 'COMPLETED',
          score: 85,
          earnedPoints: 17,
          totalPoints: 20,
          isPassed: true,
        }),
      ).toBe(false);
    });

    it('allows unlimited retakes when maxAttempts is not set', () => {
      expect(
        canRetakeQuiz(undefined, {
          attemptNumber: 5,
          status: 'COMPLETED',
          score: 70,
          earnedPoints: 7,
          totalPoints: 10,
          isPassed: true,
        }),
      ).toBe(true);
    });
  });

  describe('mergeAttemptHistory', () => {
    it('replaces duplicate attempts and keeps the latest at the front', () => {
      const merged = mergeAttemptHistory(
        [
          {
            id: 'a1',
            attemptNumber: 1,
            status: 'COMPLETED',
            score: 60,
            earnedPoints: 6,
            totalPoints: 10,
            isPassed: false,
          } as any,
          {
            id: 'a2',
            attemptNumber: 2,
            status: 'COMPLETED',
            score: 70,
            earnedPoints: 7,
            totalPoints: 10,
            isPassed: true,
          } as any,
        ],
        {
          id: 'a2',
          attemptNumber: 2,
          status: 'COMPLETED',
          score: 80,
          earnedPoints: 8,
          totalPoints: 10,
          isPassed: true,
        } as any,
      );

      expect(merged).toHaveLength(2);
      expect(merged[0].id).toBe('a2');
      expect(merged[0].score).toBe(80);
    });
  });
});
