/**
 * ToolCallDisplay Component Tests (T059)
 *
 * Tests for tool call formatting and display:
 * - Tool name display (T055)
 * - Parameter formatting (T055)
 * - Result formatting (T055)
 * - Expandable UI (T055)
 */

import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import ToolCallDisplay from './ToolCallDisplay';

describe('ToolCallDisplay Component (T059)', () => {
  const mockToolCall = {
    id: 1,
    tool_name: 'TestTool',
    parameters: {
      query: 'test query',
      limit: 10,
    },
    result: {
      success: true,
      data: ['item1', 'item2'],
    },
    executed_at: new Date('2026-02-03T10:30:05Z').toISOString(),
  };

  describe('Initial Rendering', () => {
    it('should render tool call display', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      expect(screen.getByText('TestTool')).toBeInTheDocument();
    });

    it('should display tool name as header', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const toolName = screen.getByText('TestTool');
      expect(toolName.className).toContain('font-semibold');
    });

    it('should display expand indicator', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      expect(screen.getByText('▶')).toBeInTheDocument();
    });

    it('should not display details initially', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      expect(screen.queryByText('Parameters:')).not.toBeInTheDocument();
      expect(screen.queryByText('Result:')).not.toBeInTheDocument();
    });
  });

  describe('Expand/Collapse Functionality (T055)', () => {
    it('should expand when tool name is clicked', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const toolName = screen.getByText('TestTool');
      fireEvent.click(toolName.closest('button')!);

      expect(screen.getByText('Parameters:')).toBeInTheDocument();
      expect(screen.getByText('Result:')).toBeInTheDocument();
    });

    it('should change expand indicator when expanded', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.queryByText('▶')).not.toBeInTheDocument();
    });

    it('should collapse when clicked again', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;

      // Expand
      fireEvent.click(button);
      expect(screen.getByText('Parameters:')).toBeInTheDocument();

      // Collapse
      fireEvent.click(button);
      expect(screen.queryByText('Parameters:')).not.toBeInTheDocument();
    });

    it('should toggle between expand and collapse', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;

      // Start collapsed with ▶
      expect(screen.getByText('▶')).toBeInTheDocument();

      // Click to expand - should show ▼
      fireEvent.click(button);
      expect(screen.getByText('▼')).toBeInTheDocument();
      expect(screen.queryByText('▶')).not.toBeInTheDocument();

      // Click to collapse - should show ▶
      fireEvent.click(button);
      expect(screen.getByText('▶')).toBeInTheDocument();
      expect(screen.queryByText('▼')).not.toBeInTheDocument();
    });
  });

  describe('Parameters Display (T055)', () => {
    it('should display parameters section when expanded', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText('Parameters:')).toBeInTheDocument();
    });

    it('should format parameters as JSON', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const parameters = screen.getByText(/Parameters:/).parentElement;
      expect(parameters?.textContent).toContain('query');
      expect(parameters?.textContent).toContain('test query');
      expect(parameters?.textContent).toContain('limit');
      expect(parameters?.textContent).toContain('10');
    });

    it('should handle complex parameter objects', () => {
      const complexToolCall = {
        ...mockToolCall,
        parameters: {
          nested: {
            level1: {
              level2: 'value',
            },
          },
          array: [1, 2, 3],
        },
      };

      render(<ToolCallDisplay toolCall={complexToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const parametersContainer = screen.getByText(/Parameters:/).parentElement;
      expect(parametersContainer?.textContent).toContain('nested');
      expect(parametersContainer?.textContent).toContain('level1');
    });
  });

  describe('Result Display (T055)', () => {
    it('should display result section when expanded and result exists', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText('Result:')).toBeInTheDocument();
    });

    it('should format result as JSON', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const result = screen.getByText(/Result:/).parentElement;
      expect(result?.textContent).toContain('success');
      expect(result?.textContent).toContain('true');
      expect(result?.textContent).toContain('data');
      expect(result?.textContent).toContain('item1');
      expect(result?.textContent).toContain('item2');
    });

    it('should not display result section if result is undefined', () => {
      const toolCallWithoutResult = {
        ...mockToolCall,
        result: undefined,
      };

      render(<ToolCallDisplay toolCall={toolCallWithoutResult} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      expect(screen.queryByText('Result:')).not.toBeInTheDocument();
    });

    it('should handle complex result objects', () => {
      const complexToolCall = {
        ...mockToolCall,
        result: {
          nested: {
            items: [
              { id: 1, name: 'Item 1' },
              { id: 2, name: 'Item 2' },
            ],
          },
        },
      };

      render(<ToolCallDisplay toolCall={complexToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const resultContainer = screen.getByText(/Result:/).parentElement;
      expect(resultContainer?.textContent).toContain('nested');
      expect(resultContainer?.textContent).toContain('items');
      expect(resultContainer?.textContent).toContain('Item 1');
    });
  });

  describe('Execution Time Display', () => {
    it('should display execution timestamp when expanded', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      expect(screen.getByText(/Executed at:/)).toBeInTheDocument();
    });

    it('should format timestamp as time string', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const executedAt = screen.getByText(/Executed at:/).textContent;
      expect(executedAt).toContain('Executed at:');
    });
  });

  describe('Styling', () => {
    it('should have appropriate styling for header', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const header = screen.getByText('TestTool');
      expect(header.className).toContain('font-semibold');
      expect(header.className).toContain('text-gray-700');
    });

    it('should have pre-formatted text blocks for JSON', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const preBlocks = document.querySelectorAll('pre');
      expect(preBlocks.length).toBeGreaterThan(0);
    });

    it('should have readonly background for JSON display', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const preBlocks = document.querySelectorAll('pre');
      preBlocks.forEach((pre) => {
        expect(pre.className).toContain('bg-gray-50');
      });
    });
  });

  describe('Different Tool Names', () => {
    it('should display different tool names correctly', () => {
      const tools = [
        { ...mockToolCall, tool_name: 'FileTool' },
        { ...mockToolCall, tool_name: 'DatabaseQuery' },
        { ...mockToolCall, tool_name: 'WebScraper' },
      ];

      tools.forEach((tool) => {
        const { rerender } = render(<ToolCallDisplay toolCall={tool} />);
        expect(screen.getByText(tool.tool_name)).toBeInTheDocument();
        rerender(<ToolCallDisplay toolCall={tools[0]} />);
      });
    });
  });

  describe('JSON Formatting (T055)', () => {
    it('should use proper JSON.stringify formatting', () => {
      render(<ToolCallDisplay toolCall={mockToolCall} />);

      const button = screen.getByText('TestTool').closest('button')!;
      fireEvent.click(button);

      const parametersBlock = screen.getByText(/Parameters:/).parentElement?.querySelector('pre');
      const jsonText = parametersBlock?.textContent;

      // Check for JSON formatting (indentation)
      expect(jsonText).toContain('"query"');
      expect(jsonText).toContain('"limit"');
    });
  });
});
