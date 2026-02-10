/* Message Component - Individual message display (AI chatbot style) */

import React from 'react';
import { Grid2x2Check } from 'lucide-react';
import ToolCallDisplay from './ToolCallDisplay';

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

interface MessageProps {
  message: ChatMessage;
  isFirst: boolean;
  isLast: boolean;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="max-w-[80%] sm:max-w-[70%]">
          <div className="bg-violet text-white px-4 py-2 rounded-xl rounded-br-sm shadow-sm">
            <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
              {message.content}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-start gap-3 mb-4 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-violet flex items-center justify-center shadow-sm">
        <Grid2x2Check className="w-4 h-4 text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-[85%] sm:max-w-[75%]">
        <div className="text-slate bg-gray-200/60 px-4 py-2.5 rounded-2xl rounded-tl-sm">
          <p className="text-[15px] whitespace-pre-wrap break-words leading-relaxed">
            {message.content}
          </p>
        </div>

        {/* Tool Calls */}
        {message.tool_calls && message.tool_calls.length > 0 && (
          <div className="mt-2 space-y-2">
            {message.tool_calls.map((toolCall) => (
              <ToolCallDisplay key={toolCall.id} toolCall={toolCall} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
