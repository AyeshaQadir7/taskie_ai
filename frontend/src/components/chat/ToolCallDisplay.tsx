/* ToolCallDisplay Component - Tool call visualization */

import React, { useState } from 'react';
import { ChevronRight, ChevronDown } from 'lucide-react';

interface ToolCall {
  id: number;
  tool_name: string;
  parameters: Record<string, unknown>;
  result?: Record<string, unknown>;
  executed_at: string;
}

interface ToolCallDisplayProps {
  toolCall: ToolCall;
}

const ToolCallDisplay: React.FC<ToolCallDisplayProps> = ({ toolCall }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const formatJson = (obj: Record<string, unknown>) => {
    return JSON.stringify(obj, null, 2);
  };

  return (
    <div className="bg-slate-light/5 rounded-base border border-slate-light/10 text-xs">
      {/* Tool Name Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 w-full text-left px-3 py-2 hover:bg-slate-light/10 rounded-base transition"
      >
        {isExpanded ? (
          <ChevronDown className="w-3.5 h-3.5 text-slate-light/60" />
        ) : (
          <ChevronRight className="w-3.5 h-3.5 text-slate-light/60" />
        )}
        <span className="text-violet font-medium">{toolCall.tool_name}</span>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* Parameters */}
          <div>
            <div className="text-slate-light/60 font-medium mb-1">Parameters:</div>
            <pre className="bg-slate-dark text-white rounded-base p-2.5 overflow-x-auto text-xs leading-relaxed">
              {formatJson(toolCall.parameters)}
            </pre>
          </div>

          {/* Result */}
          {toolCall.result && (
            <div>
              <div className="text-slate-light/60 font-medium mb-1">Result:</div>
              <pre className="bg-slate-dark text-white rounded-base p-2.5 overflow-x-auto text-xs leading-relaxed">
                {formatJson(toolCall.result)}
              </pre>
            </div>
          )}

          {/* Execution Time */}
          <div className="text-slate-light/40">
            Executed at: {new Date(toolCall.executed_at).toLocaleTimeString()}
          </div>
        </div>
      )}
    </div>
  );
};

export default ToolCallDisplay;
