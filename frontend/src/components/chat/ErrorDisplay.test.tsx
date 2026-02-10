/**
 * ErrorDisplay Component Tests (T059)
 *
 * Tests for error message display:
 * - Error message display (T058)
 * - Error code display (T058)
 * - Dismissal button (T058)
 * - Error styling (T058)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ErrorDisplay from './ErrorDisplay';

describe('ErrorDisplay Component (T059)', () => {
  const mockOnDismiss = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering (T058)', () => {
    it('should render error display with message', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Please log in to continue"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
    });

    it('should display error code', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Please log in to continue"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(/Code: NO_AUTH/)).toBeInTheDocument();
    });

    it('should display error icon', () => {
      const { container } = render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Please log in to continue"
          onDismiss={mockOnDismiss}
        />
      );

      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should display dismiss button', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Please log in to continue"
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toBeInTheDocument();
    });
  });

  describe('Error Code Handling', () => {
    it('should display correct title for NO_AUTH error', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    });

    it('should display correct title for UNAUTHORIZED error', () => {
      render(
        <ErrorDisplay
          code="UNAUTHORIZED"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Session Expired')).toBeInTheDocument();
    });

    it('should display correct title for FORBIDDEN error', () => {
      render(
        <ErrorDisplay
          code="FORBIDDEN"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Access Denied')).toBeInTheDocument();
    });

    it('should display correct title for NOT_FOUND error', () => {
      render(
        <ErrorDisplay
          code="NOT_FOUND"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Not Found')).toBeInTheDocument();
    });

    it('should display correct title for AGENT_TIMEOUT error', () => {
      render(
        <ErrorDisplay
          code="AGENT_TIMEOUT"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Agent Timeout')).toBeInTheDocument();
    });

    it('should display correct title for SEND_ERROR', () => {
      render(
        <ErrorDisplay
          code="SEND_ERROR"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Failed to Send Message')).toBeInTheDocument();
    });

    it('should display correct title for FETCH_ERROR', () => {
      render(
        <ErrorDisplay
          code="FETCH_ERROR"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Failed to Load Conversation')).toBeInTheDocument();
    });

    it('should display generic title for unknown error code', () => {
      render(
        <ErrorDisplay
          code="UNKNOWN_ERROR"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText('Error')).toBeInTheDocument();
    });
  });

  describe('Dismissal (T058)', () => {
    it('should call onDismiss when dismiss button is clicked', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      fireEvent.click(dismissButton);

      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
    });

    it('should have accessible dismiss button', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveAttribute('aria-label');
    });
  });

  describe('Styling (T058)', () => {
    it('should use red color scheme', () => {
      const { container } = render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('bg-red-50');
      expect(wrapper?.className).toContain('border-red-300');
    });

    it('should display error title in red text', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const title = screen.getByText('Authentication Required');
      expect(title.className).toContain('text-red-800');
    });

    it('should display error message in red text', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const message = screen.getByText('Test message');
      expect(message.className).toContain('text-red-700');
    });

    it('should display error code in small gray text', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const code = screen.getByText(/Code: NO_AUTH/);
      expect(code.className).toContain('text-red-600');
      expect(code.className).toContain('text-xs');
    });

    it('should have consistent layout with flex', () => {
      const { container } = render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper?.className).toContain('flex');
      expect(wrapper?.className).toContain('items-start');
    });
  });

  describe('Multi-line Error Messages', () => {
    it('should handle long error messages', () => {
      const longMessage = 'This is a very long error message that should wrap to multiple lines when displayed in the error display component';

      render(
        <ErrorDisplay
          code="SEND_ERROR"
          message={longMessage}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });

    it('should preserve error message text exactly', () => {
      const message = 'Connection failed: Unable to reach server at localhost:8000';

      render(
        <ErrorDisplay
          code="SEND_ERROR"
          message={message}
          onDismiss={mockOnDismiss}
        />
      );

      expect(screen.getByText(message)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic structure', () => {
      const { container } = render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const wrapper = container.firstChild;
      expect(wrapper?.nodeName).toBe('DIV');
    });

    it('should have proper aria labels', () => {
      render(
        <ErrorDisplay
          code="NO_AUTH"
          message="Test message"
          onDismiss={mockOnDismiss}
        />
      );

      const dismissButton = screen.getByLabelText('Dismiss error');
      expect(dismissButton).toHaveAttribute('aria-label', 'Dismiss error');
    });
  });
});
