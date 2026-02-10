/**
 * Error Message Utilities - User-friendly error messages with actions (T063)
 *
 * Implements:
 * - Error code to message mapping
 * - Contextual help text
 * - Recovery actions
 * - Error severity levels
 */

export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

export interface ErrorMessage {
  title: string;
  message: string;
  help?: string;
  action?: string;
  actionLabel?: string;
  severity: ErrorSeverity;
  recoverySteps?: string[];
}

/**
 * Get user-friendly error message with recovery actions
 */
export function getErrorMessage(
  code: string,
  originalMessage?: string
): ErrorMessage {
  const messages: Record<string, ErrorMessage> = {
    NO_AUTH: {
      title: 'Authentication Required',
      message: 'You need to log in to use the chat.',
      help: 'Your session may have expired or you were never logged in.',
      action: 'login',
      actionLabel: 'Go to Login',
      severity: 'warning',
      recoverySteps: [
        'Click the login button',
        'Enter your credentials',
        'Return to the chat',
      ],
    },
    UNAUTHORIZED: {
      title: 'Session Expired',
      message: 'Your session has expired. Please log in again.',
      help: 'This usually happens after a period of inactivity.',
      action: 'login',
      actionLabel: 'Login Again',
      severity: 'warning',
      recoverySteps: [
        'Click the login button',
        'You may need to enter your credentials again',
        'Return to continue your conversation',
      ],
    },
    FORBIDDEN: {
      title: 'Access Denied',
      message: 'You do not have permission to access this conversation.',
      help: 'This conversation may belong to another user or have been deleted.',
      action: 'new_chat',
      actionLabel: 'Start New Chat',
      severity: 'error',
      recoverySteps: [
        'Check if you have the correct conversation URL',
        'Start a new conversation',
        'Contact support if you believe this is an error',
      ],
    },
    NOT_FOUND: {
      title: 'Not Found',
      message: 'The conversation you are looking for does not exist.',
      help: 'The conversation may have been deleted or the ID may be incorrect.',
      action: 'new_chat',
      actionLabel: 'Start New Chat',
      severity: 'error',
      recoverySteps: [
        'Verify the conversation URL',
        'Start a new conversation',
        'Check your conversation history',
      ],
    },
    AGENT_TIMEOUT: {
      title: 'Agent Timeout',
      message: 'The agent took too long to respond (over 30 seconds).',
      help: 'This usually means the agent is processing a complex request.',
      action: 'retry',
      actionLabel: 'Try Again',
      severity: 'warning',
      recoverySteps: [
        'Click "Try Again" to send the message again',
        'Try a simpler or shorter message',
        'Contact support if this keeps happening',
      ],
    },
    SEND_ERROR: {
      title: 'Failed to Send Message',
      message: originalMessage || 'Could not send your message to the server.',
      help: 'This could be a temporary network issue.',
      action: 'retry',
      actionLabel: 'Retry',
      severity: 'error',
      recoverySteps: [
        'Check your internet connection',
        'Click "Retry" to try sending again',
        'If the problem persists, refresh the page',
      ],
    },
    FETCH_ERROR: {
      title: 'Failed to Load Conversation',
      message: originalMessage || 'Could not load the conversation history.',
      help: 'This might be a temporary network issue.',
      action: 'retry',
      actionLabel: 'Retry',
      severity: 'error',
      recoverySteps: [
        'Check your internet connection',
        'Click "Retry" to try loading again',
        'Refresh the page if the problem persists',
      ],
    },
    NETWORK_ERROR: {
      title: 'Network Error',
      message: 'Cannot reach the server. Check your internet connection.',
      help: 'This usually indicates a network connectivity issue.',
      action: 'retry',
      actionLabel: 'Retry',
      severity: 'error',
      recoverySteps: [
        'Check your internet connection',
        'Try again in a few moments',
        'Refresh the page if the problem persists',
      ],
    },
    UNKNOWN_ERROR: {
      title: 'Something Went Wrong',
      message: originalMessage || 'An unexpected error occurred.',
      help: 'Please try again or contact support if the problem persists.',
      action: 'retry',
      actionLabel: 'Retry',
      severity: 'error',
      recoverySteps: [
        'Try the action again',
        'Refresh the page',
        'Contact support if the problem persists',
      ],
    },
  };

  return messages[code] || messages.UNKNOWN_ERROR;
}

/**
 * Categorize error severity for styling
 */
export function getErrorColor(severity: ErrorSeverity): string {
  switch (severity) {
    case 'info':
      return 'blue';
    case 'warning':
      return 'yellow';
    case 'error':
      return 'red';
    case 'critical':
      return 'red';
    default:
      return 'gray';
  }
}

/**
 * Get icon for error severity
 */
export function getErrorIcon(severity: ErrorSeverity): string {
  switch (severity) {
    case 'info':
      return 'ℹ️';
    case 'warning':
      return '⚠️';
    case 'error':
      return '❌';
    case 'critical':
      return '🚨';
    default:
      return '❓';
  }
}

/**
 * Format error for logging
 */
export function formatErrorForLogging(
  code: string,
  message?: string,
  stack?: string
): Record<string, unknown> {
  return {
    code,
    message,
    stack,
    timestamp: new Date().toISOString(),
    userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    url: typeof window !== 'undefined' ? window.location.href : 'unknown',
  };
}

/**
 * Determine if error should be retried automatically
 */
export function shouldAutoRetry(code: string): boolean {
  const autoRetryErrors = [
    'AGENT_TIMEOUT',
    'SEND_ERROR',
    'FETCH_ERROR',
    'NETWORK_ERROR',
  ];
  return autoRetryErrors.includes(code);
}

/**
 * Determine retry delay based on error code
 */
export function getRetryDelay(code: string, attempt: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  const baseDelay = 1000;
  const delay = baseDelay * Math.pow(2, attempt - 1);

  // Cap at 30 seconds
  return Math.min(delay, 30000);
}
