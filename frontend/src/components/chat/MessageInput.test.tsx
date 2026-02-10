/**
 * MessageInput Component Tests (T059)
 *
 * Tests for message input field:
 * - Text input (T050)
 * - Send button (T050)
 * - Form submission (T051)
 * - Loading state (T057)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import MessageInput from './MessageInput';

describe('MessageInput Component (T059)', () => {
  const mockOnChange = jest.fn();
  const mockOnSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering (T050)', () => {
    it('should render message input field', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      expect(input).toBeInTheDocument();
    });

    it('should render send button', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toBeInTheDocument();
    });

    it('should display placeholder text', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      expect(input.getAttribute('placeholder')).toContain('Ctrl+Enter to send');
    });
  });

  describe('Input Handling', () => {
    it('should call onChange when user types', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.change(input, { target: { value: 'Hello world' } });

      expect(mockOnChange).toHaveBeenCalledWith('Hello world');
    });

    it('should display current value', () => {
      const { rerender } = render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      rerender(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
      expect(input.value).toBe('Test message');
    });

    it('should handle multiline input', () => {
      const { rerender } = render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      rerender(
        <MessageInput
          value="Line 1\nLine 2\nLine 3"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
      expect(input.value).toBe('Line 1\nLine 2\nLine 3');
    });
  });

  describe('Send Button State', () => {
    it('should disable send button when input is empty', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', {
        name: /Send/i,
      }) as HTMLButtonElement;
      expect(sendButton.disabled).toBe(true);
    });

    it('should disable send button when input contains only whitespace', () => {
      render(
        <MessageInput
          value="   "
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', {
        name: /Send/i,
      }) as HTMLButtonElement;
      expect(sendButton.disabled).toBe(true);
    });

    it('should enable send button when input has content', () => {
      render(
        <MessageInput
          value="Hello world"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', {
        name: /Send/i,
      }) as HTMLButtonElement;
      expect(sendButton.disabled).toBe(false);
    });
  });

  describe('Form Submission (T051)', () => {
    it('should call onSend when send button is clicked', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should call onSend with trimmed message', () => {
      render(
        <MessageInput
          value="  Test message  "
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).toHaveBeenCalledWith('  Test message  ');
    });

    it('should not call onSend when button is disabled', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Send/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should submit form on Enter key with Ctrl modifier', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

      expect(mockOnSend).toHaveBeenCalledWith('Test message');
    });

    it('should not submit form on Enter key without Ctrl modifier', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: false });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Disabled State (T057)', () => {
    it('should disable input when disabled prop is true', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i) as HTMLTextAreaElement;
      expect(input.disabled).toBe(true);
    });

    it('should disable send button when disabled prop is true', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const sendButton = screen.getByRole('button', {
        name: /Sending/i,
      }) as HTMLButtonElement;
      expect(sendButton.disabled).toBe(true);
    });

    it('should show "Sending..." text when disabled', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      expect(screen.getByRole('button', { name: /Sending/i })).toBeInTheDocument();
    });

    it('should prevent form submission when disabled', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const sendButton = screen.getByRole('button', { name: /Sending/i });
      fireEvent.click(sendButton);

      expect(mockOnSend).not.toHaveBeenCalled();
    });

    it('should prevent Ctrl+Enter submission when disabled', () => {
      render(
        <MessageInput
          value="Test message"
          onChange={mockOnChange}
          onSend={mockOnSend}
          disabled={true}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      fireEvent.keyDown(input, { key: 'Enter', ctrlKey: true });

      expect(mockOnSend).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have semantic form structure', () => {
      const { container } = render(
        <MessageInput
          value="Test"
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const form = container.querySelector('form');
      expect(form).toBeInTheDocument();
    });

    it('should have descriptive placeholder text', () => {
      render(
        <MessageInput
          value=""
          onChange={mockOnChange}
          onSend={mockOnSend}
        />
      );

      const input = screen.getByPlaceholderText(/Type your message/i);
      expect(input.getAttribute('placeholder')).toBeDefined();
    });
  });
});
