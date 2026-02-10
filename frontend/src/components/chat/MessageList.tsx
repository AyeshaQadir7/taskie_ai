/* MessageList Component - Display messages in chronological order */

import React from 'react';
import Message from './Message';

interface ToolCall {
  id: number;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  executed_at: string;
}

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  tool_calls: ToolCall[];
}

interface MessageListProps {
  messages: ChatMessage[];
}

const MessageList: React.FC<MessageListProps> = ({ messages }) => {
  return (
    <div className="flex flex-col">
      {messages.map((message, index) => (
        <Message
          key={message.id}
          message={message}
          isFirst={index === 0}
          isLast={index === messages.length - 1}
        />
      ))}
    </div>
  );
};

export default MessageList;
