/**
 * Error Logging Utilities - Telemetry and error tracking (T064)
 *
 * Implements:
 * - Structured error logging
 * - Error tracking service integration
 * - User session context
 * - Error breadcrumbs
 */

export interface ErrorLog {
  id: string;
  code: string;
  message: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  timestamp: string;
  context: Record<string, unknown>;
  stack?: string;
  userAgent: string;
  url: string;
  sessionId: string;
}

export interface ErrorBreadcrumb {
  message: string;
  timestamp: string;
  category: string;
  data?: Record<string, unknown>;
}

/**
 * Error Logger - Collects and sends error telemetry
 */
export class ErrorLogger {
  private sessionId: string;
  private breadcrumbs: ErrorBreadcrumb[] = [];
  private maxBreadcrumbs = 50;
  private errors: ErrorLog[] = [];
  private maxErrors = 100;

  constructor() {
    this.sessionId = this.generateSessionId();
  }

  /**
   * Generate unique session ID
   */
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log an error with context
   */
  logError(
    code: string,
    message: string,
    context?: Record<string, unknown>,
    severity: 'info' | 'warning' | 'error' | 'critical' = 'error'
  ): ErrorLog {
    const errorLog: ErrorLog = {
      id: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      code,
      message,
      severity,
      timestamp: new Date().toISOString(),
      context: context || {},
      stack: new Error().stack,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      sessionId: this.sessionId,
    };

    this.errors.push(errorLog);

    // Keep only last N errors
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // Send to tracking service
    this.sendToTrackingService(errorLog);

    // Log to console in development
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
      console.error(`[${code}] ${message}`, context);
    }

    return errorLog;
  }

  /**
   * Add breadcrumb for context tracking
   */
  addBreadcrumb(
    message: string,
    category: string = 'user-action',
    data?: Record<string, unknown>
  ): void {
    const breadcrumb: ErrorBreadcrumb = {
      message,
      timestamp: new Date().toISOString(),
      category,
      data,
    };

    this.breadcrumbs.push(breadcrumb);

    // Keep only last N breadcrumbs
    if (this.breadcrumbs.length > this.maxBreadcrumbs) {
      this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
    }
  }

  /**
   * Get breadcrumbs since a specific time
   */
  getBreadcrumbs(since?: string): ErrorBreadcrumb[] {
    if (!since) {
      return this.breadcrumbs;
    }

    const sinceTime = new Date(since).getTime();
    return this.breadcrumbs.filter(
      (crumb) => new Date(crumb.timestamp).getTime() >= sinceTime
    );
  }

  /**
   * Send error to tracking service
   */
  private sendToTrackingService(errorLog: ErrorLog): void {
    // TODO: Send to Sentry, DataDog, LogRocket, or similar service
    // Example: if (window.Sentry) Sentry.captureException(errorLog);

    // For now, just store it
    if (typeof window !== 'undefined') {
      (window as any).lastErrorLog = errorLog;
    }
  }

  /**
   * Get all logged errors
   */
  getErrors(): ErrorLog[] {
    return [...this.errors];
  }

  /**
   * Clear error history
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * Get error statistics
   */
  getStats(): Record<string, unknown> {
    const errorsByCode = this.errors.reduce(
      (acc, err) => {
        acc[err.code] = (acc[err.code] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const errorsBySeverity = this.errors.reduce(
      (acc, err) => {
        acc[err.severity] = (acc[err.severity] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalErrors: this.errors.length,
      errorsByCode,
      errorsBySeverity,
      sessionId: this.sessionId,
      sessionDuration: this.getSessionDuration(),
    };
  }

  /**
   * Get session duration in milliseconds
   */
  private getSessionDuration(): number {
    if (this.errors.length === 0) {
      return 0;
    }

    const firstError = new Date(this.errors[0].timestamp).getTime();
    const lastError = new Date(this.errors[this.errors.length - 1].timestamp).getTime();

    return lastError - firstError;
  }

  /**
   * Export errors for debugging
   */
  exportErrors(): string {
    return JSON.stringify(
      {
        sessionId: this.sessionId,
        errors: this.errors,
        breadcrumbs: this.breadcrumbs,
        stats: this.getStats(),
        exportedAt: new Date().toISOString(),
      },
      null,
      2
    );
  }
}

/**
 * Global error logger instance
 */
export const errorLogger = new ErrorLogger();

/**
 * Set up global error handlers
 */
export function setupGlobalErrorHandlers(): void {
  // Catch unhandled promise rejections
  if (typeof window !== 'undefined') {
    window.addEventListener('unhandledrejection', (event) => {
      errorLogger.logError(
        'UNHANDLED_REJECTION',
        event.reason?.message || String(event.reason),
        { reason: event.reason },
        'critical'
      );
    });

    // Catch global errors
    window.addEventListener('error', (event) => {
      errorLogger.logError(
        'GLOBAL_ERROR',
        event.message,
        {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
        'critical'
      );
    });
  }
}

/**
 * Log a user action
 */
export function logUserAction(action: string, data?: Record<string, unknown>): void {
  errorLogger.addBreadcrumb(`User: ${action}`, 'user-action', data);
}

/**
 * Log an API call
 */
export function logAPICall(
  method: string,
  url: string,
  status?: number,
  duration?: number
): void {
  errorLogger.addBreadcrumb(
    `API: ${method} ${url}`,
    'api-call',
    { method, url, status, duration }
  );
}

/**
 * Get last N errors
 */
export function getLastErrors(count: number = 10): ErrorLog[] {
  const errors = errorLogger.getErrors();
  return errors.slice(-count);
}

/**
 * Export all errors for debugging
 */
export function exportErrorDump(): string {
  return errorLogger.exportErrors();
}
