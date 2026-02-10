/**
 * Retry Utilities - Exponential backoff retry logic (T062)
 *
 * Implements:
 * - Exponential backoff retry strategy
 * - Configurable retry attempts and delays
 * - Transient error detection
 * - Retry hooks for React components
 */

export interface RetryConfig {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

/**
 * Check if error is transient (likely to succeed on retry)
 */
export function isTransientError(error: Error | Response | unknown): boolean {
  // Network errors
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }

  // HTTP status codes that are transient
  if (error instanceof Response) {
    const status = error.status;
    return (
      status === 408 || // Request Timeout
      status === 429 || // Too Many Requests
      status === 500 || // Internal Server Error
      status === 502 || // Bad Gateway
      status === 503 || // Service Unavailable
      status === 504 // Gateway Timeout
    );
  }

  // Check if error object has status property
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    if (typeof status === 'number') {
      return (
        status === 408 ||
        status === 429 ||
        status === 500 ||
        status === 502 ||
        status === 503 ||
        status === 504
      );
    }
  }

  return false;
}

/**
 * Calculate exponential backoff delay
 */
export function calculateBackoffDelay(
  attempt: number,
  config: RetryConfig
): number {
  const initialDelay = config.initialDelayMs ?? 100;
  const maxDelay = config.maxDelayMs ?? 10000;
  const multiplier = config.backoffMultiplier ?? 2;

  const exponentialDelay = initialDelay * Math.pow(multiplier, attempt - 1);
  const delayWithJitter = exponentialDelay * (0.5 + Math.random() * 0.5);

  return Math.min(delayWithJitter, maxDelay);
}

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {}
): Promise<RetryResult<T>> {
  const maxAttempts = config.maxAttempts ?? 3;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const data = await fn();
      return { success: true, data, attempts: attempt };
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));

      // Don't retry if error is not transient
      if (!isTransientError(error)) {
        return { success: false, error: err, attempts: attempt };
      }

      // Don't retry if this was the last attempt
      if (attempt === maxAttempts) {
        return { success: false, error: err, attempts: attempt };
      }

      // Call retry callback if provided
      config.onRetry?.(attempt, err);

      // Wait before retrying
      const delayMs = calculateBackoffDelay(attempt, config);
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return {
    success: false,
    error: new Error('Max retry attempts exceeded'),
    attempts: maxAttempts,
  };
}

/**
 * Fetch with retry
 */
export async function fetchWithRetry(
  url: string,
  options?: RequestInit & { retryConfig?: RetryConfig }
): Promise<Response> {
  const { retryConfig, ...fetchOptions } = options || {};

  const result = await retryWithBackoff(
    () => fetch(url, fetchOptions),
    retryConfig
  );

  if (!result.success || !result.data) {
    throw result.error ?? new Error('Fetch failed');
  }

  return result.data;
}

/**
 * React hook for retry logic
 */
export function useRetry(config?: RetryConfig) {
  const [isRetrying, setIsRetrying] = React.useState(false);
  const [retryCount, setRetryCount] = React.useState(0);

  const execute = React.useCallback(
    async <T,>(fn: () => Promise<T>) => {
      setIsRetrying(true);
      setRetryCount(0);

      const configWithCallback = {
        ...config,
        onRetry: (attempt: number) => {
          setRetryCount(attempt);
          config?.onRetry?.(attempt, new Error('Retrying...'));
        },
      };

      const result = await retryWithBackoff(fn, configWithCallback);
      setIsRetrying(false);

      return result;
    },
    [config]
  );

  return { execute, isRetrying, retryCount };
}

// Re-export React for the hook
import React from 'react';
