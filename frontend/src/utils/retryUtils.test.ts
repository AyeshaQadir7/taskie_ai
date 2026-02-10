/**
 * Retry Utilities Tests (T062)
 *
 * Tests for exponential backoff retry logic
 */

import {
  isTransientError,
  calculateBackoffDelay,
  retryWithBackoff,
  fetchWithRetry,
} from './retryUtils';

describe('retryUtils (T062)', () => {
  describe('isTransientError', () => {
    it('should identify network errors as transient', () => {
      const error = new TypeError('fetch failed');
      expect(isTransientError(error)).toBe(true);
    });

    it('should identify timeout status as transient', () => {
      const response = new Response('', { status: 408 });
      expect(isTransientError(response)).toBe(true);
    });

    it('should identify rate limit as transient', () => {
      const response = new Response('', { status: 429 });
      expect(isTransientError(response)).toBe(true);
    });

    it('should identify server errors as transient', () => {
      expect(isTransientError(new Response('', { status: 500 }))).toBe(true);
      expect(isTransientError(new Response('', { status: 502 }))).toBe(true);
      expect(isTransientError(new Response('', { status: 503 }))).toBe(true);
      expect(isTransientError(new Response('', { status: 504 }))).toBe(true);
    });

    it('should not identify 404 as transient', () => {
      const response = new Response('', { status: 404 });
      expect(isTransientError(response)).toBe(false);
    });

    it('should not identify 401 as transient', () => {
      const response = new Response('', { status: 401 });
      expect(isTransientError(response)).toBe(false);
    });

    it('should handle error objects with status property', () => {
      const error = { status: 503 };
      expect(isTransientError(error)).toBe(true);
    });
  });

  describe('calculateBackoffDelay', () => {
    it('should calculate exponential backoff', () => {
      const delay1 = calculateBackoffDelay(1, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });
      const delay2 = calculateBackoffDelay(2, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
      });

      expect(delay2).toBeGreaterThan(delay1);
    });

    it('should apply max delay cap', () => {
      const delay = calculateBackoffDelay(10, {
        initialDelayMs: 100,
        backoffMultiplier: 2,
        maxDelayMs: 1000,
      });

      expect(delay).toBeLessThanOrEqual(1000);
    });

    it('should use default config when not provided', () => {
      const delay = calculateBackoffDelay(1, {});
      expect(delay).toBeGreaterThan(0);
      expect(delay).toBeLessThanOrEqual(10000); // default max
    });

    it('should add jitter to delay', () => {
      const delays = Array.from({ length: 10 }, (_, i) =>
        calculateBackoffDelay(1, { initialDelayMs: 100, maxDelayMs: 200 })
      );

      // All delays should be different due to jitter
      const uniqueDelays = new Set(delays);
      expect(uniqueDelays.size).toBeGreaterThan(1);
    });
  });

  describe('retryWithBackoff', () => {
    it('should succeed on first attempt', async () => {
      const fn = jest.fn().mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn);

      expect(result.success).toBe(true);
      expect(result.data).toBe('success');
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should retry on transient error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(2);
      expect(fn).toHaveBeenCalledTimes(2);
    });

    it('should not retry on non-transient error', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new Error('Invalid request'));

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(1);
      expect(fn).toHaveBeenCalledTimes(1);
    });

    it('should respect max attempts', async () => {
      const fn = jest
        .fn()
        .mockRejectedValue(new TypeError('fetch failed'));

      const result = await retryWithBackoff(fn, { maxAttempts: 3 });

      expect(result.success).toBe(false);
      expect(result.attempts).toBe(3);
      expect(fn).toHaveBeenCalledTimes(3);
    });

    it('should call onRetry callback', async () => {
      const onRetry = jest.fn();
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce('success');

      await retryWithBackoff(fn, { maxAttempts: 3, onRetry });

      expect(onRetry).toHaveBeenCalledTimes(1);
      expect(onRetry).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ message: 'fetch failed' })
      );
    });

    it('should succeed after multiple retries', async () => {
      const fn = jest
        .fn()
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce('success');

      const result = await retryWithBackoff(fn, { maxAttempts: 5 });

      expect(result.success).toBe(true);
      expect(result.attempts).toBe(3);
    });
  });

  describe('fetchWithRetry', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    it('should fetch with retry on network error', async () => {
      (global.fetch as jest.Mock)
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(new Response('success'));

      const response = await fetchWithRetry('/api/test', {
        retryConfig: { maxAttempts: 3 },
      });

      expect(response.ok).toBe(true);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    it('should pass through fetch options', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce(
        new Response('success')
      );

      await fetchWithRetry('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      expect(global.fetch).toHaveBeenCalledWith('/api/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should throw error if fetch fails after retries', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(
        new TypeError('Network failed')
      );

      await expect(
        fetchWithRetry('/api/test', { retryConfig: { maxAttempts: 2 } })
      ).rejects.toThrow();
    });
  });
});
