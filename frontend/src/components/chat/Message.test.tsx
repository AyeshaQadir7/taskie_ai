/**
 * Message Component Tests (T059)
 *
 * Tests for individual message display:
 * - User message styling (T053)
 * - Assistant message styling (T054)
 * - Timestamp display (T056)
 * - Tool call rendering (T055)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import Message from './Message';

describe('Message Component (T059)', () => {
  const userMessage = {
    id: 1,
    role: 'user' as const,
    content: 'Hello, what can you do?',
    created_at: new Date('2026-02-03T10:30:00Z').toISOString(),
    tool_calls: [],
  };

  const assistantMessage = {
    id: 2,
    role: 'assistant' as const,
    content: 'I can help with various tasks using MCP tools.',
    created_at: new Date('2026-02-03T10:31:00Z').toISOString(),
    tool_calls: [],
  };

  const messageWithToolCall = {
    id: 3,
    role: 'assistant' as const,
    content: 'I used a tool to get that information.',
    created_at: new Date('2026-02-03T10:32:00Z').toISOString(),
    tool_calls: [
      {
        id: 1,
        tool_name: 'ExampleTool',
        parameters: { query: 'test' },
        result: { data: 'result' },
        executed_at: new Date('2026-02-03T10:32:05Z').toISOString(),
      },
    ],
  };

  describe('User Message (T053)', () => {
    it('should render user message with correct styling', () => {
      render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      const messageContent = screen.getByText('Hello, what can you do?');
      expect(messageContent).toBeInTheDocument();

      // Check styling (should be on right side with blue background)
      const messageContainer = messageContent.closest('.bg-blue-600');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should display "You" label for user messages', () => {
      render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      expect(screen.getByText('You')).toBeInTheDocument();
    });

    it('should display message timestamp', () => {
      render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      // Timestamp should be formatted as HH:mm
      expect(screen.getByText(/10:30/)).toBeInTheDocument();
    });
  });

  describe('Assistant Message (T054)', () => {
    it('should render assistant message with correct styling', () => {
      render(
        <Message
          message={assistantMessage}
          isFirst={false}
          isLast={true}
        />
      );

      const messageContent = screen.getByText(
        'I can help with various tasks using MCP tools.'
      );
      expect(messageContent).toBeInTheDocument();

      // Check styling (should be on left side with gray background)
      const messageContainer = messageContent.closest('.bg-gray-200');
      expect(messageContainer).toBeInTheDocument();
    });

    it('should display "Assistant" label for assistant messages', () => {
      render(
        <Message
          message={assistantMessage}
          isFirst={false}
          isLast={true}
        />
      );

      expect(screen.getByText('Assistant')).toBeInTheDocument();
    });

    it('should display different styling than user messages', () => {
      const { rerender } = render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      let userContainer = screen.getByText(userMessage.content).closest('div');
      let userBgClass = userContainer?.className.includes('bg-blue-600');

      rerender(
        <Message
          message={assistantMessage}
          isFirst={false}
          isLast={true}
        />
      );

      let assistantContainer = screen
        .getByText(assistantMessage.content)
        .closest('div');
      let assistantBgClass = assistantContainer?.className.includes(
        'bg-gray-200'
      );

      expect(userBgClass).toBe(true);
      expect(assistantBgClass).toBe(true);
    });
  });

  describe('Timestamp Display (T056)', () => {
    it('should format and display timestamp in HH:mm format', () => {
      render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      expect(screen.getByText(/10:30/)).toBeInTheDocument();
    });

    it('should display timestamp for both user and assistant messages', () => {
      const { rerender } = render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      expect(screen.getByText(/10:30/)).toBeInTheDocument();

      rerender(
        <Message
          message={assistantMessage}
          isFirst={false}
          isLast={true}
        />
      );

      expect(screen.getByText(/10:31/)).toBeInTheDocument();
    });
  });

  describe('Tool Call Display (T055)', () => {
    it('should display tool calls section when present', () => {
      render(
        <Message
          message={messageWithToolCall}
          isFirst={false}
          isLast={true}
        />
      );

      expect(screen.getByText('Tools Used:')).toBeInTheDocument();
      expect(screen.getByText('ExampleTool')).toBeInTheDocument();
    });

    it('should not display tool calls section when empty', () => {
      render(
        <Message message={userMessage} isFirst={true} isLast={false} />
      );

      expect(screen.queryByText('Tools Used:')).not.toBeInTheDocument();
    });

    it('should display multiple tool calls', () => {
      const multiToolMessage = {
        ...assistantMessage,
        tool_calls: [
          {
            id: 1,
            tool_name: 'Tool1',
            parameters: { param: 'value1' },
            result: { data: 'result1' },
            executed_at: new Date().toISOString(),
          },
          {
            id: 2,
            tool_name: 'Tool2',
            parameters: { param: 'value2' },
            result: { data: 'result2' },
            executed_at: new Date().toISOString(),
          },
        ],
      };

      render(
        <Message message={multiToolMessage} isFirst={false} isLast={true} />
      );

      expect(screen.getByText('Tool1')).toBeInTheDocument();
      expect(screen.getByText('Tool2')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('should preserve whitespace in message content', () => {
      const messageWithWhitespace = {
        ...userMessage,
        content: 'Line 1\nLine 2\nLine 3',
      };

      render(
        <Message
          message={messageWithWhitespace}
          isFirst={true}
          isLast={false}
        />
      );

      const content = screen.getByText(/Line 1/);
      expect(content.className).toContain('whitespace-pre-wrap');
    });

    it('should handle long messages', () => {
      const longMessage = {
        ...userMessage,
        content: 'A'.repeat(500),
      };

      render(
        <Message message={longMessage} isFirst={true} isLast={false} />
      );

      expect(screen.getByText('A'.repeat(500))).toBeInTheDocument();
    });
  });
});
