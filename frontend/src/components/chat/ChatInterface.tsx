/* ChatInterface Component - Modern AI chatbot layout */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import LoadingIndicator from './LoadingIndicator';
import ErrorDisplay from './ErrorDisplay';
import { Grid2x2Check, Plus, ListTodo, CheckCircle2, Trash2 } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  tool_calls: ToolCall[];
}

interface ToolCall {
  id: number;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  executed_at: string;
}

interface ChatResponse {
  status: 'success' | 'error';
  conversation_id: string;
  messages: ChatMessage[];
  error_code?: string;
  error_message?: string;
}

interface ChatInterfaceProps {
  userId: string;
  conversationId?: string;
  onConversationChange?: (conversationId: string) => void;
  maxMessages?: number;
}

const SUGGESTION_CHIPS = [
  { text: 'Add a new task', icon: Plus },
  { text: 'Show my tasks', icon: ListTodo },
  { text: 'Complete a task', icon: CheckCircle2 },
];

const STORAGE_KEY = 'taskie_chat_session';

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userId,
  conversationId: initialConversationId,
  onConversationChange,
  maxMessages = 100,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(
    initialConversationId || null
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<{ code: string; message: string } | null>(null);
  const [inputValue, setInputValue] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const loadingTimeoutRef = useRef<NodeJS.Timeout>(undefined);

  // Load session from localStorage on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const session = JSON.parse(saved);
        // Only restore if same user
        if (session.userId === userId) {
          setMessages(session.messages || []);
          setConversationId(session.conversationId || null);
        }
      }
    } catch {
      // Ignore parse errors
    }
  }, [userId]);

  // Save session to localStorage when messages change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (messages.length === 0 && !conversationId) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        userId,
        messages,
        conversationId,
      }));
    } catch {
      // Ignore storage errors
    }
  }, [messages, conversationId, userId]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const getAuthToken = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('auth_token');
  }, []);

  // Fetch conversation history
  useEffect(() => {
    const fetchHistory = async () => {
      if (!conversationId || !userId) return;

      try {
        const token = getAuthToken();
        if (!token) {
          setError({
            code: 'NO_AUTH',
            message: 'Please log in to view conversation history',
          });
          return;
        }

        const response = await fetch(
          `${API_BASE_URL}/api/${userId}/conversations/${conversationId}/history`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (response.status === 401) {
          setError({
            code: 'UNAUTHORIZED',
            message: 'Your session has expired. Please log in again.',
          });
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch conversation history');
        }

        const data: ChatResponse = await response.json();
        setMessages(data.messages);
      } catch (err) {
        setError({
          code: 'FETCH_ERROR',
          message: `Failed to load conversation: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      }
    };

    fetchHistory();
  }, [conversationId, userId, getAuthToken]);

  // Handle sending message
  const handleSendMessage = useCallback(
    async (message: string) => {
      if (!message.trim() || !userId) return;

      setInputValue('');
      setError(null);
      setIsLoading(true);

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }

      try {
        const token = getAuthToken();
        if (!token) {
          setError({
            code: 'NO_AUTH',
            message: 'Please log in to send messages',
          });
          setIsLoading(false);
          return;
        }

        const response = await fetch(`${API_BASE_URL}/api/${userId}/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            message: message.trim(),
            conversation_id: conversationId,
          }),
        });

        if (response.status === 401) {
          setError({
            code: 'UNAUTHORIZED',
            message: 'Your session has expired. Please log in again.',
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 403) {
          setError({
            code: 'FORBIDDEN',
            message: 'You do not have permission to access this conversation',
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 404) {
          setError({
            code: 'NOT_FOUND',
            message: 'Conversation not found',
          });
          setIsLoading(false);
          return;
        }

        if (response.status === 408) {
          setError({
            code: 'AGENT_TIMEOUT',
            message: 'The agent took too long to respond. Please try again.',
          });
          setIsLoading(false);
          return;
        }

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to send message');
        }

        const data: ChatResponse = await response.json();

        if (!conversationId && data.conversation_id) {
          setConversationId(data.conversation_id);
          onConversationChange?.(data.conversation_id);
        }

        setMessages(data.messages.slice(-maxMessages));
      } catch (err) {
        setError({
          code: 'SEND_ERROR',
          message: `Failed to send message: ${err instanceof Error ? err.message : 'Unknown error'}`,
        });
      } finally {
        setIsLoading(false);
      }
    },
    [userId, conversationId, getAuthToken, onConversationChange, maxMessages]
  );

  // Handle clearing chat history
  const handleClearChat = useCallback(() => {
    setMessages([]);
    setConversationId(null);
    setError(null);
    // Clear from localStorage
    if (typeof window !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, []);

  const isEmpty = messages.length === 0 && !isLoading;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty State - Welcome Screen */
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-4 max-w-lg">
              <div className="w-14 h-14 rounded-2xl bg-violet flex items-center justify-center mx-auto mb-5 shadow-lg shadow-violet/20">
                <Grid2x2Check className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-grotesk font-semibold text-slate mb-2">
                Hi! I'm Taskie
              </h2>
              <p className="text-base text-slate-light/70 mb-8">
                Your AI task assistant. What would you like to do?
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-3">
                {SUGGESTION_CHIPS.map((chip) => {
                  const Icon = chip.icon;
                  return (
                    <button
                      key={chip.text}
                      onClick={() => handleSendMessage(chip.text)}
                      className="group flex items-center gap-3 px-5 py-3.5 text-sm font-medium border border-slate-light/15 rounded-xl text-slate bg-white hover:border-violet hover:shadow-lg hover:shadow-violet/10 transition-all duration-200"
                    >
                      <span className="w-8 h-8 rounded-lg bg-violet/10 flex items-center justify-center group-hover:bg-violet group-hover:text-white transition-colors duration-200">
                        <Icon className="w-4 h-4 text-violet group-hover:text-white" />
                      </span>
                      <span>{chip.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          /* Messages */
          <div className="max-w-3xl mx-auto px-4 py-6">
            {/* Chat Header with Clear Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={handleClearChat}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-slate-light/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors duration-200"
                title="Clear chat history"
              >
                <Trash2 className="w-4 h-4" />
                <span>Clear chat</span>
              </button>
            </div>
            <MessageList messages={messages} />
            {isLoading && <LoadingIndicator />}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <ErrorDisplay
          code={error.code}
          message={error.message}
          onDismiss={() => setError(null)}
        />
      )}

      {/* Input Area - pinned to bottom */}
      <div className="border-t border-slate-light/10 bg-white/80 backdrop-blur-sm">
        <MessageInput
          value={inputValue}
          onChange={setInputValue}
          onSend={handleSendMessage}
          disabled={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatInterface;
