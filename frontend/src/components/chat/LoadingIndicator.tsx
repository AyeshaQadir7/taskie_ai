/* LoadingIndicator Component - Typing indicator with bouncing dots */

import React from 'react';

const LoadingIndicator: React.FC = () => {
  return (
    <div className="flex justify-start gap-3 mb-4 animate-fade-in">
      {/* Avatar */}
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-violet to-violet-dark flex items-center justify-center shadow-sm">
        <span className="text-white text-xs font-bold">T</span>
      </div>

      {/* Typing dots */}
      <div className="flex items-center gap-1.5 bg-gray-50/80 px-4 py-3 rounded-2xl rounded-tl-md">
        <span
          className="w-2 h-2 rounded-full bg-violet/50 animate-bounce-dot"
          style={{ animationDelay: '0ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-violet/50 animate-bounce-dot"
          style={{ animationDelay: '160ms' }}
        />
        <span
          className="w-2 h-2 rounded-full bg-violet/50 animate-bounce-dot"
          style={{ animationDelay: '320ms' }}
        />
      </div>
    </div>
  );
};

export default LoadingIndicator;
