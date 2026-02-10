/**
 * Error Messages Utilities Tests (T063)
 *
 * Tests for user-friendly error messages
 */

import {
  getErrorMessage,
  getErrorColor,
  getErrorIcon,
  formatErrorForLogging,
  shouldAutoRetry,
  getRetryDelay,
} from './errorMessages';

describe('errorMessages (T063)', () => {
  describe('getErrorMessage', () => {
    it('should return message for NO_AUTH error', () => {
      const msg = getErrorMessage('NO_AUTH');
      expect(msg.title).toBe('Authentication Required');
      expect(msg.severity).toBe('warning');
      expect(msg.recoverySteps).toBeDefined();
      expect(msg.recoverySteps?.length).toBeGreaterThan(0);
    });

    it('should return message for UNAUTHORIZED error', () => {
      const msg = getErrorMessage('UNAUTHORIZED');
      expect(msg.title).toBe('Session Expired');
      expect(msg.severity).toBe('warning');
    });

    it('should return message for FORBIDDEN error', () => {
      const msg = getErrorMessage('FORBIDDEN');
      expect(msg.title).toBe('Access Denied');
      expect(msg.severity).toBe('error');
    });

    it('should return message for NOT_FOUND error', () => {
      const msg = getErrorMessage('NOT_FOUND');
      expect(msg.title).toBe('Not Found');
      expect(msg.severity).toBe('error');
    });

    it('should return message for AGENT_TIMEOUT error', () => {
      const msg = getErrorMessage('AGENT_TIMEOUT');
      expect(msg.title).toBe('Agent Timeout');
      expect(msg.severity).toBe('warning');
    });

    it('should return message for SEND_ERROR', () => {
      const msg = getErrorMessage('SEND_ERROR');
      expect(msg.title).toBe('Failed to Send Message');
      expect(msg.severity).toBe('error');
    });

    it('should return message for FETCH_ERROR', () => {
      const msg = getErrorMessage('FETCH_ERROR');
      expect(msg.title).toBe('Failed to Load Conversation');
      expect(msg.severity).toBe('error');
    });

    it('should return generic message for unknown error code', () => {
      const msg = getErrorMessage('UNKNOWN_CODE');
      expect(msg.title).toBe('Something Went Wrong');
      expect(msg.severity).toBe('error');
    });

    it('should use original message when provided', () => {
      const originalMsg = 'Custom error details';
      const msg = getErrorMessage('SEND_ERROR', originalMsg);
      expect(msg.message).toBe(originalMsg);
    });

    it('should include actionable help text', () => {
      const msg = getErrorMessage('NO_AUTH');
      expect(msg.help).toBeDefined();
      expect(msg.help?.length).toBeGreaterThan(0);
    });

    it('should include recovery steps', () => {
      const msg = getErrorMessage('UNAUTHORIZED');
      expect(msg.recoverySteps).toBeDefined();
      expect(Array.isArray(msg.recoverySteps)).toBe(true);
    });

    it('should have action and actionLabel', () => {
      const msg = getErrorMessage('NO_AUTH');
      expect(msg.action).toBeDefined();
      expect(msg.actionLabel).toBeDefined();
    });
  });

  describe('getErrorColor', () => {
    it('should return blue for info severity', () => {
      expect(getErrorColor('info')).toBe('blue');
    });

    it('should return yellow for warning severity', () => {
      expect(getErrorColor('warning')).toBe('yellow');
    });

    it('should return red for error severity', () => {
      expect(getErrorColor('error')).toBe('red');
    });

    it('should return red for critical severity', () => {
      expect(getErrorColor('critical')).toBe('red');
    });

    it('should return gray for unknown severity', () => {
      expect(getErrorColor('unknown' as any)).toBe('gray');
    });
  });

  describe('getErrorIcon', () => {
    it('should return info icon for info severity', () => {
      expect(getErrorIcon('info')).toBe('ℹ️');
    });

    it('should return warning icon for warning severity', () => {
      expect(getErrorIcon('warning')).toBe('⚠️');
    });

    it('should return error icon for error severity', () => {
      expect(getErrorIcon('error')).toBe('❌');
    });

    it('should return critical icon for critical severity', () => {
      expect(getErrorIcon('critical')).toBe('🚨');
    });
  });

  describe('formatErrorForLogging', () => {
    it('should format error with code and message', () => {
      const formatted = formatErrorForLogging('TEST_ERROR', 'Test message');
      expect(formatted.code).toBe('TEST_ERROR');
      expect(formatted.message).toBe('Test message');
    });

    it('should include timestamp', () => {
      const formatted = formatErrorForLogging('TEST_ERROR', 'Test message');
      expect(formatted.timestamp).toBeDefined();
      expect(typeof formatted.timestamp).toBe('string');
    });

    it('should include userAgent', () => {
      const formatted = formatErrorForLogging('TEST_ERROR', 'Test message');
      expect(formatted.userAgent).toBeDefined();
    });

    it('should include URL', () => {
      const formatted = formatErrorForLogging('TEST_ERROR', 'Test message');
      expect(formatted.url).toBeDefined();
    });

    it('should include stack trace if provided', () => {
      const stack = 'Error: test\n  at test.js:1';
      const formatted = formatErrorForLogging('TEST_ERROR', 'Test message', stack);
      expect(formatted.stack).toBe(stack);
    });
  });

  describe('shouldAutoRetry', () => {
    it('should return true for AGENT_TIMEOUT', () => {
      expect(shouldAutoRetry('AGENT_TIMEOUT')).toBe(true);
    });

    it('should return true for SEND_ERROR', () => {
      expect(shouldAutoRetry('SEND_ERROR')).toBe(true);
    });

    it('should return true for FETCH_ERROR', () => {
      expect(shouldAutoRetry('FETCH_ERROR')).toBe(true);
    });

    it('should return true for NETWORK_ERROR', () => {
      expect(shouldAutoRetry('NETWORK_ERROR')).toBe(true);
    });

    it('should return false for NO_AUTH', () => {
      expect(shouldAutoRetry('NO_AUTH')).toBe(false);
    });

    it('should return false for UNAUTHORIZED', () => {
      expect(shouldAutoRetry('UNAUTHORIZED')).toBe(false);
    });

    it('should return false for FORBIDDEN', () => {
      expect(shouldAutoRetry('FORBIDDEN')).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential delay', () => {
      const delay1 = getRetryDelay('SEND_ERROR', 1);
      const delay2 = getRetryDelay('SEND_ERROR', 2);
      const delay3 = getRetryDelay('SEND_ERROR', 3);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(2000);
      expect(delay3).toBe(4000);
    });

    it('should cap delay at 30 seconds', () => {
      const delay = getRetryDelay('SEND_ERROR', 10);
      expect(delay).toBeLessThanOrEqual(30000);
    });

    it('should work for different error codes', () => {
      const delay1 = getRetryDelay('AGENT_TIMEOUT', 1);
      const delay2 = getRetryDelay('NETWORK_ERROR', 1);

      expect(delay1).toBe(1000);
      expect(delay2).toBe(1000);
    });
  });
});
