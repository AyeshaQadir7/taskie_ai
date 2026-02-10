/* MessageInput Component - Modern AI chatbot style input */

import React, { useRef, useEffect } from 'react';
import { ArrowUp } from 'lucide-react';

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (message: string) => void;
  disabled?: boolean;
}

const MessageInput: React.FC<MessageInputProps> = ({
  value,
  onChange,
  onSend,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const maxHeight = 6 * 24; // ~6 rows
      textarea.style.height = `${Math.min(textarea.scrollHeight, maxHeight)}px`;
    }
  }, [value]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (value.trim() && !disabled) {
      onSend(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !disabled) {
      e.preventDefault();
      if (value.trim()) {
        onSend(value);
      }
    }
  };

  return (
    <div className="px-4 py-4">
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
        <div className="relative flex items-end border border-slate-light/20 rounded-2xl bg-gray-50/50 focus-within:bg-white focus-within:border-violet focus-within:shadow-lg focus-within:shadow-violet/5 transition-all duration-200">
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message Taskie..."
            disabled={disabled}
            rows={1}
            className="flex-1 px-4 py-3.5 bg-transparent border-none outline-none resize-none text-slate placeholder:text-slate-light/50 text-[15px] leading-6 disabled:cursor-not-allowed"
          />
          <button
            type="submit"
            disabled={disabled || !value.trim()}
            className="flex-shrink-0 m-2 w-9 h-9 rounded-xl bg-violet hover:bg-violet-dark disabled:bg-slate-light/30 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all duration-200 hover:shadow-md hover:shadow-violet/20"
            aria-label="Send message"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[11px] text-slate-light/40 text-center mt-2">
          Press Enter to send
        </p>
      </form>
    </div>
  );
};

export default MessageInput;
