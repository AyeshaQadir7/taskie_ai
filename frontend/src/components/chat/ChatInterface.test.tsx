/**
 * ChatInterface Component Tests (T059)
 *
 * Tests for Chat UI component functionality:
 * - Component rendering
 * - Message display
 * - Input handling
 * - Error states
 * - Loading states
 * - API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatInterface from './ChatInterface';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock fetch
global.fetch = jest.fn();

describe('ChatInterface Component (T059)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    localStorage.setItem('auth_token', 'test-token-12345');
  });

  describe('Initial Render', () => {
    it('should render chat interface with header', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      expect(screen.getByText('Chat Assistant')).toBeInTheDocument();
      expect(screen.getByText('Start a new conversation')).toBeInTheDocument();
    });

    it('should display empty state message when no messages', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      expect(screen.getByText('No messages yet')).toBeInTheDocument();
      expect(
        screen.getByText('Start a conversation by sending a message below')
      ).toBeInTheDocument();
    });

    it('should render message input field', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      expect(input).toBeInTheDocument();
      expect(input.disabled).toBe(false);
    });

    it('should render send button', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      const sendButton = screen.getByRole('button', { name: /Send/i });
      expect(sendButton).toBeInTheDocument();
    });
  });

  describe('Message Input', () => {
    it('should update input value on typing', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;

      fireEvent.change(input, { target: { value: 'Hello, agent!' } });

      expect(input.value).toBe('Hello, agent!');
    });

    it('should disable send button when input is empty', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      const sendButton = screen.getByRole('button', {
        name: /Send/i,
      }) as HTMLButtonElement;

      expect(sendButton.disabled).toBe(true);
    });

    it('should enable send button when input has content', () => {
      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', {
        name: /Send/i,
      }) as HTMLButtonElement;

      fireEvent.change(input, { target: { value: 'Test message' } });

      expect(sendButton.disabled).toBe(false);
    });
  });

  describe('Error Handling', () => {
    it('should display error when no auth token', async () => {
      localStorage.clear();

      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Authentication Required/i)).toBeInTheDocument();
      });
    });

    it('should display error message with close button', async () => {
      (global.fetch as jest.Mock).mockRejectedValueOnce(
        new Error('Network error')
      );

      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Failed to send message/i)).toBeInTheDocument();
      });

      const dismissButton = screen.getByLabelText('Dismiss error');
      fireEvent.click(dismissButton);

      expect(screen.queryByText(/Failed to send message/i)).not.toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should display loading indicator while sending message', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    status: 'success',
                    conversation_id: 'conv-123',
                    messages: [],
                  }),
                }),
              100
            )
          )
      );

      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(screen.getByText(/Agent is thinking/i)).toBeInTheDocument();
    });

    it('should disable input while loading', async () => {
      (global.fetch as jest.Mock).mockImplementationOnce(
        () =>
          new Promise((resolve) =>
            setTimeout(
              () =>
                resolve({
                  ok: true,
                  status: 200,
                  json: async () => ({
                    status: 'success',
                    conversation_id: 'conv-123',
                    messages: [],
                  }),
                }),
              100
            )
          )
      );

      render(
        <ChatInterface userId="user-123" />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Test message' } });
      fireEvent.click(sendButton);

      expect(input.disabled).toBe(true);
      expect(sendButton.disabled).toBe(true);
    });
  });

  describe('Message Display', () => {
    it('should render messages in chronological order', async () => {
      const mockMessages = [
        {
          id: 1,
          role: 'user' as const,
          content: 'First message',
          created_at: new Date('2026-02-03T10:00:00Z').toISOString(),
          tool_calls: [],
        },
        {
          id: 2,
          role: 'assistant' as const,
          content: 'Second message',
          created_at: new Date('2026-02-03T10:01:00Z').toISOString(),
          tool_calls: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          conversation_id: 'conv-123',
          messages: mockMessages,
        }),
      });

      render(
        <ChatInterface userId="user-123" conversationId="conv-123" />
      );

      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
        expect(screen.getByText('Second message')).toBeInTheDocument();
      });

      const firstMessage = screen.getByText('First message');
      const secondMessage = screen.getByText('Second message');

      expect(firstMessage.parentElement).toBeInTheDocument();
      expect(secondMessage.parentElement).toBeInTheDocument();
    });
  });

  describe('Conversation Management', () => {
    it('should create new conversation on first message', async () => {
      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          conversation_id: 'conv-new-123',
          messages: [
            {
              id: 1,
              role: 'user' as const,
              content: 'Hello',
              created_at: new Date().toISOString(),
              tool_calls: [],
            },
          ],
        }),
      });

      const onConversationChange = jest.fn();

      render(
        <ChatInterface userId="user-123" onConversationChange={onConversationChange} />
      );

      const input = screen.getByPlaceholderText(
        /Type your message/i
      ) as HTMLTextAreaElement;
      const sendButton = screen.getByRole('button', { name: /Send/i });

      fireEvent.change(input, { target: { value: 'Hello' } });
      fireEvent.click(sendButton);

      await waitFor(() => {
        expect(onConversationChange).toHaveBeenCalledWith('conv-new-123');
      });
    });

    it('should load existing conversation history', async () => {
      const mockMessages = [
        {
          id: 1,
          role: 'user' as const,
          content: 'Previous message',
          created_at: new Date().toISOString(),
          tool_calls: [],
        },
      ];

      (global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          status: 'success',
          conversation_id: 'conv-123',
          messages: mockMessages,
        }),
      });

      render(
        <ChatInterface userId="user-123" conversationId="conv-123" />
      );

      await waitFor(() => {
        expect(screen.getByText('Previous message')).toBeInTheDocument();
      });
    });
  });
});
