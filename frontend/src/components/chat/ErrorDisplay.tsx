/* ErrorDisplay Component - Styled error banner */

import React from 'react';
import { X, AlertCircle } from 'lucide-react';

interface ErrorDisplayProps {
  code: string;
  message: string;
  onDismiss: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  code,
  message,
  onDismiss,
}) => {
  const getErrorTitle = (code: string): string => {
    switch (code) {
      case 'NO_AUTH':
        return 'Authentication Required';
      case 'UNAUTHORIZED':
        return 'Session Expired';
      case 'FORBIDDEN':
        return 'Access Denied';
      case 'NOT_FOUND':
        return 'Not Found';
      case 'AGENT_TIMEOUT':
        return 'Agent Timeout';
      case 'SEND_ERROR':
        return 'Failed to Send Message';
      case 'FETCH_ERROR':
        return 'Failed to Load Conversation';
      default:
        return 'Error';
    }
  };

  return (
    <div className="mx-4 mb-3 max-w-3xl lg:mx-auto">
      <div className="bg-error/10 border border-error/20 rounded-md px-4 py-3 flex items-start gap-3">
        <AlertCircle className="w-5 h-5 text-error flex-shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-error">
            {getErrorTitle(code)}
          </h3>
          <p className="text-sm text-error/80 mt-0.5">{message}</p>
          <p className="text-xs text-error/50 mt-1 font-mono">Code: {code}</p>
        </div>
        <button
          onClick={onDismiss}
          className="flex-shrink-0 text-error/60 hover:text-error transition"
          aria-label="Dismiss error"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ErrorDisplay;
