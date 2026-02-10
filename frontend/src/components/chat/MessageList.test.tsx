/**
 * MessageList Component Tests (T059)
 *
 * Tests for message list rendering:
 * - Chronological ordering (T049)
 * - Message rendering (T053-T056)
 * - Empty state (T049)
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import MessageList from './MessageList';

describe('MessageList Component (T059)', () => {
  const mockMessages = [
    {
      id: 1,
      role: 'user' as const,
      content: 'First user message',
      created_at: new Date('2026-02-03T10:00:00Z').toISOString(),
      tool_calls: [],
    },
    {
      id: 2,
      role: 'assistant' as const,
      content: 'First assistant response',
      created_at: new Date('2026-02-03T10:01:00Z').toISOString(),
      tool_calls: [],
    },
    {
      id: 3,
      role: 'user' as const,
      content: 'Second user message',
      created_at: new Date('2026-02-03T10:02:00Z').toISOString(),
      tool_calls: [],
    },
    {
      id: 4,
      role: 'assistant' as const,
      content: 'Second assistant response',
      created_at: new Date('2026-02-03T10:03:00Z').toISOString(),
      tool_calls: [],
    },
  ];

  describe('Rendering', () => {
    it('should render message list', () => {
      const { container } = render(<MessageList messages={mockMessages} />);

      expect(container.querySelector('.space-y-4')).toBeInTheDocument();
    });

    it('should render all messages', () => {
      render(<MessageList messages={mockMessages} />);

      expect(screen.getByText('First user message')).toBeInTheDocument();
      expect(screen.getByText('First assistant response')).toBeInTheDocument();
      expect(screen.getByText('Second user message')).toBeInTheDocument();
      expect(screen.getByText('Second assistant response')).toBeInTheDocument();
    });

    it('should handle empty message list', () => {
      const { container } = render(<MessageList messages={[]} />);

      const list = container.querySelector('.space-y-4');
      expect(list?.children.length).toBe(0);
    });

    it('should render single message', () => {
      const singleMessage = [mockMessages[0]];

      render(<MessageList messages={singleMessage} />);

      expect(screen.getByText('First user message')).toBeInTheDocument();
    });
  });

  describe('Chronological Ordering (T049)', () => {
    it('should render messages in chronological order (oldest to newest)', () => {
      render(<MessageList messages={mockMessages} />);

      const messages = screen.getAllByText(/user message|assistant response/);

      expect(messages[0].textContent).toContain('First user message');
      expect(messages[1].textContent).toContain('First assistant response');
      expect(messages[2].textContent).toContain('Second user message');
      expect(messages[3].textContent).toContain('Second assistant response');
    });

    it('should maintain order with unordered input', () => {
      const unorderedMessages = [
        mockMessages[2],
        mockMessages[0],
        mockMessages[3],
        mockMessages[1],
      ];

      render(<MessageList messages={unorderedMessages} />);

      // The MessageList component should display them in the order provided
      // (it expects pre-sorted messages from the backend)
      const messages = screen.getAllByText(/user message|assistant response/);

      expect(messages[0].textContent).toContain('Second user message');
      expect(messages[1].textContent).toContain('First user message');
    });

    it('should display many messages in order', () => {
      const manyMessages = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i + 1}`,
        created_at: new Date(
          '2026-02-03T10:00:00Z'.getTime() + i * 60000
        ).toISOString(),
        tool_calls: [],
      }));

      render(<MessageList messages={manyMessages} />);

      const firstMessage = screen.getByText('Message 1');
      const lastMessage = screen.getByText('Message 50');

      expect(firstMessage).toBeInTheDocument();
      expect(lastMessage).toBeInTheDocument();

      // Verify first appears before last in DOM
      const allMessages = screen.getAllByText(/Message \d+/);
      expect(allMessages[0].textContent).toContain('Message 1');
      expect(allMessages[allMessages.length - 1].textContent).toContain('Message 50');
    });
  });

  describe('Message Display (T053-T056)', () => {
    it('should render user messages with correct styling', () => {
      render(<MessageList messages={[mockMessages[0]]} />);

      expect(screen.getByText('You')).toBeInTheDocument();
      expect(screen.getByText('First user message')).toBeInTheDocument();
    });

    it('should render assistant messages with correct styling', () => {
      render(<MessageList messages={[mockMessages[1]]} />);

      expect(screen.getByText('Assistant')).toBeInTheDocument();
      expect(screen.getByText('First assistant response')).toBeInTheDocument();
    });

    it('should render timestamps for all messages', () => {
      render(<MessageList messages={mockMessages} />);

      const timestamps = screen.getAllByText(/10:/);
      expect(timestamps.length).toBe(4);
    });

    it('should render mixed user and assistant messages', () => {
      render(<MessageList messages={mockMessages} />);

      const youLabels = screen.getAllByText('You');
      const assistantLabels = screen.getAllByText('Assistant');

      expect(youLabels.length).toBe(2);
      expect(assistantLabels.length).toBe(2);
    });
  });

  describe('Tool Call Integration (T055)', () => {
    it('should render messages with tool calls', () => {
      const messagesWithTools = [
        {
          ...mockMessages[1],
          tool_calls: [
            {
              id: 1,
              tool_name: 'TestTool',
              parameters: { test: 'param' },
              result: { test: 'result' },
              executed_at: new Date().toISOString(),
            },
          ],
        },
      ];

      render(<MessageList messages={messagesWithTools} />);

      expect(screen.getByText('Tools Used:')).toBeInTheDocument();
      expect(screen.getByText('TestTool')).toBeInTheDocument();
    });

    it('should not display tools section when no tool calls', () => {
      render(<MessageList messages={mockMessages} />);

      expect(screen.queryByText('Tools Used:')).not.toBeInTheDocument();
    });

    it('should handle multiple messages with and without tool calls', () => {
      const mixedMessages = [
        mockMessages[0],
        {
          ...mockMessages[1],
          tool_calls: [
            {
              id: 1,
              tool_name: 'Tool1',
              parameters: {},
              result: { success: true },
              executed_at: new Date().toISOString(),
            },
          ],
        },
        mockMessages[2],
      ];

      render(<MessageList messages={mixedMessages} />);

      expect(screen.getByText('Tool1')).toBeInTheDocument();
      expect(screen.getByText('First user message')).toBeInTheDocument();
      expect(screen.getByText('Second user message')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should render messages with semantic structure', () => {
      const { container } = render(<MessageList messages={mockMessages} />);

      const listContainer = container.querySelector('.flex.flex-col');
      expect(listContainer).toBeInTheDocument();
    });

    it('should maintain proper hierarchy', () => {
      const { container } = render(<MessageList messages={mockMessages} />);

      const messageContainers = container.querySelectorAll('.animate-fade-in');
      expect(messageContainers.length).toBe(mockMessages.length);
    });
  });

  describe('Performance', () => {
    it('should efficiently render large message lists', () => {
      const largeMessageList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        role: i % 2 === 0 ? ('user' as const) : ('assistant' as const),
        content: `Message ${i + 1}`,
        created_at: new Date(
          '2026-02-03T10:00:00Z'.getTime() + i * 60000
        ).toISOString(),
        tool_calls: [],
      }));

      const { container } = render(<MessageList messages={largeMessageList} />);

      const messageElements = container.querySelectorAll('.animate-fade-in');
      expect(messageElements.length).toBe(100);
    });

    it('should handle rapid message updates', () => {
      const { rerender } = render(<MessageList messages={mockMessages.slice(0, 2)} />);

      expect(screen.getByText('First user message')).toBeInTheDocument();

      rerender(<MessageList messages={mockMessages} />);

      expect(screen.getByText('Second user message')).toBeInTheDocument();
      expect(screen.getByText('Second assistant response')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle messages with very long content', () => {
      const longMessage = {
        ...mockMessages[0],
        content: 'A'.repeat(1000),
      };

      render(<MessageList messages={[longMessage]} />);

      expect(screen.getByText('A'.repeat(1000))).toBeInTheDocument();
    });

    it('should handle messages with special characters', () => {
      const specialMessage = {
        ...mockMessages[0],
        content: 'Hello <script> & "quotes" \'single\' test',
      };

      render(<MessageList messages={[specialMessage]} />);

      expect(
        screen.getByText('Hello <script> & "quotes" \'single\' test')
      ).toBeInTheDocument();
    });

    it('should handle messages with newlines and whitespace', () => {
      const multilineMessage = {
        ...mockMessages[0],
        content: 'Line 1\n\nLine 3 (with gap above)\n\t\tIndented line',
      };

      render(<MessageList messages={[multilineMessage]} />);

      const content = screen.getByText(/Line 1/);
      expect(content.className).toContain('whitespace-pre-wrap');
    });
  });
});
